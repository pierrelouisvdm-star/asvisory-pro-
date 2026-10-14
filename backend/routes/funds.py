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
# Bumped when the cached list shape changes (e.g. a new field added), so stale
# cache rows from before the change are ignored instead of failing validation.
FUND_LIST_CACHE_KEY = "fund_list_v2"

# Curated list of JSE-listed ETFs and US ETFs, verified against yfinance before shipping.
# True SA unit trusts are not available via yfinance and are out of scope here.
CURATED_FUNDS = {
    # --- South Africa (JSE-listed ETFs, .JO tickers) ---
    "STX40.JO": {"name": "Satrix Top 40", "category": "SA Equity", "market": "SA", "description": "Tracks South Africa's 40 largest JSE-listed companies by market cap."},
    "STXQUA.JO": {"name": "Satrix Quality", "category": "SA Equity", "market": "SA", "description": "Tracks JSE companies with strong profitability, low debt, and earnings stability."},
    "STXDIV.JO": {"name": "Satrix Divi Plus", "category": "SA Equity", "market": "SA", "description": "Tracks the 30 highest dividend-yielding shares on the JSE."},
    "STXRAF.JO": {"name": "Satrix RAFI 40", "category": "SA Equity", "market": "SA", "description": "Weights the JSE's top 40 shares by fundamentals like sales and cash flow, not market cap."},
    "STXFIN.JO": {"name": "Satrix Financial", "category": "SA Equity Sector", "market": "SA", "description": "Tracks JSE-listed banks, insurers, and other financial services companies."},
    "STXIND.JO": {"name": "Satrix Industrial", "category": "SA Equity Sector", "market": "SA", "description": "Tracks JSE-listed industrial sector companies, from retailers to media."},
    "STXRES.JO": {"name": "Satrix Resources", "category": "SA Equity Sector", "market": "SA", "description": "Tracks JSE-listed mining and resources companies."},
    "STXPRO.JO": {"name": "Satrix Property", "category": "SA Property", "market": "SA", "description": "Tracks JSE-listed real estate investment trusts and property companies."},
    "STXWDM.JO": {"name": "Satrix MSCI World", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to developed-market equities worldwide."},
    "STXEMG.JO": {"name": "Satrix MSCI Emerging Markets", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to emerging-market equities worldwide."},
    "STX500.JO": {"name": "Satrix S&P 500", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to the 500 largest US companies."},
    "STXNDQ.JO": {"name": "Satrix Nasdaq 100", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to the 100 largest Nasdaq-listed companies."},
    "STXGOV.JO": {"name": "Satrix SA Bond", "category": "SA Bonds", "market": "SA", "description": "Tracks a basket of South African government bonds."},
    "STXILB.JO": {"name": "Satrix ILBI", "category": "SA Bonds", "market": "SA", "description": "Tracks South African inflation-linked government bonds."},
    "STXCHN.JO": {"name": "Satrix MSCI China", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to Chinese equities."},
    "CTOP50.JO": {"name": "CoreShares Top 50", "category": "SA Equity", "market": "SA", "description": "Tracks South Africa's 50 largest JSE-listed companies."},
    "SYGP.JO": {"name": "CoreShares SA Property", "category": "SA Property", "market": "SA", "description": "Tracks JSE-listed real estate investment trusts and property companies."},
    "SYG4IR.JO": {"name": "Sygnia 4IR Global Equity", "category": "Global Equity", "market": "SA", "description": "Tracks global companies driving the Fourth Industrial Revolution, like AI and robotics."},
    "SYGWD.JO": {"name": "Sygnia Itrix MSCI World", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to developed-market equities worldwide."},
    "SYG500.JO": {"name": "Sygnia Itrix S&P 500", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to the 500 largest US companies."},
    "SYGEU.JO": {"name": "Sygnia Itrix EuroStoxx 50", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to the 50 largest Eurozone companies."},
    "SYGJP.JO": {"name": "Sygnia Itrix FTSE JSE Top 40", "category": "SA Equity", "market": "SA", "description": "Tracks South Africa's 40 largest JSE-listed companies."},
    "SYGUK.JO": {"name": "Sygnia Itrix FTSE 100", "category": "Global Equity", "market": "SA", "description": "Rand-denominated access to the UK's 100 largest listed companies."},
    "ETFSWX.JO": {"name": "1nvest Swix Top 40", "category": "SA Equity", "market": "SA", "description": "Tracks the JSE Top 40, weighted by shares actually available to local investors."},
    "ETFGLD.JO": {"name": "1nvest Gold", "category": "Commodity", "market": "SA", "description": "Tracks the rand price of physical gold."},
    "ETFPLD.JO": {"name": "1nvest Palladium", "category": "Commodity", "market": "SA", "description": "Tracks the rand price of physical palladium."},
    "ETFPLT.JO": {"name": "1nvest Platinum", "category": "Commodity", "market": "SA", "description": "Tracks the rand price of physical platinum."},
    "GLD.JO": {"name": "NewGold", "category": "Commodity", "market": "SA", "description": "Backed by physical gold bullion, tracking the rand gold price."},
    "NGPLD.JO": {"name": "NewPlat", "category": "Commodity", "market": "SA", "description": "Backed by physical platinum, tracking the rand platinum price."},
    # --- United States (ETFs) ---
    "SPY": {"name": "SPDR S&P 500", "category": "US Equity", "market": "US", "description": "Tracks the S&P 500, the 500 largest publicly traded US companies."},
    "VOO": {"name": "Vanguard S&P 500", "category": "US Equity", "market": "US", "description": "Low-cost tracker of the S&P 500, the 500 largest US companies."},
    "VTI": {"name": "Vanguard Total Stock Market", "category": "US Equity", "market": "US", "description": "Tracks nearly the entire US stock market, small caps to large caps."},
    "QQQ": {"name": "Invesco Nasdaq 100", "category": "US Equity", "market": "US", "description": "Tracks the 100 largest non-financial companies on the Nasdaq."},
    "DIA": {"name": "SPDR Dow Jones Industrial Average", "category": "US Equity", "market": "US", "description": "Tracks the 30 blue-chip companies of the Dow Jones Industrial Average."},
    "IWM": {"name": "iShares Russell 2000", "category": "US Equity", "market": "US", "description": "Tracks 2,000 US small-cap companies."},
    "VXUS": {"name": "Vanguard Total International Stock", "category": "Global Equity", "market": "US", "description": "Tracks stocks across developed and emerging markets outside the US."},
    "VEA": {"name": "Vanguard Developed Markets", "category": "Global Equity", "market": "US", "description": "Tracks large- and mid-cap stocks in developed markets outside the US."},
    "VWO": {"name": "Vanguard Emerging Markets", "category": "Global Equity", "market": "US", "description": "Tracks stocks in emerging markets like China, India, and Brazil."},
    "EFA": {"name": "iShares MSCI EAFE", "category": "Global Equity", "market": "US", "description": "Tracks developed-market stocks in Europe, Australasia, and the Far East."},
    "ARKK": {"name": "ARK Innovation ETF", "category": "US Equity", "market": "US", "description": "Actively managed fund targeting disruptive innovation companies."},
    "XLK": {"name": "Technology Select Sector SPDR", "category": "US Equity Sector", "market": "US", "description": "Tracks S&P 500 technology companies like Apple and Microsoft."},
    "XLF": {"name": "Financial Select Sector SPDR", "category": "US Equity Sector", "market": "US", "description": "Tracks S&P 500 banks, insurers, and financial services companies."},
    "XLE": {"name": "Energy Select Sector SPDR", "category": "US Equity Sector", "market": "US", "description": "Tracks S&P 500 oil, gas, and energy companies."},
    "XLV": {"name": "Health Care Select Sector SPDR", "category": "US Equity Sector", "market": "US", "description": "Tracks S&P 500 pharmaceutical, biotech, and healthcare companies."},
    "AGG": {"name": "iShares Core US Aggregate Bond", "category": "US Bonds", "market": "US", "description": "Broad exposure to US investment-grade bonds, government and corporate."},
    "BND": {"name": "Vanguard Total Bond Market", "category": "US Bonds", "market": "US", "description": "Broad exposure to the entire US investment-grade bond market."},
    "TLT": {"name": "iShares 20+ Year Treasury Bond", "category": "US Bonds", "market": "US", "description": "Tracks long-dated US Treasury bonds, sensitive to interest rate moves."},
    "SHY": {"name": "iShares 1-3 Year Treasury Bond", "category": "US Bonds", "market": "US", "description": "Tracks short-dated US Treasury bonds, with low interest rate sensitivity."},
    "LQD": {"name": "iShares iBoxx Investment Grade Corporate Bond", "category": "US Bonds", "market": "US", "description": "Tracks US investment-grade corporate bonds."},
    "HYG": {"name": "iShares iBoxx High Yield Corporate Bond", "category": "US Bonds", "market": "US", "description": "Tracks higher-yielding, lower-rated US corporate bonds."},
    "VNQ": {"name": "Vanguard Real Estate", "category": "US Property", "market": "US", "description": "Tracks US real estate investment trusts (REITs)."},
    "GLD": {"name": "SPDR Gold Shares", "category": "Commodity", "market": "US", "description": "Backed by physical gold bullion, tracking the dollar gold price."},
    "SLV": {"name": "iShares Silver Trust", "category": "Commodity", "market": "US", "description": "Backed by physical silver bullion, tracking the dollar silver price."},
    "VYM": {"name": "Vanguard High Dividend Yield", "category": "US Equity", "market": "US", "description": "Tracks US companies with above-average dividend yields."},
    "SCHD": {"name": "Schwab US Dividend Equity", "category": "US Equity", "market": "US", "description": "Tracks US companies with a strong history of paying dividends."},
    "AOR": {"name": "iShares Core Growth Allocation", "category": "Multi-Asset", "market": "US", "description": "A diversified portfolio of roughly 60% stocks and 40% bonds."},
    "AOA": {"name": "iShares Core Aggressive Allocation", "category": "Multi-Asset", "market": "US", "description": "A diversified portfolio of roughly 80% stocks and 20% bonds."},
    "VGK": {"name": "Vanguard FTSE Europe", "category": "Global Equity", "market": "US", "description": "Tracks large- and mid-cap stocks across developed Europe."},
    "EWJ": {"name": "iShares MSCI Japan", "category": "Global Equity", "market": "US", "description": "Tracks large- and mid-cap Japanese stocks."},
    "INDA": {"name": "iShares MSCI India", "category": "Global Equity", "market": "US", "description": "Tracks large- and mid-cap Indian stocks."},
    "EWZ": {"name": "iShares MSCI Brazil", "category": "Global Equity", "market": "US", "description": "Tracks large- and mid-cap Brazilian stocks."},
    "FXI": {"name": "iShares China Large-Cap", "category": "Global Equity", "market": "US", "description": "Tracks the largest Chinese companies listed in Hong Kong."},
    "URTH": {"name": "iShares MSCI World", "category": "Global Equity", "market": "US", "description": "Tracks large- and mid-cap stocks across developed markets worldwide."},
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
    cached = await get_cached(FUND_LIST_CACHE_KEY)
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
            "description": meta["description"],
            **quote,
        })

    await save_cached(FUND_LIST_CACHE_KEY, funds)
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

    cache = await db.fund_cache.find_one({"key": FUND_LIST_CACHE_KEY}, {"_id": 0})
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
        description=meta["description"],
        price=data["price"],
        change=data["change"],
        change_percent=data["change_percent"],
        returns=FundReturns(**data["returns"]),
        history=[PricePoint(**p) for p in data["history"]],
        last_updated=last_updated,
    )
