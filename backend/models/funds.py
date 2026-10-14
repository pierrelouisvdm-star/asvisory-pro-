from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FundSummary(BaseModel):
    ticker: str
    name: str
    category: str
    market: str
    price: float
    change: float
    change_percent: float

class FundListResponse(BaseModel):
    funds: List[FundSummary]
    last_updated: datetime

class FundReturns(BaseModel):
    one_month: Optional[float] = None
    ytd: Optional[float] = None
    one_year: Optional[float] = None
    three_year: Optional[float] = None
    five_year: Optional[float] = None

class PricePoint(BaseModel):
    date: str
    close: float

class FundDetail(BaseModel):
    ticker: str
    name: str
    category: str
    market: str
    price: float
    change: float
    change_percent: float
    returns: FundReturns
    history: List[PricePoint]
    last_updated: datetime
