from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import secrets
import string

class CouponType(str, Enum):
    PREMIUM_LIFETIME = "premium_lifetime"
    PREMIUM_ANNUAL = "premium_annual"
    PREMIUM_MONTHLY = "premium_monthly"
    STANDARD_ANNUAL = "standard_annual"
    STANDARD_MONTHLY = "standard_monthly"

class CouponStatus(str, Enum):
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    DISABLED = "disabled"

class Coupon(BaseModel):
    code: str
    coupon_type: CouponType
    status: CouponStatus = CouponStatus.ACTIVE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    redeemed_at: Optional[datetime] = None
    redeemed_by: Optional[str] = None
    redeemed_by_email: Optional[str] = None
    expires_at: Optional[datetime] = None
    description: Optional[str] = None

class RedeemCouponRequest(BaseModel):
    code: str

class RedeemCouponResponse(BaseModel):
    success: bool
    message: str
    tier: Optional[str] = None
    subscription_type: Optional[str] = None

def generate_coupon_code(prefix: str = "ADVPRO", length: int = 8) -> str:
    """Generate a unique coupon code"""
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(length))
    return f"{prefix}-{random_part}"

def generate_batch_codes(count: int, coupon_type: CouponType, prefix: str = "ADVPRO") -> List[dict]:
    """Generate a batch of coupon codes"""
    codes = []
    for _ in range(count):
        code = generate_coupon_code(prefix)
        codes.append({
            "code": code,
            "coupon_type": coupon_type.value,
            "status": CouponStatus.ACTIVE.value,
            "created_at": datetime.now(timezone.utc),
            "description": f"Premium Lifetime Access - Generated {datetime.now().strftime('%Y-%m-%d')}"
        })
    return codes
