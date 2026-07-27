from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require admin access"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class DeleteUserRequest(BaseModel):
    email: str


class UserSearchResponse(BaseModel):
    email: str
    full_name: Optional[str] = None
    id: str
    is_admin: bool = False
    created_at: Optional[str] = None


@router.get("/users")
async def list_users(
    search: Optional[str] = None,
    limit: int = 50,
    admin: dict = Depends(require_admin)
):
    """List all users (Admin only)"""
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.users.find(query, {"_id": 0, "hashed_password": 0}).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return {
        "total": len(users),
        "users": users
    }


@router.delete("/users/{email}")
async def delete_user(
    email: str,
    admin: dict = Depends(require_admin)
):
    """Delete a user by email (Admin only)"""
    # Prevent admin from deleting themselves
    if email.lower() == admin["email"].lower():
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Find the user
    user = await db.users.find_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{email}' not found")
    
    user_id = user.get("id")
    user_email = user.get("email")
    
    # Delete user record
    user_result = await db.users.delete_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}}
    )
    
    # Delete related data
    sub_result = await db.subscriptions.delete_many({"user_id": user_id})
    client_result = await db.clients.delete_many({"advisor_id": user_id})
    audit_result = await db.audit_logs.delete_many({"user_id": user_id})
    analysis_result = await db.financial_analyses.delete_many({"user_id": user_id})
    doc_result = await db.document_analyses.delete_many({"user_id": user_id})
    
    return {
        "success": True,
        "message": f"User '{user_email}' has been deleted",
        "deleted": {
            "user": user_result.deleted_count,
            "subscriptions": sub_result.deleted_count,
            "clients": client_result.deleted_count,
            "audit_logs": audit_result.deleted_count,
            "financial_analyses": analysis_result.deleted_count,
            "document_analyses": doc_result.deleted_count
        }
    }


@router.get("/users/{email}")
async def get_user(
    email: str,
    admin: dict = Depends(require_admin)
):
    """Get user details by email (Admin only)"""
    user = await db.users.find_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        {"_id": 0, "hashed_password": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{email}' not found")
    
    # Get subscription info
    subscription = await db.subscriptions.find_one(
        {"user_id": user.get("id")},
        {"_id": 0}
    )
    
    # Get client count
    client_count = await db.clients.count_documents({"advisor_id": user.get("id")})
    
    return {
        "user": user,
        "subscription": subscription,
        "client_count": client_count
    }


@router.post("/users/{email}/reset-subscription")
async def reset_user_subscription(
    email: str,
    admin: dict = Depends(require_admin)
):
    """Reset a user's subscription to free tier (Admin only)"""
    user = await db.users.find_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{email}' not found")
    
    # Delete subscription
    result = await db.subscriptions.delete_many({"user_id": user.get("id")})
    
    return {
        "success": True,
        "message": f"Subscription reset for '{user.get('email')}'",
        "deleted_subscriptions": result.deleted_count
    }


# ============================================================================
# Owner-only: promote a signed-up user to advisor + admin
# ----------------------------------------------------------------------------
# Guarded by an OWNER_EMAILS allow-list so ONLY the platform owner can call it.
# Meant to be used once to bootstrap co-founders / staff on production.
# ============================================================================
import os as _os
import logging as _logging
from datetime import datetime as _dt, timezone as _tz
from pydantic import EmailStr

_admin_log = _logging.getLogger(__name__)

OWNER_EMAILS = {
    e.strip().lower()
    for e in _os.environ.get(
        "OWNER_EMAILS",
        "pierrelouisvdm@gmail.com,rynom@herefordgroup.co.za",
    ).split(",")
    if e.strip()
}


def require_owner(current_user: dict = Depends(get_current_user)):
    if (current_user.get("email") or "").lower() not in OWNER_EMAILS:
        raise HTTPException(status_code=403, detail="Owner privileges required.")
    return current_user


class PromoteRequest(BaseModel):
    email: EmailStr
    role: str = "advisor"          # "advisor" or "individual"
    make_admin: bool = True
    full_name: Optional[str] = None
    company: Optional[str] = None


@router.post("/promote")
async def promote_user(
    body: PromoteRequest,
    owner: dict = Depends(require_owner),
):
    """Promote a signed-up user to admin (and set their role/company/name)."""
    if body.role not in ("advisor", "individual"):
        raise HTTPException(status_code=400, detail="role must be 'advisor' or 'individual'")

    email_lc = body.email.lower()
    user = await db.users.find_one({"email": {"$regex": f"^{email_lc}$", "$options": "i"}})
    if not user:
        raise HTTPException(
            status_code=404,
            detail="That email hasn't signed up yet. Ask them to register at /auth first, then re-run promote.",
        )

    updates = {
        "role": body.role,
        "is_admin": bool(body.make_admin),
        "is_active": True,
        "updated_at": _dt.now(_tz.utc).isoformat(),
    }
    if body.full_name:
        updates["full_name"] = body.full_name
    if body.company:
        updates["company"] = body.company

    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "hashed_password": 0})
    _admin_log.info(f"[admin.promote] {owner.get('email')} promoted {email_lc} → {updates}")
    return {"success": True, "user": updated}
