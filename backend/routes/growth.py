from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/growth", tags=["growth"])

# DB access
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


class LeadCapture(BaseModel):
    email: str
    source: str = "fi_score_quiz"
    score: Optional[int] = None
    tier: Optional[str] = None
    metadata: Optional[dict] = {}


class ReferralRequest(BaseModel):
    user_id: str
    user_email: Optional[str] = None


@router.post("/capture-lead")
async def capture_lead(lead: LeadCapture):
    """Capture an email lead (e.g., from FI Score quiz completion)"""
    email = lead.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    existing = await db.growth_leads.find_one({"email": email}, {"_id": 0})
    if existing:
        # Update their score/tier if they retake
        await db.growth_leads.update_one(
            {"email": email},
            {"$set": {
                "score": lead.score,
                "tier": lead.tier,
                "source": lead.source,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }, "$inc": {"quiz_attempts": 1}}
        )
        return {"status": "updated", "message": "You're already on the list! We'll keep you updated."}

    await db.growth_leads.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "source": lead.source,
        "score": lead.score,
        "tier": lead.tier,
        "metadata": lead.metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "quiz_attempts": 1,
    })
    return {"status": "captured", "message": "You're on the list! Check your inbox for your personalized FI roadmap."}


@router.post("/referral")
async def get_or_create_referral(data: ReferralRequest):
    """Get or create a referral code for a user"""
    existing = await db.referrals.find_one({"user_id": data.user_id}, {"_id": 0})
    if existing:
        return {
            "referral_code": existing["referral_code"],
            "referral_count": existing.get("referral_count", 0),
            "referred_users": existing.get("referred_emails", []),
        }

    code = str(uuid.uuid4())[:8].upper().replace("-", "")
    await db.referrals.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "user_email": data.user_email,
        "referral_code": code,
        "referral_count": 0,
        "referred_emails": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"referral_code": code, "referral_count": 0, "referred_users": []}


@router.get("/referral/{user_id}/stats")
async def get_referral_stats(user_id: str):
    """Get referral stats for a user"""
    ref = await db.referrals.find_one({"user_id": user_id}, {"_id": 0})
    if not ref:
        return {"referral_code": None, "referral_count": 0, "has_referral": False}
    return {
        "referral_code": ref["referral_code"],
        "referral_count": ref.get("referral_count", 0),
        "has_referral": True,
    }


@router.post("/referral/use/{referral_code}")
async def use_referral_code(referral_code: str, new_user_email: str):
    """Track when someone signs up using a referral code"""
    ref = await db.referrals.find_one({"referral_code": referral_code.upper()}, {"_id": 0})
    if not ref:
        return {"status": "not_found"}

    await db.referrals.update_one(
        {"referral_code": referral_code.upper()},
        {
            "$inc": {"referral_count": 1},
            "$push": {"referred_emails": new_user_email},
            "$set": {"last_referral_at": datetime.now(timezone.utc).isoformat()},
        }
    )
    return {"status": "tracked", "referrer": ref.get("user_email")}


@router.get("/lead-count")
async def get_lead_count():
    """Public endpoint to show social proof number"""
    count = await db.growth_leads.count_documents({})
    user_count = await db.users.count_documents({})
    return {"total_leads": count, "total_users": user_count, "combined": count + user_count}
