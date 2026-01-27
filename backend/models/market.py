from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MarketIndex(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    last_updated: datetime

class CurrencyPair(BaseModel):
    pair: str
    base: str
    quote: str
    rate: float
    change: float
    change_percent: float
    last_updated: datetime

class MarketDataResponse(BaseModel):
    indices: List[MarketIndex]
    currencies: List[CurrencyPair]
    last_updated: datetime
    next_update: datetime
