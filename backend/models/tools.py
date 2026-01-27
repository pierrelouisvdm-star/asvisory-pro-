from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date
import uuid
from enum import Enum


class GoalCategory(str, Enum):
    HOUSE = "house"
    CAR = "car"
    VACATION = "vacation"
    EDUCATION = "education"
    RETIREMENT = "retirement"
    EMERGENCY = "emergency"
    WEDDING = "wedding"
    BUSINESS = "business"
    OTHER = "other"


class GoalStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ON_TRACK = "on_track"
    BEHIND = "behind"
    COMPLETED = "completed"


class FinancialGoal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    name: str
    category: GoalCategory
    target_amount: float
    current_amount: float = 0
    monthly_contribution: float = 0
    target_date: str  # YYYY-MM-DD
    priority: int = 1  # 1 = highest
    notes: Optional[str] = None
    status: GoalStatus = GoalStatus.NOT_STARTED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GoalCreate(BaseModel):
    client_id: str
    name: str
    category: GoalCategory
    target_amount: float
    current_amount: float = 0
    monthly_contribution: float = 0
    target_date: str
    priority: int = 1
    notes: Optional[str] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[GoalCategory] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    monthly_contribution: Optional[float] = None
    target_date: Optional[str] = None
    priority: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[GoalStatus] = None


# Meeting Notes Models
class MeetingType(str, Enum):
    INITIAL = "initial"
    REVIEW = "review"
    PLANNING = "planning"
    FOLLOWUP = "followup"
    PHONE = "phone"
    OTHER = "other"


class ActionItemStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ActionItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    due_date: Optional[str] = None
    assigned_to: str = "advisor"  # "advisor" or "client"
    status: ActionItemStatus = ActionItemStatus.PENDING
    completed_at: Optional[datetime] = None


class MeetingNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    meeting_type: MeetingType
    meeting_date: str  # YYYY-MM-DD
    duration_minutes: int = 60
    attendees: List[str] = []
    summary: str
    discussion_points: List[str] = []
    action_items: List[ActionItem] = []
    next_meeting_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MeetingNoteCreate(BaseModel):
    client_id: str
    meeting_type: MeetingType
    meeting_date: str
    duration_minutes: int = 60
    attendees: List[str] = []
    summary: str
    discussion_points: List[str] = []
    action_items: List[Dict[str, Any]] = []
    next_meeting_date: Optional[str] = None


# Review Scheduler Models
class ReviewFrequency(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"


class ReviewSchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    frequency: ReviewFrequency = ReviewFrequency.ANNUAL
    last_review_date: Optional[str] = None
    next_review_date: str
    checklist: List[str] = [
        "Review investment performance",
        "Update risk profile",
        "Check insurance coverage",
        "Review goals progress",
        "Update financial data",
        "Discuss life changes",
        "Review fees and costs",
        "Update beneficiaries"
    ]
    reminder_days_before: int = 14
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewScheduleCreate(BaseModel):
    client_id: str
    frequency: ReviewFrequency = ReviewFrequency.ANNUAL
    next_review_date: str
    checklist: List[str] = []
    reminder_days_before: int = 14
    notes: Optional[str] = None


# Loan Comparison Models  
class LoanOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lender_name: str
    loan_amount: float
    interest_rate: float
    term_months: int
    monthly_payment: float = 0
    total_interest: float = 0
    total_cost: float = 0
    fees: float = 0
    notes: Optional[str] = None


class LoanComparison(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    purpose: str  # "home", "car", "personal", etc.
    options: List[LoanOption] = []
    recommended_option_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Portfolio Models
class AssetClass(str, Enum):
    CASH = "cash"
    BONDS = "bonds"
    DOMESTIC_EQUITY = "domestic_equity"
    INTERNATIONAL_EQUITY = "international_equity"
    REAL_ESTATE = "real_estate"
    COMMODITIES = "commodities"
    ALTERNATIVES = "alternatives"
    CRYPTO = "crypto"


class PortfolioHolding(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    asset_class: AssetClass
    value: float
    cost_basis: float = 0
    allocation_percentage: float = 0


class Portfolio(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    name: str = "Main Portfolio"
    holdings: List[PortfolioHolding] = []
    total_value: float = 0
    target_allocation: Dict[str, float] = {}  # asset_class -> percentage
    diversification_score: float = 0
    rebalancing_needed: bool = False
    last_rebalanced: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Fee Calculator Models
class FeeStructure(str, Enum):
    AUM = "aum"  # Assets Under Management
    FLAT = "flat"
    HOURLY = "hourly"
    COMMISSION = "commission"
    HYBRID = "hybrid"


class FeeCalculation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    fee_structure: FeeStructure
    aum_percentage: float = 1.0  # For AUM-based
    flat_fee_annual: float = 0  # For flat fee
    hourly_rate: float = 0  # For hourly
    estimated_hours: float = 0
    assets_under_management: float = 0
    calculated_annual_fee: float = 0
    calculated_monthly_fee: float = 0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
