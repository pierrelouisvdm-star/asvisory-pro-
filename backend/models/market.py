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

class Stock(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    category: Optional[str] = None
    last_updated: datetime

class Commodity(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    unit: str
    last_updated: datetime

class Crypto(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    unit: str = "USD"
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
    mag7: List[Stock] = []
    commodities: List[Commodity]
    crypto: List[Crypto] = []
    currencies: List[CurrencyPair]
    last_updated: datetime
    next_update: datetime
