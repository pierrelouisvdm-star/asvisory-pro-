from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionRequest, 
    CheckoutSessionResponse
)

from models.subscription import (
    SubscriptionTier, BillingCycle, PRICING, TIER_FEATURES,
    CheckoutRequest, CheckoutResponse, UserSubscriptionInfo,
    SubscriptionResponse
)
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

# Trial period in days
TRIAL_DAYS = 7

def get_user_subscription(user_id: str) -> dict:
    """Get user's current subscription or return free tier"""
    subscription = db.subscriptions.find_one(
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

def check_feature_access(user_id: str, feature: str) -> bool:
    """Check if user has access to a specific feature"""
    subscription = get_user_subscription(user_id)
    tier = subscription.get("tier", SubscriptionTier.FREE)
    features = TIER_FEATURES.get(tier, TIER_FEATURES[SubscriptionTier.FREE])
    return features.get(feature, False)

@router.get("/current", response_model=UserSubscriptionInfo)
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription info"""
    user_id = current_user["id"]
    subscription = get_user_subscription(user_id)
    tier = subscription.get("tier", SubscriptionTier.FREE)
    
    return UserSubscriptionInfo(
        tier=tier,
        billing_cycle=subscription.get("billing_cycle"),
        status=subscription.get("status", "active"),
        features=TIER_FEATURES.get(tier, TIER_FEATURES[SubscriptionTier.FREE]),
        trial_ends_at=subscription.get("trial_ends_at"),
        current_period_end=subscription.get("current_period_end")
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
    
    amount = PRICING[tier][billing_cycle]
    
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
        currency="zar",
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
        "currency": "zar",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc)
    }
    db.payment_transactions.insert_one(transaction)
    
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
    transaction = db.payment_transactions.find_one({"session_id": session_id})
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
    db.payment_transactions.update_one(
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
        db.subscriptions.update_one(
            {"user_id": transaction["user_id"]},
            {"$set": {
                "user_id": transaction["user_id"],
                "tier": tier.value,
                "billing_cycle": billing_cycle.value,
                "status": "active",
                "current_period_start": datetime.now(timezone.utc),
                "current_period_end": period_end,
                "updated_at": datetime.now(timezone.utc)
            }},
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
    existing = db.subscriptions.find_one({
        "user_id": user_id,
        "had_trial": True
    })
    if existing:
        raise HTTPException(status_code=400, detail="Trial already used")
    
    trial_end = datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS)
    
    db.subscriptions.update_one(
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
                "monthly_price": 0,
                "annual_price": 0,
                "features": TIER_FEATURES[SubscriptionTier.FREE],
                "description": "Basic calculators to get started"
            },
            {
                "tier": SubscriptionTier.STANDARD.value,
                "name": "Standard",
                "monthly_price": PRICING[SubscriptionTier.STANDARD][BillingCycle.MONTHLY],
                "annual_price": PRICING[SubscriptionTier.STANDARD][BillingCycle.ANNUAL],
                "features": TIER_FEATURES[SubscriptionTier.STANDARD],
                "description": "Full calculator suite for growing practices"
            },
            {
                "tier": SubscriptionTier.PREMIUM.value,
                "name": "Premium",
                "monthly_price": PRICING[SubscriptionTier.PREMIUM][BillingCycle.MONTHLY],
                "annual_price": PRICING[SubscriptionTier.PREMIUM][BillingCycle.ANNUAL],
                "features": TIER_FEATURES[SubscriptionTier.PREMIUM],
                "description": "Complete toolkit for established advisors"
            }
        ],
        "trial_days": TRIAL_DAYS
    }
