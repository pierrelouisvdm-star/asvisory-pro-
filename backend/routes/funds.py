from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import yfinance as yf
import pandas as pd

from models.funds import FundSummary, FundListResponse, FundDetail, FundReturns, PricePoint
from utils.auth import get_current_user_id
from server import db

router = APIRouter(prefix="/funds", tags=["Fund Explorer"])

CACHE_DURATION_MINUTES = 15

# Curated list of JSE-listed ETFs and US ETFs, verified against yfinance before shipping.
# True SA unit trusts are not available via yfinance and are out of scope here.
CURATED_FUNDS = {
    # --- South Africa (JSE-listed ETFs, .JO tickers) ---
    "STX40.JO": {"name": "Satrix Top 40", "category": "SA Equity", "market": "SA"},
    "STXQUA.JO": {"name": "Satrix Quality", "category": "SA Equity", "market": "SA"},
    "STXDIV.JO": {"name": "Satrix Divi Plus", "category": "SA Equity", "market": "SA"},
    "STXRAF.JO": {"name": "Satrix RAFI 40", "category": "SA Equity", "market": "SA"},
    "STXFIN.JO": {"name": "Satrix Financial", "category": "SA Equity Sector", "market": "SA"},
    "STXIND.JO": {"name": "Satrix Industrial", "category": "SA Equity Sector", "market": "SA"},
    "STXRES.JO": {"name": "Satrix Resources", "category": "SA Equity Sector", "market": "SA"},
    "STXPRO.JO": {"name": "Satrix Property", "category": "SA Property", "market": "SA"},
    "STXWDM.JO": {"name": "Satrix MSCI World", "category": "Global Equity", "market": "SA"},
    "STXEMG.JO": {"name": "Satrix MSCI Emerging Markets", "category": "Global Equity", "market": "SA"},
    "STX500.JO": {"name": "Satrix S&P 500", "category": "Global Equity", "market": "SA"},
    "STXNDQ.JO": {"name": "Satrix Nasdaq 100", "category": "Global Equity", "market": "SA"},
    "STXGOV.JO": {"name": "Satrix SA Bond", "category": "SA Bonds", "market": "SA"},
    "STXILB.JO": {"name": "Satrix ILBI", "category": "SA Bonds", "market": "SA"},
    "STXCHN.JO": {"name": "Satrix MSCI China", "category": "Global Equity", "market": "SA"},
    "CTOP50.JO": {"name": "CoreShares Top 50", "category": "SA Equity", "market": "SA"},
    "SYGP.JO": {"name": "CoreShares SA Property", "category": "SA Property", "market": "SA"},
    "SYG4IR.JO": {"name": "Sygnia 4IR Global Equity", "category": "Global Equity", "market": "SA"},
    "SYGWD.JO": {"name": "Sygnia Itrix MSCI World", "category": "Global Equity", "market": "SA"},
    "SYG500.JO": {"name": "Sygnia Itrix S&P 500", "category": "Global Equity", "market": "SA"},
    "SYGEU.JO": {"name": "Sygnia Itrix EuroStoxx 50", "category": "Global Equity", "market": "SA"},
    "SYGJP.JO": {"name": "Sygnia Itrix FTSE JSE Top 40", "category": "SA Equity", "market": "SA"},
    "SYGUK.JO": {"name": "Sygnia Itrix FTSE 100", "category": "Global Equity", "market": "SA"},
    "ETFSWX.JO": {"name": "1nvest Swix Top 40", "category": "SA Equity", "market": "SA"},
    "ETFGLD.JO": {"name": "1nvest Gold", "category": "Commodity", "market": "SA"},
    "ETFPLD.JO": {"name": "1nvest Palladium", "category": "Commodity", "market": "SA"},
    "ETFPLT.JO": {"name": "1nvest Platinum", "category": "Commodity", "market": "SA"},
    "GLD.JO": {"name": "NewGold", "category": "Commodity", "market": "SA"},
    "NGPLD.JO": {"name": "NewPlat", "category": "Commodity", "market": "SA"},
    # --- United States (ETFs) ---
    "SPY": {"name": "SPDR S&P 500", "category": "US Equity", "market": "US"},
    "VOO": {"name": "Vanguard S&P 500", "category": "US Equity", "market": "US"},
    "VTI": {"name": "Vanguard Total Stock Market", "category": "US Equity", "market": "US"},
    "QQQ": {"name": "Invesco Nasdaq 100", "category": "US Equity", "market": "US"},
    "DIA": {"name": "SPDR Dow Jones Industrial Average", "category": "US Equity", "market": "US"},
    "IWM": {"name": "iShares Russell 2000", "category": "US Equity", "market": "US"},
    "VXUS": {"name": "Vanguard Total International Stock", "category": "Global Equity", "market": "US"},
    "VEA": {"name": "Vanguard Developed Markets", "category": "Global Equity", "market": "US"},
    "VWO": {"name": "Vanguard Emerging Markets", "category": "Global Equity", "market": "US"},
    "EFA": {"name": "iShares MSCI EAFE", "category": "Global Equity", "market": "US"},
    "ARKK": {"name": "ARK Innovation ETF", "category": "US Equity", "market": "US"},
    "XLK": {"name": "Technology Select Sector SPDR", "category": "US Equity Sector", "market": "US"},
    "XLF": {"name": "Financial Select Sector SPDR", "category": "US Equity Sector", "market": "US"},
    "XLE": {"name": "Energy Select Sector SPDR", "category": "US Equity Sector", "market": "US"},
    "XLV": {"name": "Health Care Select Sector SPDR", "category": "US Equity Sector", "market": "US"},
    "AGG": {"name": "iShares Core US Aggregate Bond", "category": "US Bonds", "market": "US"},
    "BND": {"name": "Vanguard Total Bond Market", "category": "US Bonds", "market": "US"},
    "TLT": {"name": "iShares 20+ Year Treasury Bond", "category": "US Bonds", "market": "US"},
    "SHY": {"name": "iShares 1-3 Year Treasury Bond", "category": "US Bonds", "market": "US"},
    "LQD": {"name": "iShares iBoxx Investment Grade Corporate Bond", "category": "US Bonds", "market": "US"},
    "HYG": {"name": "iShares iBoxx High Yield Corporate Bond", "category": "US Bonds", "market": "US"},
    "VNQ": {"name": "Vanguard Real Estate", "category": "US Property", "market": "US"},
    "GLD": {"name": "SPDR Gold Shares", "category": "Commodity", "market": "US"},
    "SLV": {"name": "iShares Silver Trust", "category": "Commodity", "market": "US"},
    "VYM": {"name": "Vanguard High Dividend Yield", "category": "US Equity", "market": "US"},
    "SCHD": {"name": "Schwab US Dividend Equity", "category": "US Equity", "market": "US"},
    "AOR": {"name": "iShares Core Growth Allocation", "category": "Multi-Asset", "market": "US"},
    "AOA": {"name": "iShares Core Aggressive Allocation", "category": "Multi-Asset", "market": "US"},
    "VGK": {"name": "Vanguard FTSE Europe", "category": "Global Equity", "market": "US"},
    "EWJ": {"name": "iShares MSCI Japan", "category": "Global Equity", "market": "US"},
    "INDA": {"name": "iShares MSCI India", "category": "Global Equity", "market": "US"},
    "EWZ": {"name": "iShares MSCI Brazil", "category": "Global Equity", "market": "US"},
    "FXI": {"name": "iShares China Large-Cap", "category": "Global Equity", "market": "US"},
    "URTH": {"name": "iShares MSCI World", "category": "Global Equity", "market": "US"},
}

