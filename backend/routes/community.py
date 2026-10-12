from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from models.community import CommunityProfileUpdate
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/community", tags=["Community"])


def _sub_jurisdiction(sub: dict) -> str:
    currency = sub.get("founding_currency") or sub.get("currency")
    if currency:
        return "US" if currency == "usd" else "ZA"
    return "US" if sub.get("payment_method") == "stripe" else "ZA"


async def _require_community_access(user_id: str) -> dict:
    """Founding members and the first 1,000 community members can view the directory."""
    sub = await db.subscriptions.find_one({"user_id": user_id})
    if not sub or not (sub.get("founding_member") or sub.get("community_member")):
        raise HTTPException(status_code=403, detail="This area is for founding and community members only")
    return sub


async def _require_founding_member(user_id: str):
    """Only founding members get an editable profile (specialty, bio, LinkedIn)."""
    sub = await db.subscriptions.find_one({"user_id": user_id})
    if not sub or not sub.get("founding_member"):
        raise HTTPException(status_code=403, detail="This area is for founding members only")


@router.get("/members")
async def list_community_members(current_user: dict = Depends(get_current_user)):
    """Directory of founding + community members (SA + US combined)."""
    await _require_community_access(current_user["id"])

    subs = await db.subscriptions.find(
        {"$or": [{"founding_member": True}, {"community_member": True}]},
        {"_id": 0},
    ).to_list(1200)
    profiles = {
        p["user_id"]: p
        for p in await db.community_profiles.find({}, {"_id": 0}).to_list(1200)
    }

    members = []
    for sub in subs:
        uid = sub["user_id"]
        user = await db.users.find_one({"id": uid}, {"_id": 0, "hashed_password": 0})
        if not user:
            continue
        is_founding = bool(sub.get("founding_member"))
        profile = profiles.get(uid, {}) if is_founding else {}
        members.append({
            "user_id": uid,
            "full_name": user.get("full_name"),
            "company": user.get("company"),
            "jurisdiction": _sub_jurisdiction(sub),
            "tier": "founding" if is_founding else "community",
            "specialty": profile.get("specialty"),
            "bio": profile.get("bio"),
            "linkedin_url": profile.get("linkedin_url"),
            "is_me": uid == current_user["id"],
        })

    # Founding members first, then members with a filled-in profile, then alphabetical
    members.sort(key=lambda m: (m["tier"] != "founding", not bool(m["bio"]), (m["full_name"] or "").lower()))

    founding_count = sum(1 for m in members if m["tier"] == "founding")
    return {"members": members, "total": len(members), "founding_count": founding_count}


@router.get("/profile")
async def get_my_community_profile(current_user: dict = Depends(get_current_user)):
    await _require_founding_member(current_user["id"])
    profile = await db.community_profiles.find_one({"user_id": current_user["id"]}, {"_id": 0})
    return profile or {"user_id": current_user["id"], "specialty": None, "bio": None, "linkedin_url": None}


@router.put("/profile")
async def update_my_community_profile(
    payload: CommunityProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    await _require_founding_member(current_user["id"])
    await db.community_profiles.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "user_id": current_user["id"],
            "specialty": payload.specialty,
            "bio": payload.bio,
            "linkedin_url": payload.linkedin_url,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"success": True}
