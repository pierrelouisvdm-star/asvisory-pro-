from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import uuid

from utils.auth import get_current_user
from models.user import User
from server import db

router = APIRouter(prefix="/net-worth", tags=["Net Worth"])

# Models
class Asset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: float
    category: str
    notes: Optional[str] = None

class Liability(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: float
    category: str
    interest_rate: Optional[float] = None
    notes: Optional[str] = None

class NetWorthGoal(BaseModel):
    target_amount: float
    target_date: str
    name: Optional[str] = "Net Worth Goal"

class NetWorthSnapshot(BaseModel):
    id: Optional[str] = None
    user_id: str
    date: str
    assets: List[Asset]
    liabilities: List[Liability]
    total_assets: float
    total_liabilities: float
    net_worth: float
    notes: Optional[str] = None

class NetWorthGoalCreate(BaseModel):
    target_amount: float
    target_date: str
    name: Optional[str] = "Net Worth Goal"

class NetWorthGoalResponse(BaseModel):
    id: str
    user_id: str
    target_amount: float
    target_date: str
    name: str
    created_at: str
    is_achieved: bool = False
    achieved_at: Optional[str] = None

# Snapshot endpoints
@router.post("/snapshots", response_model=dict)
async def create_snapshot(
    snapshot_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Save a net worth snapshot"""
    snapshot = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "date": datetime.now(timezone.utc).isoformat(),
        "assets": snapshot_data.get("assets", []),
        "liabilities": snapshot_data.get("liabilities", []),
        "total_assets": snapshot_data.get("total_assets", 0),
        "total_liabilities": snapshot_data.get("total_liabilities", 0),
        "net_worth": snapshot_data.get("net_worth", 0),
        "notes": snapshot_data.get("notes", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.net_worth_snapshots.insert_one(snapshot)
    
    # Check for milestone achievements
    await check_milestones(current_user.id, snapshot["net_worth"])
    
    return {"message": "Snapshot saved successfully", "snapshot_id": snapshot["id"]}

@router.get("/snapshots", response_model=List[dict])
async def get_snapshots(
    current_user: User = Depends(get_current_user),
    limit: int = 50
):
    """Get user's net worth snapshots"""
    snapshots = await db.net_worth_snapshots.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("date", -1).limit(limit).to_list(length=limit)
    
    return snapshots

@router.get("/snapshots/history", response_model=dict)
async def get_snapshot_history(
    current_user: User = Depends(get_current_user),
    period: str = "1y"  # 6m, 1y, 2y, 5y, all
):
    """Get net worth history for charting"""
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "6m":
        months = 6
    elif period == "1y":
        months = 12
    elif period == "2y":
        months = 24
    elif period == "5y":
        months = 60
    else:
        months = 1200  # ~100 years for "all"
    
    snapshots = await db.net_worth_snapshots.find(
        {"user_id": current_user.id},
        {"_id": 0, "date": 1, "net_worth": 1, "total_assets": 1, "total_liabilities": 1}
    ).sort("date", 1).to_list(length=1000)
    
    # Calculate growth metrics
    if len(snapshots) >= 2:
        first = snapshots[0]
        last = snapshots[-1]
        total_growth = last["net_worth"] - first["net_worth"]
        growth_percent = (total_growth / first["net_worth"] * 100) if first["net_worth"] > 0 else 0
    else:
        total_growth = 0
        growth_percent = 0
    
    return {
        "snapshots": snapshots,
        "total_growth": total_growth,
        "growth_percent": round(growth_percent, 2),
        "snapshot_count": len(snapshots)
    }

@router.delete("/snapshots/{snapshot_id}")
async def delete_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a snapshot"""
    result = await db.net_worth_snapshots.delete_one({
        "id": snapshot_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    return {"message": "Snapshot deleted"}

# Goal endpoints
@router.post("/goals", response_model=dict)
async def create_goal(
    goal: NetWorthGoalCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a net worth goal"""
    goal_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "target_amount": goal.target_amount,
        "target_date": goal.target_date,
        "name": goal.name or "Net Worth Goal",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_achieved": False,
        "achieved_at": None
    }
    
    await db.net_worth_goals.insert_one(goal_doc)
    
    return {"message": "Goal created", "goal_id": goal_doc["id"]}

@router.get("/goals", response_model=List[dict])
async def get_goals(
    current_user: User = Depends(get_current_user)
):
    """Get user's net worth goals"""
    goals = await db.net_worth_goals.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=20)
    
    return goals

