from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List
import os

from models.coupon import (
    CouponType, CouponStatus, RedeemCouponRequest, RedeemCouponResponse,
    generate_batch_codes
)
from models.subscription import SubscriptionTier, BillingCycle
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/coupons", tags=["Coupons"])

# Map coupon types to subscription tiers
COUPON_TO_SUBSCRIPTION = {
    CouponType.PREMIUM_LIFETIME.value: {
        "tier": SubscriptionTier.PREMIUM,
        "duration_days": None,  # Lifetime = no expiry
        "description": "Lifetime Premium Access"
    },
    CouponType.PREMIUM_ANNUAL.value: {
        "tier": SubscriptionTier.PREMIUM,
        "duration_days": 365,
        "description": "1 Year Premium Access"
    },
    CouponType.PREMIUM_MONTHLY.value: {
        "tier": SubscriptionTier.PREMIUM,
        "duration_days": 30,
        "description": "1 Month Premium Access"
    },
    CouponType.STANDARD_ANNUAL.value: {
        "tier": SubscriptionTier.STANDARD,
        "duration_days": 365,
        "description": "1 Year Standard Access"
    },
    CouponType.STANDARD_MONTHLY.value: {
        "tier": SubscriptionTier.STANDARD,
        "duration_days": 30,
        "description": "1 Month Standard Access"
    },
}


@router.post("/redeem", response_model=RedeemCouponResponse)
async def redeem_coupon(
    request: RedeemCouponRequest,
    current_user: dict = Depends(get_current_user)
):
    """Redeem a coupon code for subscription access"""
    user_id = current_user["id"]
    user_email = current_user["email"]
    code = request.code.strip().upper()
    
    # Find the coupon
    coupon = await db.coupons.find_one({"code": code})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if coupon["status"] != CouponStatus.ACTIVE.value:
        if coupon["status"] == CouponStatus.REDEEMED.value:
            raise HTTPException(status_code=400, detail="This coupon has already been redeemed")
        elif coupon["status"] == CouponStatus.EXPIRED.value:
            raise HTTPException(status_code=400, detail="This coupon has expired")
        else:
            raise HTTPException(status_code=400, detail="This coupon is no longer valid")
    
    # Check if coupon has expired
    if coupon.get("expires_at") and coupon["expires_at"] < datetime.now(timezone.utc):
        await db.coupons.update_one(
            {"code": code},
            {"$set": {"status": CouponStatus.EXPIRED.value}}
        )
        raise HTTPException(status_code=400, detail="This coupon has expired")
    
    # Get subscription details from coupon type
    coupon_type = coupon["coupon_type"]
    sub_details = COUPON_TO_SUBSCRIPTION.get(coupon_type)
    
    if not sub_details:
        raise HTTPException(status_code=500, detail="Invalid coupon configuration")
    
    # Calculate subscription period
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    
    if sub_details["duration_days"] is None:
        # Lifetime subscription - set to 100 years
        period_end = now + timedelta(days=36500)
        billing_cycle = "lifetime"
    elif sub_details["duration_days"] == 365:
        period_end = now + timedelta(days=365)
        billing_cycle = BillingCycle.ANNUAL.value
    else:
        period_end = now + timedelta(days=sub_details["duration_days"])
        billing_cycle = BillingCycle.MONTHLY.value
    
    # Update user's subscription
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "tier": sub_details["tier"].value,
            "billing_cycle": billing_cycle,
            "status": "active",
            "current_period_start": now,
            "current_period_end": period_end,
            "coupon_code": code,
            "updated_at": now
        }},
        upsert=True
    )
    
    # Mark coupon as redeemed
    await db.coupons.update_one(
        {"code": code},
        {"$set": {
            "status": CouponStatus.REDEEMED.value,
            "redeemed_at": now,
            "redeemed_by": user_id,
            "redeemed_by_email": user_email
        }}
    )
    
    return RedeemCouponResponse(
        success=True,
        message=f"Coupon redeemed successfully! You now have {sub_details['description']}.",
        tier=sub_details["tier"].value,
        subscription_type=billing_cycle
    )


@router.get("/validate/{code}")
async def validate_coupon(code: str):
    """Check if a coupon code is valid (without redeeming)"""
    code = code.strip().upper()
    
    coupon = await db.coupons.find_one({"code": code})
    
    if not coupon:
        return {"valid": False, "message": "Invalid coupon code"}
    
    if coupon["status"] != CouponStatus.ACTIVE.value:
        return {"valid": False, "message": f"Coupon is {coupon['status']}"}
    
    if coupon.get("expires_at") and coupon["expires_at"] < datetime.now(timezone.utc):
        return {"valid": False, "message": "Coupon has expired"}
    
    sub_details = COUPON_TO_SUBSCRIPTION.get(coupon["coupon_type"])
    
    return {
        "valid": True,
        "message": "Coupon is valid",
        "tier": sub_details["tier"].value if sub_details else "unknown",
        "description": sub_details["description"] if sub_details else coupon.get("description", "")
    }


# Admin endpoint to generate coupons (protected - would need admin auth in production)
@router.post("/generate")
async def generate_coupons(
    count: int = 50,
    coupon_type: CouponType = CouponType.PREMIUM_LIFETIME,
    prefix: str = "ADVPRO"
):
    """Generate batch of coupon codes (Admin only)"""
    # In production, add admin authentication here
    
    codes = generate_batch_codes(count, coupon_type, prefix)
    
    # Insert into database
    result = await db.coupons.insert_many(codes)
    
    # Return the generated codes
    return {
        "message": f"Generated {count} coupon codes",
        "codes": [c["code"] for c in codes],
        "coupon_type": coupon_type.value
    }


@router.get("/list")
async def list_coupons(status: str = None, limit: int = 100):
    """List coupon codes (Admin only)"""
    # In production, add admin authentication here
    
    query = {}
    if status:
        query["status"] = status
    
    cursor = db.coupons.find(query, {"_id": 0}).limit(limit)
    coupons = await cursor.to_list(length=limit)
    
    return {
        "total": len(coupons),
        "coupons": coupons
    }
