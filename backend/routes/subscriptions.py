from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

from utils.emergent_compat import (
    StripeCheckout,
    CheckoutSessionRequest,
    CheckoutSessionResponse
)

from models.subscription import (
    SubscriptionTier, BillingCycle, PRICING, TIER_FEATURES,
    FOUNDING_PRICING, FOUNDING_MEMBER_LIMIT,
    CheckoutRequest, CheckoutResponse, UserSubscriptionInfo,
    SubscriptionResponse
)
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

# Trial period in days
TRIAL_DAYS = 7

async def get_user_subscription(user_id: str) -> dict:
    """Get user's current subscription or return free tier"""
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    if subscription:
        return subscription
    return {
        "user_id": user_id,
        "tier": SubscriptionTier.FREE,
        "status": "active",
        "features": TIER_FEATURES[SubscriptionTier.FREE]
    }

async def check_feature_access(user_id: str, feature: str) -> bool:
    """Check if user has access to a specific feature"""
    subscription = await get_user_subscription(user_id)
    tier = subscription.get("tier", SubscriptionTier.FREE)
    features = TIER_FEATURES.get(tier, TIER_FEATURES[SubscriptionTier.FREE])
    return features.get(feature, False)

@router.get("/current", response_model=UserSubscriptionInfo)
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription info"""
    user_id = current_user["id"]
    subscription = await get_user_subscription(user_id)
    tier = subscription.get("tier", SubscriptionTier.FREE)
    
    return UserSubscriptionInfo(
        tier=tier,
        billing_cycle=subscription.get("billing_cycle"),
        status=subscription.get("status", "active"),
        features=TIER_FEATURES.get(tier, TIER_FEATURES[SubscriptionTier.FREE]),
        trial_ends_at=subscription.get("trial_ends_at"),
        current_period_end=subscription.get("current_period_end"),
        founding_member=subscription.get("founding_member", False),
        priority_support=subscription.get("priority_support", False)
    )

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: Request,
    checkout_data: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session for subscription"""
    user_id = current_user["id"]
    user_email = current_user["email"]
    
    # Get price from server-side config (never from frontend)
    tier = checkout_data.tier
    billing_cycle = checkout_data.billing_cycle
    
    if tier == SubscriptionTier.FREE:
        raise HTTPException(status_code=400, detail="Cannot checkout for free tier")

    currency = "usd" if checkout_data.jurisdiction == "US" else "zar"
    amount = PRICING[tier][billing_cycle][currency]

    if billing_cycle == BillingCycle.ANNUAL and currency in FOUNDING_PRICING:
        existing_sub = await db.subscriptions.find_one({"user_id": user_id})
        if existing_sub and existing_sub.get("founding_member") and existing_sub.get("founding_currency") == currency:
            # Founding members keep their locked-in annual price on every renewal
            amount = existing_sub["founding_price"]
        else:
            founding_count = await db.payment_transactions.count_documents({
                "payment_status": "paid",
                "billing_cycle": billing_cycle.value,
                "amount": FOUNDING_PRICING[currency],
            })
            if founding_count < FOUNDING_MEMBER_LIMIT:
                amount = FOUNDING_PRICING[currency]

    # Initialize Stripe
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Build URLs from origin
    origin = checkout_data.origin_url.rstrip("/")
    success_url = f"{origin}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency=currency,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user_id,
            "user_email": user_email,
            "tier": tier.value,
            "billing_cycle": billing_cycle.value
        }
    )

    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)

    # Create pending transaction record
    transaction = {
        "user_id": user_id,
        "email": user_email,
        "session_id": session.session_id,
        "tier": tier.value,
        "billing_cycle": billing_cycle.value,
        "amount": amount,
        "currency": currency,
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction)
    
    return CheckoutResponse(
        checkout_url=session.url,
        session_id=session.session_id
    )

