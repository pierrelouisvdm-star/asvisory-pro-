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
    
    # Get activity for last 7 days using optimized aggregation
    week_ago = now - timedelta(days=7)
    week_ago_str = week_ago.isoformat()
    
    # Build activity data for last 7 days
    activity = []
    activity_dict = {}
    
    # Initialize all 7 days with zero counts
    for i in range(7):
        day = now - timedelta(days=i)
        date_str = day.strftime("%Y-%m-%d")
        activity_dict[date_str] = {"registrations": 0, "logins": 0}
    
    # Get registration counts per day
    reg_pipeline = [
        {"$match": {"created_at": {"$gte": week_ago_str}}},
        {"$project": {"date": {"$substr": ["$created_at", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}}
    ]
    async for doc in db.users.aggregate(reg_pipeline):
        if doc["_id"] in activity_dict:
            activity_dict[doc["_id"]]["registrations"] = doc["count"]
    
    # Get login counts per day
    login_pipeline = [
        {"$match": {"last_login": {"$gte": week_ago_str}}},
        {"$project": {"date": {"$substr": ["$last_login", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}}
    ]
    async for doc in db.users.aggregate(login_pipeline):
        if doc["_id"] in activity_dict:
            activity_dict[doc["_id"]]["logins"] = doc["count"]
    
    # Convert to sorted list (oldest first)
    for date_str in sorted(activity_dict.keys()):
        activity.append(UserActivity(
            date=date_str,
            registrations=activity_dict[date_str]["registrations"],
            logins=activity_dict[date_str]["logins"]
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



# Quick Actions models
class RecentCalculation(BaseModel):
    id: str
    client_name: str
    client_id: str
    calculator_type: str
    created_at: str


class UpcomingReview(BaseModel):
    client_id: str
    client_name: str
    next_review_date: str
    days_until: int


class QuickActionsResponse(BaseModel):
    recent_calculations: List[RecentCalculation]
    upcoming_reviews: List[UpcomingReview]
    total_clients: int
    calculations_this_month: int


@router.get("/quick-actions", response_model=QuickActionsResponse)
async def get_quick_actions(current_user: dict = Depends(get_current_user)):
    """Get quick actions data for the dashboard - for logged-in users"""
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)
    
    # Get recent calculations (last 5)
    recent_calcs = []
    calc_cursor = db.calculations.find(
        {"advisor_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5)
    
    # Get client map for names
    client_ids = set()
    calcs_list = []
    async for calc in calc_cursor:
        calcs_list.append(calc)
        client_ids.add(calc.get("client_id"))
    
    # Fetch client names
    client_map = {}
    if client_ids:
        async for client in db.clients.find(
            {"id": {"$in": list(client_ids)}, "advisor_id": user_id},
            {"_id": 0, "id": 1, "first_name": 1, "last_name": 1}
        ):
            client_map[client["id"]] = f"{client.get('first_name', '')} {client.get('last_name', '')}".strip()
    
    for calc in calcs_list:
        client_id = calc.get("client_id", "")
        recent_calcs.append(RecentCalculation(
            id=calc.get("id", ""),
            client_name=client_map.get(client_id, "Unknown Client"),
            client_id=client_id,
            calculator_type=calc.get("calculator_type", "unknown"),
            created_at=calc.get("created_at", "")
        ))
    
    # Get upcoming reviews (clients with next_review_date in the next 30 days)
    upcoming_reviews = []
    review_cursor = db.reviews.find(
        {
            "advisor_id": user_id,
            "next_review_date": {
                "$gte": now.isoformat(),
                "$lte": (now + timedelta(days=30)).isoformat()
            }
        },
        {"_id": 0}
    ).sort("next_review_date", 1).limit(5)
    
    review_client_ids = set()
    reviews_list = []
    async for review in review_cursor:
        reviews_list.append(review)
        review_client_ids.add(review.get("client_id"))
    
    # Fetch review client names
    review_client_map = {}
    if review_client_ids:
        async for client in db.clients.find(
            {"id": {"$in": list(review_client_ids)}, "advisor_id": user_id},
            {"_id": 0, "id": 1, "first_name": 1, "last_name": 1}
        ):
            review_client_map[client["id"]] = f"{client.get('first_name', '')} {client.get('last_name', '')}".strip()
    
    for review in reviews_list:
        client_id = review.get("client_id", "")
        review_date_str = review.get("next_review_date", "")
        
        # Calculate days until review
        days_until = 0
        if review_date_str:
            try:
                review_date = datetime.fromisoformat(review_date_str.replace("Z", "+00:00"))
                days_until = (review_date - now).days
            except:
                pass
        
        upcoming_reviews.append(UpcomingReview(
            client_id=client_id,
            client_name=review_client_map.get(client_id, "Unknown Client"),
            next_review_date=review_date_str,
            days_until=max(0, days_until)
        ))
    
    # Get total clients count
    total_clients = await db.clients.count_documents({"advisor_id": user_id})
    
    # Get calculations this month
    calculations_this_month = await db.calculations.count_documents({
        "advisor_id": user_id,
        "created_at": {"$gte": month_ago.isoformat()}
    })
    
    return QuickActionsResponse(
        recent_calculations=recent_calcs,
        upcoming_reviews=upcoming_reviews,
        total_clients=total_clients,
        calculations_this_month=calculations_this_month
    )
