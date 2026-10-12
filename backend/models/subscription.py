from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class SubscriptionTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"

class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"
    LIFETIME = "lifetime"

# Pricing configuration, per jurisdiction currency (ZAR for South Africa, USD for USA)
PRICING = {
    SubscriptionTier.FREE: {
        BillingCycle.MONTHLY: {"zar": 0.0, "usd": 0.0},
        BillingCycle.ANNUAL: {"zar": 0.0, "usd": 0.0},
    },
    SubscriptionTier.PREMIUM: {
        BillingCycle.MONTHLY: {"zar": 299.0, "usd": 22.0},
        BillingCycle.ANNUAL: {"zar": 1999.0, "usd": 199.0},  # ZAR: ~R1,589 saved vs monthly; USD: ~$65 saved vs monthly
    },
}

# Founding-member promo: the first FOUNDING_MEMBER_LIMIT annual Premium
# subscribers in each jurisdiction get a discounted annual price.
FOUNDING_MEMBER_LIMIT = 100
FOUNDING_PRICING = {"zar": 1699.0, "usd": 149.0}

# Feature access configuration
TIER_FEATURES = {
    SubscriptionTier.FREE: {
        "calculators": ["future_value", "compound_interest", "bond", "car_finance"],
        "max_clients": 0,
        "pdf_reports": False,
        "advanced_tools": False,
        "market_tracker": False,
        "goal_planner": False,
        "meeting_scheduler": False,
        "portfolio_tracker": False,
    },
    SubscriptionTier.PREMIUM: {
        "calculators": "all",
        "max_clients": -1,  # Unlimited
        "pdf_reports": True,
        "advanced_tools": True,
        "market_tracker": True,
        "goal_planner": True,
        "meeting_scheduler": True,
        "portfolio_tracker": True,
    },
}

class SubscriptionCreate(BaseModel):
    tier: SubscriptionTier
    billing_cycle: BillingCycle

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    tier: SubscriptionTier
    billing_cycle: BillingCycle
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    
class PaymentTransactionCreate(BaseModel):
    user_id: str
    email: str
    tier: SubscriptionTier
    billing_cycle: BillingCycle
    amount: float
    currency: str = "zar"

class PaymentTransactionResponse(BaseModel):
    id: str
    user_id: str
    session_id: str
    tier: SubscriptionTier
    billing_cycle: BillingCycle
    amount: float
    currency: str
    status: str
    payment_status: str
    created_at: datetime

class CheckoutRequest(BaseModel):
    tier: SubscriptionTier
    billing_cycle: BillingCycle
    origin_url: str
    jurisdiction: str = "ZA"  # "ZA" or "US" — determines currency (zar/usd)

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class UserSubscriptionInfo(BaseModel):
    tier: SubscriptionTier
    billing_cycle: Optional[BillingCycle] = None
    status: str
    features: dict
    trial_ends_at: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