@router.get("/checkout/status/{session_id}")
async def get_checkout_status(
    request: Request,
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check payment status and activate subscription if paid"""
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Get transaction from DB
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already processed, don't process again
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "message": "Subscription already activated"
        }
    
    # Update transaction status
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": status.status,
            "payment_status": status.payment_status,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # If payment successful, activate subscription
    if status.payment_status == "paid":
        tier = SubscriptionTier(transaction["tier"])
        billing_cycle = BillingCycle(transaction["billing_cycle"])
        
        # Calculate period end
        if billing_cycle == BillingCycle.MONTHLY:
            period_end = datetime.now(timezone.utc) + timedelta(days=30)
        else:
            period_end = datetime.now(timezone.utc) + timedelta(days=365)
        
        # Upsert subscription
        update_fields = {
            "user_id": transaction["user_id"],
            "tier": tier.value,
            "billing_cycle": billing_cycle.value,
            "status": "active",
            "current_period_start": datetime.now(timezone.utc),
            "current_period_end": period_end,
            "updated_at": datetime.now(timezone.utc)
        }
        transaction_currency = transaction.get("currency")
        if billing_cycle == BillingCycle.ANNUAL and transaction_currency in FOUNDING_PRICING \
                and transaction.get("amount") == FOUNDING_PRICING[transaction_currency]:
            update_fields.update({
                "founding_member": True,
                "founding_price": FOUNDING_PRICING[transaction_currency],
                "founding_currency": transaction_currency,
                "priority_support": True,
            })

        await db.subscriptions.update_one(
            {"user_id": transaction["user_id"]},
            {"$set": update_fields},
            upsert=True
        )
        
        return {
            "status": "complete",
            "payment_status": "paid",
            "tier": tier.value,
            "message": "Subscription activated successfully"
        }
    
    return {
        "status": status.status,
        "payment_status": status.payment_status
    }

@router.post("/start-trial")
async def start_free_trial(
    tier: SubscriptionTier,
    current_user: dict = Depends(get_current_user)
):
    """Start a free trial for a paid tier"""
    user_id = current_user["id"]
    
    if tier == SubscriptionTier.FREE:
        raise HTTPException(status_code=400, detail="Cannot trial free tier")
    
    # Check if user already had a trial
    existing = await db.subscriptions.find_one({
        "user_id": user_id,
        "had_trial": True
    })
    if existing:
        raise HTTPException(status_code=400, detail="Trial already used")

    trial_end = datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS)

    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "tier": tier.value,
            "status": "trialing",
            "trial_ends_at": trial_end,
            "had_trial": True,
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    return {
        "message": f"Free {TRIAL_DAYS}-day trial started",
        "tier": tier.value,
        "trial_ends_at": trial_end
    }

@router.get("/pricing")
async def get_pricing():
    """Get pricing information for all tiers"""
    return {
        "tiers": [
            {
                "tier": SubscriptionTier.FREE.value,
                "name": "Free",
                "monthly_price_zar": 0,
                "annual_price_zar": 0,
                "monthly_price_usd": 0,
                "annual_price_usd": 0,
                "features": TIER_FEATURES[SubscriptionTier.FREE],
                "description": "Basic calculators to get started"
            },
            {
                "tier": SubscriptionTier.PREMIUM.value,
                "name": "Premium",
                "monthly_price_zar": PRICING[SubscriptionTier.PREMIUM][BillingCycle.MONTHLY]["zar"],
                "annual_price_zar": PRICING[SubscriptionTier.PREMIUM][BillingCycle.ANNUAL]["zar"],
                "monthly_price_usd": PRICING[SubscriptionTier.PREMIUM][BillingCycle.MONTHLY]["usd"],
                "annual_price_usd": PRICING[SubscriptionTier.PREMIUM][BillingCycle.ANNUAL]["usd"],
                "features": TIER_FEATURES[SubscriptionTier.PREMIUM],
                "description": "Everything you need for financial planning and tracking"
            }
        ],
        "trial_days": TRIAL_DAYS
    }

@router.get("/founding-status")
async def get_founding_status():
    """Remaining founding-member discount slots (first 100 annual subscribers) per jurisdiction currency"""
    zar_used = await db.paystack_transactions.count_documents({
        "status": "success",
        "billing_cycle": "annual",
        "amount": FOUNDING_PRICING["zar"],
    })
    usd_used = await db.payment_transactions.count_documents({
        "payment_status": "paid",
        "billing_cycle": "annual",
        "amount": FOUNDING_PRICING["usd"],
    })
    return {
        "limit": FOUNDING_MEMBER_LIMIT,
        "zar": {"price": FOUNDING_PRICING["zar"], "remaining": max(0, FOUNDING_MEMBER_LIMIT - zar_used)},
        "usd": {"price": FOUNDING_PRICING["usd"], "remaining": max(0, FOUNDING_MEMBER_LIMIT - usd_used)},
    }
