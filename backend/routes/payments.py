"""
PayFast Payment Integration Routes
Handles PayFast ITN (Instant Transaction Notification) webhooks
"""
from fastapi import APIRouter, Request, Response, HTTPException
from datetime import datetime, timezone, timedelta
import hashlib
import urllib.parse
import logging
import os

from server import db

router = APIRouter(prefix="/payments", tags=["Payments"])
logger = logging.getLogger(__name__)

# PayFast sandbox IPs (add production IPs when going live)
PAYFAST_IPS = [
    "197.97.145.144",
    "197.97.145.145",
    "197.97.145.146",
    "197.97.145.147",
    "41.74.179.194",
    "41.74.179.195",
    "41.74.179.196",
    "41.74.179.197"
]

# PayFast configuration (sandbox values for testing)
PAYFAST_MERCHANT_ID = os.environ.get("PAYFAST_MERCHANT_ID", "10000100")
PAYFAST_MERCHANT_KEY = os.environ.get("PAYFAST_MERCHANT_KEY", "46f0cd694581a")
PAYFAST_PASSPHRASE = os.environ.get("PAYFAST_PASSPHRASE", "")


def calculate_signature(post_data: dict, passphrase: str = "") -> str:
    """
    Calculate PayFast signature according to official specification.
    
    PayFast requires all non-blank variables (excluding signature) to be
    URL-encoded and concatenated in a specific order, then MD5 hashed.
    """
    # Define the correct parameter order as per PayFast documentation
    field_order = [
        "m_payment_id", "pf_payment_id", "payment_status", "item_name",
        "item_description", "amount_gross", "amount_fee", "amount_net",
        "custom_str1", "custom_str2", "custom_str3", "custom_str4", "custom_str5",
        "custom_int1", "custom_int2", "custom_int3", "custom_int4", "custom_int5",
        "name_first", "name_last", "email_address", "merchant_id",
    ]
    
    # Build the signature string from provided data in correct order
    sig_parts = []
    for key in field_order:
        if key in post_data and post_data[key]:
            value = str(post_data[key]).strip()
            if value:
                encoded_value = urllib.parse.quote_plus(value)
                sig_parts.append(f"{key}={encoded_value}")
    
    # For any additional fields not in field_order (except signature)
    for key, value in post_data.items():
        if key not in field_order and key != "signature" and value:
            value_str = str(value).strip()
            if value_str:
                encoded_value = urllib.parse.quote_plus(value_str)
                sig_parts.append(f"{key}={encoded_value}")
    
    # Join all parts with &
    signature_string = "&".join(sig_parts)
    
    # Add passphrase if provided
    if passphrase:
        signature_string += f"&passphrase={urllib.parse.quote_plus(passphrase)}"
    
    # Generate MD5 hash
    return hashlib.md5(signature_string.encode()).hexdigest()


def verify_signature(post_data: dict, provided_signature: str) -> bool:
    """Verify that the webhook signature is valid."""
    calculated = calculate_signature(post_data, PAYFAST_PASSPHRASE)
    return calculated.lower() == provided_signature.lower()


