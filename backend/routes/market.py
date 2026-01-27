from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import yfinance as yf
import asyncio
from concurrent.futures import ThreadPoolExecutor

from models.market import MarketIndex, CurrencyPair, MarketDataResponse
from server import db

router = APIRouter(prefix="/market", tags=["Market Data"])

# Cache settings
CACHE_DURATION_MINUTES = 15
UPDATE_INTERVAL_MINUTES = 15

# Market indices configuration
INDICES = {
    "^JTOPI": {"name": "JSE Top 40", "region": "ZA"},
    "^J203": {"name": "JSE All Share", "region": "ZA"},
    "^IXIC": {"name": "Nasdaq Composite", "region": "US"},
    "^GSPC": {"name": "S&P 500", "region": "US"},
    "^NSEI": {"name": "Nifty 50", "region": "IN"},
    "VNQI": {"name": "SA Property (ETF Proxy)", "region": "ZA"},  # Vanguard Global ex-US Real Estate as proxy
}

# Currency pairs to ZAR
CURRENCY_PAIRS = [
    "USDZAR=X",  # USD/ZAR
    "EURZAR=X",  # EUR/ZAR
    "GBPZAR=X",  # GBP/ZAR
    "JPYZAR=X",  # JPY/ZAR (will need to multiply by 100 for display)
    "AUDZAR=X",  # AUD/ZAR
    "CHFZAR=X",  # CHF/ZAR
    "CNYZAR=X",  # CNY/ZAR
    "INRZAR=X",  # INR/ZAR
]

CURRENCY_NAMES = {
    "USDZAR=X": "USD/ZAR",
    "EURZAR=X": "EUR/ZAR", 
    "GBPZAR=X": "GBP/ZAR",
    "JPYZAR=X": "JPY/ZAR",
    "AUDZAR=X": "AUD/ZAR",
    "CHFZAR=X": "CHF/ZAR",
    "CNYZAR=X": "CNY/ZAR",
    "INRZAR=X": "INR/ZAR",
}

executor = ThreadPoolExecutor(max_workers=4)

def fetch_ticker_data(symbol: str) -> Optional[dict]:
    """Fetch data for a single ticker"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        hist = ticker.history(period="2d")
        
        if len(hist) >= 1:
            current_price = hist['Close'].iloc[-1]
            if len(hist) >= 2:
                prev_price = hist['Close'].iloc[-2]
                change = current_price - prev_price
                change_percent = (change / prev_price) * 100
            else:
                change = 0
                change_percent = 0
            
            return {
                "symbol": symbol,
                "price": float(current_price),
                "change": float(change),
                "change_percent": float(change_percent)
            }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
    return None

async def fetch_market_data() -> dict:
    """Fetch all market data from yfinance"""
    loop = asyncio.get_event_loop()
    
    # Fetch indices
    indices_data = []
    for symbol, meta in INDICES.items():
        data = await loop.run_in_executor(executor, fetch_ticker_data, symbol)
        if data:
            indices_data.append({
                "symbol": symbol,
                "name": meta["name"],
                "value": data["price"],
                "change": data["change"],
                "change_percent": data["change_percent"],
                "region": meta["region"]
            })
    
    # Fetch currencies
    currencies_data = []
    for symbol in CURRENCY_PAIRS:
        data = await loop.run_in_executor(executor, fetch_ticker_data, symbol)
        if data:
            pair_name = CURRENCY_NAMES.get(symbol, symbol.replace("=X", ""))
            base = pair_name.split("/")[0]
            quote = pair_name.split("/")[1] if "/" in pair_name else "ZAR"
            
            currencies_data.append({
                "pair": pair_name,
                "base": base,
                "quote": quote,
                "rate": data["price"],
                "change": data["change"],
                "change_percent": data["change_percent"]
            })
    
    return {
        "indices": indices_data,
        "currencies": currencies_data
    }

async def get_cached_data() -> Optional[dict]:
    """Get cached market data if still valid"""
    cache = await db.market_cache.find_one({"type": "market_data"}, {"_id": 0})
    if cache:
        last_updated = cache.get("last_updated")
        if last_updated:
            if isinstance(last_updated, datetime):
                age = datetime.now(timezone.utc) - last_updated.replace(tzinfo=timezone.utc)
            else:
                return None
            if age < timedelta(minutes=CACHE_DURATION_MINUTES):
                return cache
    return None

async def save_cache(data: dict):
    """Save market data to cache"""
    now = datetime.now(timezone.utc)
    cache_data = {
        "type": "market_data",
        "indices": data["indices"],
        "currencies": data["currencies"],
        "last_updated": now,
        "next_update": now + timedelta(minutes=UPDATE_INTERVAL_MINUTES)
    }
    await db.market_cache.update_one(
        {"type": "market_data"},
        {"$set": cache_data},
        upsert=True
    )
    return cache_data

@router.get("/data", response_model=MarketDataResponse)
async def get_market_data():
    """
    Get live market data for indices and currency pairs.
    Data is cached and refreshed every 15 minutes.
    """
    # Check cache first
    cached = get_cached_data()
    if cached:
        return MarketDataResponse(
            indices=[MarketIndex(
                symbol=idx["symbol"],
                name=idx["name"],
                value=idx["value"],
                change=idx["change"],
                change_percent=idx["change_percent"],
                last_updated=cached["last_updated"]
            ) for idx in cached.get("indices", [])],
            currencies=[CurrencyPair(
                pair=cur["pair"],
                base=cur["base"],
                quote=cur["quote"],
                rate=cur["rate"],
                change=cur["change"],
                change_percent=cur["change_percent"],
                last_updated=cached["last_updated"]
            ) for cur in cached.get("currencies", [])],
            last_updated=cached["last_updated"],
            next_update=cached["next_update"]
        )
    
    # Fetch fresh data
    try:
        data = await fetch_market_data()
        cached = save_cache(data)
        
        return MarketDataResponse(
            indices=[MarketIndex(
                symbol=idx["symbol"],
                name=idx["name"],
                value=idx["value"],
                change=idx["change"],
                change_percent=idx["change_percent"],
                last_updated=cached["last_updated"]
            ) for idx in data.get("indices", [])],
            currencies=[CurrencyPair(
                pair=cur["pair"],
                base=cur["base"],
                quote=cur["quote"],
                rate=cur["rate"],
                change=cur["change"],
                change_percent=cur["change_percent"],
                last_updated=cached["last_updated"]
            ) for cur in data.get("currencies", [])],
            last_updated=cached["last_updated"],
            next_update=cached["next_update"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@router.get("/refresh")
async def refresh_market_data():
    """Force refresh market data (admin only in production)"""
    try:
        data = await fetch_market_data()
        cached = save_cache(data)
        return {"message": "Market data refreshed", "last_updated": cached["last_updated"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh: {str(e)}")
