from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from models.community import CommunityProfileUpdate
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/community", tags=["Community"])


async def _require_founding_member(user_id: str):
    sub = await db.subscriptions.find_one({"user_id": user_id})
    if not sub or not sub.get("founding_member"):
        raise HTTPException(status_code=403, detail="This area is for founding members only")


@router.get("/members")
async def list_founding_members(current_user: dict = Depends(get_current_user)):
    """Directory of all founding members (SA + US combined), founding-member access only"""
    await _require_founding_member(current_user["id"])

    subs = await db.subscriptions.find({"founding_member": True}, {"_id": 0}).to_list(500)
    profiles = {
        p["user_id"]: p
        for p in await db.community_profiles.find({}, {"_id": 0}).to_list(500)
    }

    members = []
    for sub in subs:
        uid = sub["user_id"]
        user = await db.users.find_one({"id": uid}, {"_id": 0, "hashed_password": 0})
        if not user:
            continue
        profile = profiles.get(uid, {})
        members.append({
            "user_id": uid,
            "full_name": user.get("full_name"),
            "company": user.get("company"),
            "jurisdiction": "US" if sub.get("founding_currency") == "usd" else "ZA",
            "specialty": profile.get("specialty"),
            "bio": profile.get("bio"),
            "linkedin_url": profile.get("linkedin_url"),
            "is_me": uid == current_user["id"],
        })

    # Members with a filled-in profile first, then alphabetical
    members.sort(key=lambda m: (not bool(m["bio"]), (m["full_name"] or "").lower()))

    return {"members": members, "total": len(members)}


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
