"""
Paystack Payment Integration Routes
Handles initializing checkout and the Paystack webhook (charge.success).
"""
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import hashlib
import hmac
import json
import logging
import os
import httpx

from models.subscription import SubscriptionTier, BillingCycle, PRICING
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/payments", tags=["Payments"])
logger = logging.getLogger(__name__)

PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")
PAYSTACK_BASE_URL = "https://api.paystack.co"


class InitializePaymentRequest(BaseModel):
    billing_cycle: BillingCycle
    origin_url: str


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

    amount_rand = PRICING[SubscriptionTier.PREMIUM][payload.billing_cycle]
    amount_kobo = int(round(amount_rand * 100))

    origin = payload.origin_url.rstrip("/")
    callback_url = f"{origin}/payment/success"

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                json={
                    "email": current_user["email"],
                    "amount": amount_kobo,
                    "currency": "ZAR",
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

    data = resp.json()
    if not data.get("status"):
        logger.error(f"Paystack initialize failed: {data}")
        raise HTTPException(status_code=502, detail=data.get("message", "Failed to start payment"))

    return {
        "authorization_url": data["data"]["authorization_url"],
        "reference": data["data"]["reference"],
    }


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

    amount_rand = (data.get("amount") or 0) / 100
    metadata = data.get("metadata") or {}
    user_id = metadata.get("user_id", "")
    billing_cycle = metadata.get("billing_cycle", "monthly")
    email = (data.get("customer") or {}).get("email", "")
    status = data.get("status", "")

    await db.paystack_transactions.update_one(
        {"reference": reference},
        {"$set": {
            "reference": reference,
            "status": status,
            "amount": amount_rand,
            "user_id": user_id,
            "email": email,
            "billing_cycle": billing_cycle,
            "raw_payload": data,
            "received_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )

    if status == "success":
        await activate_premium_subscription(user_id, email, reference, amount_rand, billing_cycle)
        await db.paystack_transactions.update_one(
            {"reference": reference},
            {"$set": {"processed": True, "processed_at": datetime.now(timezone.utc)}}
        )


async def activate_premium_subscription(user_id: str, email: str, reference: str, amount: float, billing_cycle: str):
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

    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "tier": SubscriptionTier.PREMIUM.value,
            "billing_cycle": billing_cycle,
            "status": "active",
            "payment_method": "paystack",
            "current_period_start": now,
            "current_period_end": period_end,
            "last_payment_id": reference,
            "last_payment_amount": amount,
            "last_payment_date": now,
            "updated_at": now,
        }},
        upsert=True,
    )

    logger.info(f"Activated premium subscription for user {user_id} via Paystack payment {reference}")


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
            except httpx.HTTPError as e:
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
