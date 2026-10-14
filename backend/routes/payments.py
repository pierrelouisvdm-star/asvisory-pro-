"""
Paystack Payment Integration Routes
Handles initializing checkout and the Paystack webhook (charge.success).
"""
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import asyncio
import hashlib
import hmac
import json
import logging
import os
import httpx
import resend

from models.subscription import SubscriptionTier, BillingCycle, PRICING, FOUNDING_PRICING, FOUNDING_MEMBER_LIMIT_PER_JURISDICTION
from utils.auth import get_current_user
from utils.founding import count_founding_members_by_currency, compute_community_grant
from utils.refunds import get_refund_eligibility
from server import db

router = APIRouter(prefix="/payments", tags=["Payments"])
logger = logging.getLogger(__name__)

PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")
PAYSTACK_BASE_URL = "https://api.paystack.co"

resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "support@advisorypro.co.za")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")

CURRENCY_SYMBOL = {"zar": "R", "usd": "$"}


class InitializePaymentRequest(BaseModel):
    billing_cycle: BillingCycle
    origin_url: str
    jurisdiction: str = "ZA"  # "ZA" or "US" — determines currency (zar/usd)


@router.post("/paystack/initialize")
async def initialize_paystack_payment(
    payload: InitializePaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Start a Paystack checkout for the Premium plan and return the hosted payment URL."""
    if not PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")

    if payload.billing_cycle not in PRICING[SubscriptionTier.PREMIUM]:
        raise HTTPException(status_code=400, detail="Invalid billing cycle")

    currency = "usd" if payload.jurisdiction == "US" else "zar"

    amount = PRICING[SubscriptionTier.PREMIUM][payload.billing_cycle][currency]
    if payload.billing_cycle == BillingCycle.ANNUAL:
        existing_sub = await db.subscriptions.find_one({"user_id": current_user["id"]})
        if existing_sub and existing_sub.get("founding_member") and existing_sub.get("founding_currency") == currency:
            # Founding members keep their locked-in annual price on every renewal
            amount = existing_sub["founding_price"]
        else:
            currency_founding_count = await count_founding_members_by_currency(db, currency)
            if currency_founding_count < FOUNDING_MEMBER_LIMIT_PER_JURISDICTION:
                amount = FOUNDING_PRICING[currency]
    amount_subunits = int(round(amount * 100))

    origin = payload.origin_url.rstrip("/")
    callback_url = f"{origin}/payment/success"

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                json={
                    "email": current_user["email"],
                    "amount": amount_subunits,
                    "currency": currency.upper(),
                    "callback_url": callback_url,
                    "metadata": {
                        "user_id": current_user["id"],
                        "billing_cycle": payload.billing_cycle.value,
                    },
                },
                timeout=30.0,
            )
        except httpx.HTTPError as e:
            logger.error(f"Paystack initialize request failed: {e}")
            raise HTTPException(status_code=502, detail="Payment provider unreachable")

    try:
        data = resp.json()
    except ValueError:
        logger.error(f"Paystack initialize returned non-JSON response (status {resp.status_code}): {resp.text[:500]}")
        raise HTTPException(status_code=502, detail="Payment provider returned an unexpected response")

    if not data.get("status"):
        logger.error(f"Paystack initialize failed (status {resp.status_code}): {data}")
        raise HTTPException(status_code=502, detail=data.get("message", "Failed to start payment"))

    try:
        return {
            "authorization_url": data["data"]["authorization_url"],
            "reference": data["data"]["reference"],
        }
    except KeyError:
        logger.error(f"Paystack initialize succeeded but response shape was unexpected: {data}")
        raise HTTPException(status_code=502, detail="Payment provider returned an unexpected response")


def verify_paystack_signature(raw_body: bytes, signature: str) -> bool:
    """Paystack signs webhook bodies with HMAC-SHA512 using the secret key."""
    if not PAYSTACK_SECRET_KEY or not signature:
        return False
    computed = hmac.new(PAYSTACK_SECRET_KEY.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(computed, signature)


@router.post("/paystack-webhook")
async def paystack_webhook(request: Request):
    """
    Handle Paystack webhook events.
    Paystack expects a 200 OK response to confirm receipt.
    """
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    if not verify_paystack_signature(raw_body, signature):
        logger.warning("Paystack webhook signature verification failed")
        return Response(content="OK", status_code=200)

    try:
        event = json.loads(raw_body)
    except ValueError:
        logger.warning("Paystack webhook sent invalid JSON")
        return Response(content="OK", status_code=200)

    try:
        if event.get("event") == "charge.success":
            await process_paystack_charge(event.get("data", {}))
    except Exception as e:
        logger.error(f"Error processing Paystack webhook: {str(e)}", exc_info=True)

    return Response(content="OK", status_code=200)


async def process_paystack_charge(data: dict):
    """Record a Paystack charge and activate the subscription if it succeeded."""
    reference = data.get("reference", "")
    if not reference:
        return

    existing = await db.paystack_transactions.find_one({"reference": reference})
    if existing and existing.get("processed"):
        logger.info(f"Duplicate Paystack charge ignored: {reference}")
        return

    amount_major = (data.get("amount") or 0) / 100
    metadata = data.get("metadata") or {}
    user_id = metadata.get("user_id", "")
    billing_cycle = metadata.get("billing_cycle", "monthly")
    email = (data.get("customer") or {}).get("email", "")
    status = data.get("status", "")
    currency = (data.get("currency") or "ZAR").lower()

    await db.paystack_transactions.update_one(
        {"reference": reference},
        {"$set": {
            "reference": reference,
            "status": status,
            "amount": amount_major,
            "currency": currency,
            "user_id": user_id,
            "email": email,
            "billing_cycle": billing_cycle,
            "raw_payload": data,
            "received_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )

    if status == "success":
        await activate_premium_subscription(user_id, email, reference, amount_major, billing_cycle, currency)
        await db.paystack_transactions.update_one(
            {"reference": reference},
            {"$set": {"processed": True, "processed_at": datetime.now(timezone.utc)}}
        )


async def activate_premium_subscription(user_id: str, email: str, reference: str, amount: float, billing_cycle: str, currency: str = "zar"):
    """Activate or extend the user's premium subscription after a successful Paystack charge."""
    user = None
    if user_id:
        user = await db.users.find_one({"id": user_id})
    if not user and email:
        user = await db.users.find_one({"email": email})

    if not user:
        logger.error(f"Cannot find user for Paystack payment: user_id={user_id}, email={email}")
        return

    user_id = user["id"]
    duration_days = 365 if billing_cycle == "annual" else 30

    now = datetime.now(timezone.utc)
    period_end = now + timedelta(days=duration_days)

    existing_sub = await db.subscriptions.find_one({"user_id": user_id})
    if existing_sub and existing_sub.get("status") == "active":
        current_end = existing_sub.get("current_period_end", now)
        if isinstance(current_end, datetime) and current_end > now:
            period_end = current_end + timedelta(days=duration_days)

    update_fields = {
        "user_id": user_id,
        "tier": SubscriptionTier.PREMIUM.value,
        "billing_cycle": billing_cycle,
        "status": "active",
        "payment_method": "paystack",
        "currency": currency,
        "current_period_start": now,
        "current_period_end": period_end,
        "last_payment_id": reference,
        "last_payment_amount": amount,
        "last_payment_date": now,
        "updated_at": now,
    }
    if billing_cycle == "annual" and not (existing_sub or {}).get("first_annual_payment_at"):
        # Tracks the user's first-ever annual charge, for the 7-day refund window — never overwritten on renewal.
        update_fields["first_annual_payment_at"] = now
        update_fields["first_annual_payment_id"] = reference

    is_founding_payment = billing_cycle == "annual" and amount == FOUNDING_PRICING.get(currency)
    if is_founding_payment:
        update_fields.update({
            "founding_member": True,
            "founding_price": FOUNDING_PRICING[currency],
            "founding_currency": currency,
            "priority_support": True,
        })
    update_fields.update(await compute_community_grant(db, existing_sub, is_founding_payment))

    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": update_fields},
        upsert=True,
    )

    logger.info(f"Activated premium subscription for user {user_id} via Paystack payment {reference}")