@router.put("/goals/{goal_id}/achieve")
async def mark_goal_achieved(
    goal_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a goal as achieved"""
    result = await db.net_worth_goals.update_one(
        {"id": goal_id, "user_id": current_user.id},
        {"$set": {
            "is_achieved": True,
            "achieved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"message": "Goal marked as achieved!"}

@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a goal"""
    result = await db.net_worth_goals.delete_one({
        "id": goal_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"message": "Goal deleted"}

# Milestones
MILESTONES = [
    {"amount": 0, "name": "Positive Net Worth", "icon": "trending-up"},
    {"amount": 100000, "name": "R100K Club", "icon": "star"},
    {"amount": 500000, "name": "Half Millionaire", "icon": "award"},
    {"amount": 1000000, "name": "Millionaire", "icon": "crown"},
    {"amount": 2000000, "name": "Double Millionaire", "icon": "gem"},
    {"amount": 5000000, "name": "R5M Net Worth", "icon": "trophy"},
    {"amount": 10000000, "name": "R10M Net Worth", "icon": "rocket"},
]

async def check_milestones(user_id: str, current_net_worth: float):
    """Check and award milestones"""
    # Get existing milestones
    existing = await db.net_worth_milestones.find(
        {"user_id": user_id},
        {"_id": 0, "amount": 1}
    ).to_list(length=100)
    
    existing_amounts = {m["amount"] for m in existing}
    
    # Check for new milestones
    for milestone in MILESTONES:
        if milestone["amount"] not in existing_amounts and current_net_worth >= milestone["amount"]:
            # Award milestone
            await db.net_worth_milestones.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "amount": milestone["amount"],
                "name": milestone["name"],
                "icon": milestone["icon"],
                "achieved_at": datetime.now(timezone.utc).isoformat()
            })

@router.get("/milestones", response_model=List[dict])
async def get_milestones(
    current_user: User = Depends(get_current_user)
):
    """Get user's achieved milestones"""
    milestones = await db.net_worth_milestones.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("amount", 1).to_list(length=50)
    
    return milestones

@router.get("/milestones/all", response_model=List[dict])
async def get_all_milestones(
    current_user: User = Depends(get_current_user)
):
    """Get all possible milestones with achievement status"""
    achieved = await db.net_worth_milestones.find(
        {"user_id": current_user.id},
        {"_id": 0, "amount": 1, "achieved_at": 1}
    ).to_list(length=50)
    
    achieved_map = {m["amount"]: m["achieved_at"] for m in achieved}
    
    all_milestones = []
    for m in MILESTONES:
        all_milestones.append({
            **m,
            "is_achieved": m["amount"] in achieved_map,
            "achieved_at": achieved_map.get(m["amount"])
        })
    
    return all_milestones

