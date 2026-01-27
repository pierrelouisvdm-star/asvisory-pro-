from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date
import uuid
from enum import Enum


class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE_CONSERVATIVE = "moderate_conservative"
    MODERATE = "moderate"
    MODERATE_AGGRESSIVE = "moderate_aggressive"
    AGGRESSIVE = "aggressive"


class ClientBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    occupation: Optional[str] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    occupation: Optional[str] = None
    notes: Optional[str] = None


class FinancialData(BaseModel):
    """Client's financial data collected from various calculators"""
    # Income & Budget
    monthly_income: Optional[float] = 0
    monthly_expenses: Optional[float] = 0
    
    # Assets
    total_assets: Optional[float] = 0
    liquid_assets: Optional[float] = 0
    investments: Optional[float] = 0
    property_value: Optional[float] = 0
    retirement_savings: Optional[float] = 0
    
    # Liabilities
    total_liabilities: Optional[float] = 0
    mortgage_balance: Optional[float] = 0
    other_debt: Optional[float] = 0
    
    # Insurance
    life_insurance_coverage: Optional[float] = 0
    life_insurance_needed: Optional[float] = 0
    disability_coverage: Optional[float] = 0
    
    # Emergency Fund
    emergency_fund_current: Optional[float] = 0
    emergency_fund_needed: Optional[float] = 0
    
    # Retirement
    retirement_goal: Optional[float] = 0
    years_to_retirement: Optional[int] = 0
    retirement_monthly_need: Optional[float] = 0
    
    # Education (for dependents)
    education_savings_current: Optional[float] = 0
    education_savings_needed: Optional[float] = 0
    
    # Estate
    estate_value: Optional[float] = 0
    estate_duty_estimated: Optional[float] = 0
    
    # Risk Profile
    risk_profile: Optional[RiskProfile] = None
    
    # Tax
    annual_income: Optional[float] = 0
    tax_liability: Optional[float] = 0


class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    advisor_id: str  # Links to User (advisor)
    financial_data: FinancialData = Field(default_factory=FinancialData)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ClientResponse(Client):
    full_name: str = ""
    
    def __init__(self, **data):
        super().__init__(**data)
        self.full_name = f"{self.first_name} {self.last_name}"
