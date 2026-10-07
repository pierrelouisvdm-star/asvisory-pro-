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