# Insights endpoint
@router.post("/insights", response_model=dict)
async def get_insights(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered insights based on net worth data"""
    assets = data.get("assets", [])
    liabilities = data.get("liabilities", [])
    total_assets = data.get("total_assets", 0)
    total_liabilities = data.get("total_liabilities", 0)
    net_worth = data.get("net_worth", 0)
    
    insights = []
    recommendations = []
    
    # Calculate ratios
    debt_to_asset = (total_liabilities / total_assets * 100) if total_assets > 0 else 0
    
    # Asset allocation analysis
    asset_categories = {}
    for asset in assets:
        cat = asset.get("category", "other")
        asset_categories[cat] = asset_categories.get(cat, 0) + asset.get("value", 0)
    
    # Check property concentration
    property_value = asset_categories.get("property", 0)
    property_percent = (property_value / total_assets * 100) if total_assets > 0 else 0
    
    if property_percent > 70:
        insights.append({
            "type": "warning",
            "title": "High Property Concentration",
            "message": f"Property makes up {property_percent:.0f}% of your assets. Consider diversifying into other asset classes for better risk management."
        })
        recommendations.append("Consider investing in unit trusts or ETFs to diversify")
    
    # Check cash reserves
    cash_value = asset_categories.get("cash", 0)
    cash_percent = (cash_value / total_assets * 100) if total_assets > 0 else 0
    
    if cash_percent < 5:
        insights.append({
            "type": "warning",
            "title": "Low Emergency Fund",
            "message": f"Cash reserves are only {cash_percent:.1f}% of total assets. Aim for 3-6 months of expenses in liquid savings."
        })
        recommendations.append("Build up your emergency fund to cover 3-6 months of expenses")
    elif cash_percent > 30:
        insights.append({
            "type": "info",
            "title": "High Cash Holdings",
            "message": f"You're holding {cash_percent:.0f}% in cash. Consider investing excess cash to beat inflation."
        })
        recommendations.append("Excess cash loses value to inflation - consider investing for growth")
    
    # Check retirement savings
    retirement_value = asset_categories.get("retirement", 0)
    retirement_percent = (retirement_value / total_assets * 100) if total_assets > 0 else 0
    
    if retirement_percent < 15:
        insights.append({
            "type": "warning",
            "title": "Low Retirement Savings",
            "message": f"Retirement assets are {retirement_percent:.0f}% of total. Consider maximizing RA contributions for tax benefits."
        })
        recommendations.append("Maximize Retirement Annuity contributions (up to 27.5% of income)")
    
    # Debt analysis
    if debt_to_asset > 60:
        insights.append({
            "type": "danger",
            "title": "High Debt Level",
            "message": f"Your debt-to-asset ratio is {debt_to_asset:.0f}%. Focus on paying down high-interest debt first."
        })
        recommendations.append("Prioritize paying off high-interest debt (credit cards first)")
    elif debt_to_asset < 20:
        insights.append({
            "type": "success",
            "title": "Healthy Debt Level",
            "message": f"Great job! Your debt-to-asset ratio is only {debt_to_asset:.0f}%."
        })
    
    # Check for high-interest debt
    credit_card_debt = sum(l.get("value", 0) for l in liabilities if l.get("category") == "credit")
    if credit_card_debt > 0:
        insights.append({
            "type": "danger",
            "title": "Credit Card Debt",
            "message": f"You have R{credit_card_debt:,.0f} in credit card debt. This typically carries 18-24% interest."
        })
        recommendations.append("Pay off credit card debt immediately - it's the most expensive debt")
    
    # Net worth trajectory
    if net_worth < 0:
        insights.append({
            "type": "info",
            "title": "Negative Net Worth",
            "message": "Your liabilities exceed assets. Focus on debt reduction and building assets over time."
        })
    elif net_worth > 1000000:
        insights.append({
            "type": "success",
            "title": "Millionaire Status",
            "message": "Congratulations! You've achieved millionaire net worth. Consider estate planning."
        })
        recommendations.append("Review your estate plan and consider life insurance for wealth transfer")
    
    # Investment diversification
    investment_value = asset_categories.get("investments", 0)
    if total_assets > 500000 and investment_value < total_assets * 0.1:
        insights.append({
            "type": "info",
            "title": "Limited Investment Exposure",
            "message": "Consider increasing investment allocation for long-term wealth building."
        })
        recommendations.append("Look into low-cost index funds or ETFs for easy diversification")
    
    return {
        "insights": insights,
        "recommendations": recommendations,
        "summary": {
            "debt_to_asset_ratio": round(debt_to_asset, 1),
            "property_allocation": round(property_percent, 1),
            "cash_allocation": round(cash_percent, 1),
            "retirement_allocation": round(retirement_percent, 1),
            "investment_allocation": round((investment_value / total_assets * 100) if total_assets > 0 else 0, 1)
        }
    }
