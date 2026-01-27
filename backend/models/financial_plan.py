from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
from enum import Enum


class ShortfallPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ShortfallCategory(str, Enum):
    LIFE_INSURANCE = "life_insurance"
    DISABILITY_INSURANCE = "disability_insurance"
    EMERGENCY_FUND = "emergency_fund"
    RETIREMENT = "retirement"
    DEBT = "debt"
    BUDGET = "budget"
    EDUCATION = "education"
    ESTATE = "estate"
    TAX = "tax"
    NET_WORTH = "net_worth"


class Shortfall(BaseModel):
    """Individual shortfall identified in a client's financial plan"""
    category: ShortfallCategory
    priority: ShortfallPriority
    title: str
    description: str
    current_value: float
    target_value: float
    gap: float
    gap_percentage: float
    recommendation: str
    action_items: List[str]
    estimated_monthly_cost: Optional[float] = None


class FinancialPlanAnalysis(BaseModel):
    """Complete financial plan analysis for a client"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    
    # Overall scores
    overall_score: float  # 0-100
    health_rating: str  # "Poor", "Fair", "Good", "Excellent"
    
    # Shortfalls by priority
    critical_shortfalls: List[Shortfall] = []
    high_priority_shortfalls: List[Shortfall] = []
    medium_priority_shortfalls: List[Shortfall] = []
    low_priority_shortfalls: List[Shortfall] = []
    
    # Summary stats
    total_shortfalls: int = 0
    total_gap_amount: float = 0
    estimated_monthly_investment_needed: float = 0
    
    # Recommendations summary
    top_recommendations: List[str] = []
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FinancialDataUpdate(BaseModel):
    """Update client's financial data from calculator results"""
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    total_assets: Optional[float] = None
    liquid_assets: Optional[float] = None
    investments: Optional[float] = None
    property_value: Optional[float] = None
    retirement_savings: Optional[float] = None
    total_liabilities: Optional[float] = None
    mortgage_balance: Optional[float] = None
    other_debt: Optional[float] = None
    life_insurance_coverage: Optional[float] = None
    life_insurance_needed: Optional[float] = None
    disability_coverage: Optional[float] = None
    emergency_fund_current: Optional[float] = None
    emergency_fund_needed: Optional[float] = None
    retirement_goal: Optional[float] = None
    years_to_retirement: Optional[int] = None
    retirement_monthly_need: Optional[float] = None
    education_savings_current: Optional[float] = None
    education_savings_needed: Optional[float] = None
    estate_value: Optional[float] = None
    estate_duty_estimated: Optional[float] = None
    risk_profile: Optional[str] = None
    annual_income: Optional[float] = None
    tax_liability: Optional[float] = None
