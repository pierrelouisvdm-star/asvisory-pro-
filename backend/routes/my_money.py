"""
My Money — personalized financial profile + computed dashboard summary
for Individual-tier users. Tracks TFSA/RA contributions, net worth and goals.
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/me/financial", tags=["MyMoney"])


# SA tax-year limits (2026/27)
TFSA_ANNUAL_LIMIT = 36000.0
TFSA_LIFETIME_LIMIT = 500000.0
RA_DEDUCTION_RATE = 0.275  # 27.5% of taxable income
RA_DEDUCTION_CAP = 350000.0


class Asset(BaseModel):
    name: str
    value: float
    category: Optional[str] = None  # cash, property, equity, retirement, other


class Liability(BaseModel):
    name: str
    balance: float
    monthly_payment: Optional[float] = None


class FinancialProfile(BaseModel):
    age: Optional[int] = None
    retirement_age: Optional[int] = 65
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    risk_profile: Optional[str] = None  # Conservative | Moderate | Aggressive

    tfsa_contributed_this_year: float = 0
    tfsa_contributed_lifetime: float = 0

    ra_contributed_this_year: float = 0

    assets: List[Asset] = Field(default_factory=list)
    liabilities: List[Liability] = Field(default_factory=list)


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's financial profile (creates defaults if missing)."""
    doc = await db.user_financial_profiles.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0, "user_id": 0},
    )
    if not doc:
        return FinancialProfile().model_dump()
    return doc


@router.put("/profile")
async def update_profile(
    profile: FinancialProfile,
    current_user: dict = Depends(get_current_user),
):
    """Upsert the current user's financial profile."""
    data = profile.model_dump()
    data["user_id"] = current_user["id"]
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.user_financial_profiles.update_one(
        {"user_id": current_user["id"]},
        {"$set": data},
        upsert=True,
    )
    data.pop("user_id", None)
    return {"success": True, "profile": data}


@router.get("/dashboard")
async def my_money_dashboard(current_user: dict = Depends(get_current_user)):
    """Computed summary: TFSA + RA usage, net worth, retirement readiness."""
    doc = await db.user_financial_profiles.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0, "user_id": 0},
    ) or {}

    p = FinancialProfile(**{k: v for k, v in doc.items() if k in FinancialProfile.model_fields})

    # TFSA
    tfsa_annual_pct = round((p.tfsa_contributed_this_year / TFSA_ANNUAL_LIMIT) * 100, 1) if TFSA_ANNUAL_LIMIT else 0
    tfsa_lifetime_pct = round((p.tfsa_contributed_lifetime / TFSA_LIFETIME_LIMIT) * 100, 1) if TFSA_LIFETIME_LIMIT else 0
    tfsa_annual_remaining = max(TFSA_ANNUAL_LIMIT - p.tfsa_contributed_this_year, 0)
    tfsa_lifetime_remaining = max(TFSA_LIFETIME_LIMIT - p.tfsa_contributed_lifetime, 0)

    # RA
    ra_cap_by_income = (p.annual_income or 0) * RA_DEDUCTION_RATE
    ra_personal_cap = min(ra_cap_by_income, RA_DEDUCTION_CAP) if p.annual_income else RA_DEDUCTION_CAP
    ra_used_pct = round((p.ra_contributed_this_year / ra_personal_cap) * 100, 1) if ra_personal_cap > 0 else 0
    ra_remaining = max(ra_personal_cap - p.ra_contributed_this_year, 0)

    # Net worth
    total_assets = sum(a.value for a in p.assets) if p.assets else 0
    total_liabilities = sum(lia.balance for lia in p.liabilities) if p.liabilities else 0
    net_worth = total_assets - total_liabilities

    # Asset allocation by category
    allocation = {}
    if p.assets:
        for a in p.assets:
            cat = a.category or "other"
            allocation[cat] = allocation.get(cat, 0) + a.value

    # Very rough retirement readiness signal
    # Heuristic: target net worth at retirement ≈ 20x annual expenses (4% rule)
    # then current progress is net_worth vs (target * years_lived / total_years)
    readiness_label = "Insufficient data"
    readiness_pct = None
    if p.age and p.retirement_age and p.monthly_expenses and p.retirement_age > p.age:
        annual_expenses = p.monthly_expenses * 12
        target_nw = annual_expenses * 25  # 4% safe withdrawal rule
        # Expected to be on track if currently saving at retirement_progress_ratio
        progress_ratio = (p.age - 25) / (p.retirement_age - 25) if p.retirement_age > 25 else 0
        progress_ratio = max(0, min(progress_ratio, 1))
        expected_now = target_nw * progress_ratio
        if expected_now > 0:
            ratio = net_worth / expected_now
            readiness_pct = round(min(ratio * 100, 999), 0)
            if ratio >= 1.0:
                readiness_label = "On Track"
            elif ratio >= 0.7:
                readiness_label = "Almost There"
            elif ratio >= 0.4:
                readiness_label = "Catching Up"
            else:
                readiness_label = "Behind"

    return {
        "profile": p.model_dump(),
        "tfsa": {
            "annual_limit": TFSA_ANNUAL_LIMIT,
            "annual_used": p.tfsa_contributed_this_year,
            "annual_remaining": tfsa_annual_remaining,
            "annual_pct": tfsa_annual_pct,
            "lifetime_limit": TFSA_LIFETIME_LIMIT,
            "lifetime_used": p.tfsa_contributed_lifetime,
            "lifetime_remaining": tfsa_lifetime_remaining,
            "lifetime_pct": tfsa_lifetime_pct,
        },
        "ra": {
            "deduction_rate": RA_DEDUCTION_RATE,
            "deduction_cap": RA_DEDUCTION_CAP,
            "personal_cap": ra_personal_cap,
            "contributed_this_year": p.ra_contributed_this_year,
            "remaining_to_cap": ra_remaining,
            "used_pct": ra_used_pct,
        },
        "net_worth": {
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_worth": net_worth,
            "allocation": allocation,
        },
        "retirement_readiness": {
            "label": readiness_label,
            "pct": readiness_pct,
            "retirement_age": p.retirement_age,
            "years_remaining": (p.retirement_age - p.age) if (p.age and p.retirement_age) else None,
        },
    }