executor = ThreadPoolExecutor(max_workers=8)


def fetch_fund_quote_sync(ticker: str) -> Optional[dict]:
    """Fetch latest price + daily change for a single ticker"""
    try:
        hist = yf.Ticker(ticker).history(period="5d")
        if hist.empty:
            return None
        current_price = float(hist["Close"].iloc[-1])
        prev_price = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current_price
        change = current_price - prev_price
        change_percent = (change / prev_price * 100) if prev_price else 0.0
        return {
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
        }
    except Exception as e:
        print(f"Error fetching fund quote {ticker}: {e}")
        return None


def fetch_fund_detail_sync(ticker: str) -> Optional[dict]:
    """Fetch price history, trailing returns, and a chart-ready series for a single ticker"""
    try:
        hist = yf.Ticker(ticker).history(period="5y", interval="1d")
        hist = hist.dropna(subset=["Close"])
        if hist.empty:
            return None

        current_price = float(hist["Close"].iloc[-1])
        prev_price = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current_price
        change = current_price - prev_price
        change_percent = (change / prev_price * 100) if prev_price else 0.0

        now = hist.index[-1]

        def price_on_or_before(target_date) -> Optional[float]:
            subset = hist[hist.index <= target_date]
            if subset.empty:
                return None
            return float(subset["Close"].iloc[-1])

        def pct_return(target_date) -> Optional[float]:
            p = price_on_or_before(target_date)
            if not p:
                return None
            return round((current_price / p - 1) * 100, 2)

        year_start = pd.Timestamp(year=now.year, month=1, day=1, tz=now.tz)

        returns = {
            "one_month": pct_return(now - pd.DateOffset(months=1)),
            "ytd": pct_return(year_start),
            "one_year": pct_return(now - pd.DateOffset(years=1)),
            "three_year": pct_return(now - pd.DateOffset(years=3)),
            "five_year": pct_return(now - pd.DateOffset(years=5)),
        }

        monthly = hist["Close"].resample("ME").last().dropna()
        history = [
            {"date": idx.strftime("%Y-%m-%d"), "close": round(float(val), 2)}
            for idx, val in monthly.items()
        ]

        return {
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "returns": returns,
            "history": history,
        }
    except Exception as e:
        print(f"Error fetching fund detail {ticker}: {e}")
        return None