@router.post("/payfast-notify")
async def payfast_itn_handler(request: Request):
    """
    Handle PayFast Instant Transaction Notification (ITN) webhooks.
    
    This endpoint receives payment notifications from PayFast after
    a user completes (or cancels/fails) a payment.
    
    PayFast expects a 200 OK response to confirm receipt.
    """
    try:
        # Parse form data from PayFast
        form_data = await request.form()
        post_data = {key: value for key, value in form_data.items()}
        
        logger.info(f"PayFast ITN received: payment_id={post_data.get('m_payment_id')}, "
                   f"status={post_data.get('payment_status')}")
        
        # Extract key fields
        m_payment_id = post_data.get("m_payment_id", "")
        pf_payment_id = post_data.get("pf_payment_id", "")
        payment_status = post_data.get("payment_status", "")
        amount_gross = post_data.get("amount_gross", "0")
        signature = post_data.get("signature", "")
        user_id = post_data.get("custom_str1", "")  # We store user_id in custom_str1
        email = post_data.get("email_address", "")
        
        # Log the notification details
        logger.info(f"Processing PayFast notification: "
                   f"payment_id={m_payment_id}, pf_id={pf_payment_id}, "
                   f"status={payment_status}, amount={amount_gross}, user_id={user_id}")
        
        # Verify signature (skip if no passphrase configured - sandbox mode)
        post_data_for_sig = {k: v for k, v in post_data.items() if k != "signature"}
        if PAYFAST_PASSPHRASE:
            if not verify_signature(post_data_for_sig, signature):
                logger.warning(f"PayFast signature verification failed for {m_payment_id}")
                # Still return 200 to prevent retries, but don't process
                return Response(content="OK", status_code=200)
        
        # Check for duplicate notifications
        existing = await db.payfast_transactions.find_one({
            "m_payment_id": m_payment_id,
            "pf_payment_id": pf_payment_id
        })
        
        if existing:
            logger.info(f"Duplicate PayFast notification ignored: {m_payment_id}")
            return Response(content="OK", status_code=200)
        
        # Store the transaction
        transaction = {
            "m_payment_id": m_payment_id,
            "pf_payment_id": pf_payment_id,
            "payment_status": payment_status,
            "amount_gross": float(amount_gross) if amount_gross else 0,
            "amount_fee": float(post_data.get("amount_fee", "0")),
            "amount_net": float(post_data.get("amount_net", "0")),
            "user_id": user_id,
            "email_address": email,
            "item_name": post_data.get("item_name", ""),
            "raw_payload": post_data,
            "received_at": datetime.now(timezone.utc),
            "processed": False
        }
        
        await db.payfast_transactions.insert_one(transaction)
        
        # Process payment based on status
        if payment_status == "COMPLETE":
            await process_successful_payment(user_id, email, m_payment_id, float(amount_gross))
        elif payment_status == "FAILED":
            logger.warning(f"PayFast payment failed: {m_payment_id}")
        elif payment_status == "PENDING":
            logger.info(f"PayFast payment pending: {m_payment_id}")
        elif payment_status == "CANCELLED":
            logger.info(f"PayFast payment cancelled: {m_payment_id}")
        
        # Mark transaction as processed
        await db.payfast_transactions.update_one(
            {"m_payment_id": m_payment_id, "pf_payment_id": pf_payment_id},
            {"$set": {"processed": True, "processed_at": datetime.now(timezone.utc)}}
        )
        
        # Always return 200 OK to acknowledge receipt
        return Response(content="OK", status_code=200)
        
    except Exception as e:
        logger.error(f"Error processing PayFast ITN: {str(e)}", exc_info=True)
        # Still return 200 to prevent PayFast from retrying
        return Response(content="OK", status_code=200)


async def process_successful_payment(user_id: str, email: str, payment_id: str, amount: float):
    """
    Process a successful PayFast payment.
    Activates or extends the user's premium subscription.
    """
    try:
        # Find the user
        user = None
        if user_id:
            user = await db.users.find_one({"id": user_id})
        if not user and email:
            user = await db.users.find_one({"email": email})
        
        if not user:
            logger.error(f"Cannot find user for PayFast payment: user_id={user_id}, email={email}")
            return
        
        user_id = user["id"]
        
        # Calculate subscription period (monthly billing = 30 days)
        now = datetime.now(timezone.utc)
        period_end = now + timedelta(days=30)
        
        # Check if user has an existing subscription
        existing_sub = await db.subscriptions.find_one({"user_id": user_id})
        
        if existing_sub and existing_sub.get("status") == "active":
            # Extend existing subscription
            current_end = existing_sub.get("current_period_end", now)
            if isinstance(current_end, datetime) and current_end > now:
                period_end = current_end + timedelta(days=30)
        
        # Update or create subscription
        subscription_data = {
            "user_id": user_id,
            "tier": "premium",
            "billing_cycle": "monthly",
            "status": "active",
            "payment_method": "payfast",
            "current_period_start": now,
            "current_period_end": period_end,
            "last_payment_id": payment_id,
            "last_payment_amount": amount,
            "last_payment_date": now,
            "updated_at": now
        }
        
        await db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": subscription_data},
            upsert=True
        )
        
        logger.info(f"Activated premium subscription for user {user_id} via PayFast payment {payment_id}")
        
    except Exception as e:
        logger.error(f"Error processing successful payment: {str(e)}", exc_info=True)


@router.get("/payfast-status/{payment_id}")
async def get_payfast_status(payment_id: str):
    """
    Get the status of a PayFast payment by merchant payment ID.
    """
    transaction = await db.payfast_transactions.find_one(
        {"m_payment_id": payment_id},
        {"_id": 0, "raw_payload": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "payment_id": transaction.get("m_payment_id"),
        "status": transaction.get("payment_status"),
        "amount": transaction.get("amount_gross"),
        "processed": transaction.get("processed", False),
        "received_at": transaction.get("received_at")
    }