async def send_refund_confirmation_email(to_email: str, user_name: str, amount: float, currency: str):
    """Confirm to the user that their 7-day refund has been processed"""
    first_name = user_name.split()[0] if user_name else "there"
    symbol = CURRENCY_SYMBOL.get(currency, "")
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">AdvisoryPro</h1>
            <p style="color: #94a3b8; margin: 10px 0 0 0;">Refund confirmation</p>
        </div>

        <p style="font-size: 16px;">Hi {first_name},</p>

        <p style="font-size: 16px;">Your refund of {symbol}{amount:,.2f} has been processed under our 7-day money-back guarantee. Your account has been moved back to the Free plan, and the refund should reflect on your original payment method within a few business days, depending on your bank.</p>

        <p style="font-size: 14px; color: #64748b;">Changed your mind, or something didn't work for you? Reply and let us know, or reach us any time at {SENDER_EMAIL}.</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            © 2026 AdvisoryPro. All rights reserved.<br>
            This is an automated message, please do not reply.
        </p>
    </body>
    </html>
    """
    params = {
        "from": f"AdvisoryPro <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": "Your AdvisoryPro refund has been processed",
        "html": html_content,
    }
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Refund confirmation email sent to {to_email}, email_id: {email.get('id')}")
    except Exception as e:
        logger.error(f"Failed to send refund confirmation email to {to_email}: {str(e)}")


async def notify_admin_of_refund(admin_email: str, user_email: str, amount: float, currency: str, was_founding_member: bool):
    """Let the business owner know a refund was processed, since there's no admin dashboard for this yet"""
    symbol = CURRENCY_SYMBOL.get(currency, "")
    params = {
        "from": f"AdvisoryPro <{SENDER_EMAIL}>",
        "to": [admin_email],
        "subject": "AdvisoryPro refund processed",
        "html": f"""
        <p>A 7-day refund was processed for <strong>{user_email}</strong>.</p>
        <ul>
            <li>Amount: {symbol}{amount:,.2f}</li>
            <li>Was founding member: {'Yes — slot released back to the pool' if was_founding_member else 'No'}</li>
        </ul>
        """,
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Failed to send refund admin notification: {str(e)}")


@router.get("/paystack-status/{reference}")
async def get_paystack_status(reference: str, current_user: dict = Depends(get_current_user)):
    """
    Check whether a Paystack payment has been processed.
    Falls back to verifying directly with Paystack in case the webhook hasn't arrived yet.
    """
    transaction = await db.paystack_transactions.find_one(
        {"reference": reference},
        {"_id": 0, "raw_payload": 0}
    )

    if transaction and transaction.get("processed"):
        return {"reference": reference, "status": "success", "processed": True}

    if PAYSTACK_SECRET_KEY:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                    headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                    timeout=30.0,
                )
                data = resp.json()
            except (httpx.HTTPError, ValueError) as e:
                logger.error(f"Paystack verify request failed: {e}")
                data = {}

        if data.get("status") and data.get("data", {}).get("status") == "success":
            await process_paystack_charge(data["data"])
            return {"reference": reference, "status": "success", "processed": True}

    return {
        "reference": reference,
        "status": transaction.get("status") if transaction else "pending",
        "processed": False,
    }


