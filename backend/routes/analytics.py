from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel
from server import db
from utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


# Helper to check if user is admin
async def require_admin(current_user: dict = Depends(get_current_user)):
    """Require admin access for analytics"""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


class UserStats(BaseModel):
    total_users: int
    new_users_today: int
    new_users_week: int
    new_users_month: int
    active_users_week: int


class UserActivity(BaseModel):
    date: str
    registrations: int
    logins: int


class UserListItem(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    company: Optional[str] = None
    created_at: Optional[str] = None
    last_login: Optional[str] = None
    is_active: bool = True


class AnalyticsDashboard(BaseModel):
    stats: UserStats
    recent_users: List[UserListItem]
    activity: List[UserActivity]


@router.get("/dashboard", response_model=AnalyticsDashboard)
async def get_analytics_dashboard(current_user: dict = Depends(require_admin)):
    """Get analytics dashboard data - Admin only"""
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Get total users count
    total_users = await db.users.count_documents({})
    
    # Get new users today
    new_today = await db.users.count_documents({
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    # Get new users this week
    new_week = await db.users.count_documents({
        "created_at": {"$gte": week_ago.isoformat()}
    })
    
    # Get new users this month
    new_month = await db.users.count_documents({
        "created_at": {"$gte": month_ago.isoformat()}
    })
    
    # Get active users (logged in within last week)
    active_week = await db.users.count_documents({
        "last_login": {"$gte": week_ago.isoformat()}
    })
    
    stats = UserStats(
        total_users=total_users,
        new_users_today=new_today,
        new_users_week=new_week,
        new_users_month=new_month,
        active_users_week=active_week
    )
    
    # Get recent users (last 20)
    recent_users_cursor = db.users.find(
        {},
        {"_id": 0, "hashed_password": 0}
    ).sort("created_at", -1).limit(20)
    
    recent_users = []
    async for user in recent_users_cursor:
        recent_users.append(UserListItem(
            id=user.get("id", ""),
            email=user.get("email", ""),
            full_name=user.get("full_name"),
            company=user.get("company"),
            created_at=user.get("created_at"),
            last_login=user.get("last_login"),
            is_active=user.get("is_active", True)
        ))
    
    # Get activity for last 7 days
    activity = []
    for i in range(7):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        registrations = await db.users.count_documents({
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        logins = await db.users.count_documents({
            "last_login": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        activity.append(UserActivity(
            date=day_start.strftime("%Y-%m-%d"),
            registrations=registrations,
            logins=logins
        ))
    
    activity.reverse()  # Oldest first
    
    return AnalyticsDashboard(
        stats=stats,
        recent_users=recent_users,
        activity=activity
    )


@router.get("/users", response_model=List[UserListItem])
async def get_all_users(
    current_user: dict = Depends(require_admin),
    limit: int = 100,
    skip: int = 0
):
    """Get all users with pagination - Admin only"""
    
    users_cursor = db.users.find(
        {},
        {"_id": 0, "hashed_password": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    users = []
    async for user in users_cursor:
        users.append(UserListItem(
            id=user.get("id", ""),
            email=user.get("email", ""),
            full_name=user.get("full_name"),
            company=user.get("company"),
            created_at=user.get("created_at"),
            last_login=user.get("last_login"),
            is_active=user.get("is_active", True)
        ))
    
    return users


@router.get("/stats", response_model=UserStats)
async def get_user_stats(current_user: dict = Depends(require_admin)):
    """Get user statistics - Admin only"""
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    total_users = await db.users.count_documents({})
    new_today = await db.users.count_documents({"created_at": {"$gte": today_start.isoformat()}})
    new_week = await db.users.count_documents({"created_at": {"$gte": week_ago.isoformat()}})
    new_month = await db.users.count_documents({"created_at": {"$gte": month_ago.isoformat()}})
    active_week = await db.users.count_documents({"last_login": {"$gte": week_ago.isoformat()}})
    
    return UserStats(
        total_users=total_users,
        new_users_today=new_today,
        new_users_week=new_week,
        new_users_month=new_month,
        active_users_week=active_week
    )
