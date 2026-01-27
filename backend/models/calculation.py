from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
from enum import Enum


class CalculatorType(str, Enum):
    FUTURE_VALUE = "future_value"
    COMPOUND_INTEREST = "compound_interest"
    BOND = "bond"
    CAR_FINANCE = "car_finance"
    LIFE_INSURANCE = "life_insurance"
    INCOME_DISABILITY = "income_disability"
    RETIREMENT = "retirement"
    TAX = "tax"
    BUDGET = "budget"
    NET_WORTH = "net_worth"
    EMERGENCY_FUND = "emergency_fund"
    DEBT_PAYOFF = "debt_payoff"
    ESTATE_PLANNING = "estate_planning"
    EDUCATION_SAVINGS = "education_savings"
    RISK_PROFILE = "risk_profile"


class CalculationBase(BaseModel):
    calculator_type: CalculatorType
    inputs: Dict[str, Any]
    results: Dict[str, Any]
    notes: Optional[str] = None


class CalculationCreate(CalculationBase):
    client_id: str


class Calculation(CalculationBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    advisor_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CalculationResponse(Calculation):
    pass