class RefundResponse(BaseModel):
    success: bool
    message: str


@router.post("/paystack/refund", response_model=RefundResponse)
async def request_refund(current_user: dict = Depends(get_current_user)):
    """
    Self-service 7-day money-back guarantee, available once per account on a
    user's first-ever annual Premium charge only (never a renewal).
    """
    user_id = current_user["id"]
    subscription = await db.subscriptions.find_one({"user_id": user_id})

    eligible, _ = get_refund_eligibility(subscription)
    if not eligible:
        raise HTTPException(status_code=400, detail="This subscription isn't eligible for a refund")

    if not PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")

    reference = subscription["first_annual_payment_id"]

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{PAYSTACK_BASE_URL}/refund",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                json={"transaction": reference},
                timeout=30.0,
            )
    except httpx.HTTPError as e:
        logger.error(f"Paystack refund request failed for {reference}: {e}")
        raise HTTPException(status_code=502, detail="Payment provider is unreachable")

    try:
        data = resp.json()
    except ValueError:
        logger.error(f"Paystack refund returned non-JSON response (status {resp.status_code}): {resp.text[:500]}")
        raise HTTPException(status_code=502, detail="Payment provider returned an unexpected response")

    if not data.get("status"):
        logger.error(f"Paystack refund failed for {reference}: {data}")
        raise HTTPException(status_code=502, detail=data.get("message", "Refund could not be processed"))

    now = datetime.now(timezone.utc)
    was_founding = subscription.get("founding_member", False)
    amount = subscription.get("last_payment_amount")
    currency = subscription.get("currency", "zar")

    update_fields = {
        "tier": SubscriptionTier.FREE.value,
        "status": "refunded",
        "refund_claimed_at": now,
        "updated_at": now,
    }
    if was_founding:
        # Releases the slot back to the 200-per-jurisdiction founding pool for someone else.
        update_fields.update({
            "founding_member": False,
            "founding_price": None,
            "founding_currency": None,
            "priority_support": False,
        })

    await db.subscriptions.update_one({"user_id": user_id}, {"$set": update_fields})

    await db.refunds.insert_one({
        "user_id": user_id,
        "email": current_user["email"],
        "reference": reference,
        "amount": amount,
        "currency": currency,
        "was_founding_member": was_founding,
        "created_at": now,
    })

    asyncio.create_task(send_refund_confirmation_email(
        current_user["email"], current_user.get("full_name"), amount, currency,
    ))
    if ADMIN_EMAIL:
        asyncio.create_task(notify_admin_of_refund(
            ADMIN_EMAIL, current_user["email"], amount, currency, was_founding,
        ))

    logger.info(f"Processed refund for user {user_id}, reference {reference}")
    return RefundResponse(success=True, message="Your refund has been processed and your plan has moved back to Free.")