async def get_cached(cache_key: str) -> Optional[dict]:
    cache = await db.fund_cache.find_one({"key": cache_key}, {"_id": 0})
    if cache:
        last_updated = cache.get("last_updated")
        if isinstance(last_updated, datetime):
            age = datetime.now(timezone.utc) - last_updated.replace(tzinfo=timezone.utc)
            if age < timedelta(minutes=CACHE_DURATION_MINUTES):
                return cache
    return None


async def save_cached(cache_key: str, data: dict) -> dict:
    now = datetime.now(timezone.utc)
    doc = {"key": cache_key, "data": data, "last_updated": now}
    await db.fund_cache.update_one({"key": cache_key}, {"$set": doc}, upsert=True)
    return doc


async def get_fund_list_data() -> dict:
    cached = await get_cached("fund_list")
    if cached:
        return cached["data"]

    loop = asyncio.get_event_loop()
    tickers = list(CURATED_FUNDS.keys())
    results = await asyncio.gather(
        *[loop.run_in_executor(executor, fetch_fund_quote_sync, t) for t in tickers]
    )

    funds = []
    for ticker, quote in zip(tickers, results):
        if quote is None:
            continue
        meta = CURATED_FUNDS[ticker]
        funds.append({
            "ticker": ticker,
            "name": meta["name"],
            "category": meta["category"],
            "market": meta["market"],
            **quote,
        })

    await save_cached("fund_list", funds)
    return funds


@router.get("", response_model=FundListResponse)
async def list_funds(
    market: Optional[str] = Query(None, description="Filter by 'SA' or 'US'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    q: Optional[str] = Query(None, description="Search ticker or name"),
    user_id: str = Depends(get_current_user_id),
):
    """List curated JSE and US ETFs with live prices. Cached for 15 minutes."""
    funds = await get_fund_list_data()

    if market:
        funds = [f for f in funds if f["market"].lower() == market.lower()]
    if category:
        funds = [f for f in funds if f["category"].lower() == category.lower()]
    if q:
        q_lower = q.lower()
        funds = [f for f in funds if q_lower in f["ticker"].lower() or q_lower in f["name"].lower()]

    cache = await db.fund_cache.find_one({"key": "fund_list"}, {"_id": 0})
    last_updated = cache["last_updated"] if cache else datetime.now(timezone.utc)

    return FundListResponse(
        funds=[FundSummary(**f) for f in funds],
        last_updated=last_updated,
    )


@router.get("/{ticker}", response_model=FundDetail)
async def get_fund_detail(ticker: str, user_id: str = Depends(get_current_user_id)):
    """Get price history and trailing returns for a single curated fund."""
    meta = CURATED_FUNDS.get(ticker)
    if not meta:
        raise HTTPException(status_code=404, detail="Fund not found in curated list")

    cache_key = f"fund_detail:{ticker}"
    cached = await get_cached(cache_key)
    if cached:
        data = cached["data"]
        last_updated = cached["last_updated"]
    else:
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(executor, fetch_fund_detail_sync, ticker)
        if data is None:
            raise HTTPException(status_code=502, detail="Failed to fetch fund data")
        saved = await save_cached(cache_key, data)
        last_updated = saved["last_updated"]

    return FundDetail(
        ticker=ticker,
        name=meta["name"],
        category=meta["category"],
        market=meta["market"],
        price=data["price"],
        change=data["change"],
        change_percent=data["change_percent"],
        returns=FundReturns(**data["returns"]),
        history=[PricePoint(**p) for p in data["history"]],
        last_updated=last_updated,
    )
