# AdvisoryPro Personal - Consumer App Specification

## Overview
A personal finance and investment tracking app for individual investors in South Africa and globally. Simpler than the advisor version, focused on personal portfolio management, live market data, and financial planning tools.

---

## 1. Target Audience
- Individual investors (retail)
- DIY investors managing their own portfolios
- People wanting to track investments across multiple platforms
- Users interested in dividend income tracking
- Beginner to intermediate investors

---

## 2. Tech Stack (Same as Advisor Version)

### Frontend
- **Framework:** React 18+ 
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts
- **State Management:** React Context API

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** MongoDB
- **Authentication:** JWT tokens
- **Market Data:** Multiple API providers (see section 6)

---

## 3. Core Features

### 3.1 Portfolio Tracker
```
Features:
- Manual entry of holdings (stock, ETF, unit trust, crypto)
- CSV/Excel import
- Real-time portfolio value
- Performance tracking (daily, weekly, monthly, YTD, all-time)
- Asset allocation pie chart
- Sector breakdown
- Geographic diversification view
- Cost basis tracking
- Profit/Loss calculation (realized & unrealized)

Data per holding:
- Symbol/Name
- Quantity
- Purchase price
- Purchase date
- Current price (live)
- Current value
- Gain/Loss (% and R)
- Dividend yield
```

### 3.2 Live Market Data Dashboard
```
Markets to cover:
- JSE Top 40 & All Share Index
- NASDAQ & NYSE (top movers)
- Crypto (BTC, ETH, top 20)
- Forex (USD/ZAR, EUR/ZAR, GBP/ZAR)
- Commodities (Gold, Platinum, Oil)

Features:
- Real-time price updates
- Daily change (% and value)
- Mini sparkline charts
- Watchlist (user-customizable)
- Price alerts (email/push notification)
- Market status (open/closed)
```

### 3.3 Dividend Tracker
```
Features:
- Dividend calendar (upcoming payments)
- Ex-dividend date alerts
- Annual dividend income projection
- Dividend yield analysis by holding
- Dividend history (past payments received)
- DRIP calculator (dividend reinvestment)
- Monthly/quarterly income breakdown

Display:
- Next 30 days dividends
- Annual dividend income goal tracker
- Yield on cost calculation
```

### 3.4 Watchlist
```
Features:
- Add any stock/ETF/crypto to watchlist
- Custom lists (e.g., "Tech Stocks", "Dividend Kings")
- Price alerts (above/below threshold)
- Quick view of key metrics
- One-click add to portfolio
```

### 3.5 Financial Planning Tools (Simplified)
```
Calculators:
1. Retirement Calculator
   - "Am I on track?" simple assessment
   - Input: age, current savings, monthly contribution, target
   - Output: projected retirement fund, gap analysis

2. TFSA Tracker
   - R36,000 annual limit tracking
   - Lifetime contribution tracker
   - Optimal contribution calculator

3. Emergency Fund Calculator
   - 3-6 months expenses target
   - Progress tracker
   - Time to goal

4. Compound Interest Calculator
   - Simple future value projections

5. Debt Payoff Planner
   - Snowball vs Avalanche comparison
   - Payoff timeline

6. Goal-Based Savings
   - House deposit
   - Car
   - Holiday
   - Education
   - Custom goals
```

### 3.6 Net Worth Tracker
```
Features:
- Assets: Cash, Investments, Property, Vehicles, Other
- Liabilities: Home loan, Car loan, Credit cards, Student loan
- Net worth calculation
- Historical snapshots (monthly)
- Growth chart over time
- Milestone celebrations
```

### 3.7 Tax Tools
```
Features:
- CGT Calculator (for selling shares)
  - Purchase price, sale price, holding period
  - 40% inclusion rate calculation
  - R40,000 annual exclusion

- TFSA Contribution Tracker
  - Annual limit: R36,000
  - Lifetime contributions
  - Space available

- Dividend Withholding Tax
  - 20% DWT calculator
  - Foreign dividend tax
```

### 3.8 Insights & Reports
```
Features:
- Weekly portfolio summary (email option)
- Monthly performance report
- Year-end tax summary
- PDF export for all reports
- "Your portfolio this week" dashboard widget
```

---

## 4. User Interface Design

### Theme
- Same design system as AdvisoryPro Advisor
- Dark navy background (#0a0a18)
- Blue accent colors
- Clean, modern, mobile-first

### Key Pages
```
1. Dashboard (Home)
   - Portfolio summary card
   - Market overview widget
   - Upcoming dividends
   - Quick actions

2. Portfolio
   - Holdings list
   - Performance chart
   - Asset allocation
   - Add/Edit holdings

3. Markets
   - Live prices grid
   - Search stocks
   - Watchlist
   - Market news (optional)

4. Dividends
   - Calendar view
   - Income projection
   - History

5. Planning
   - Goal cards
   - Calculators access
   - Net worth

6. Settings
   - Profile
   - Notifications
   - Data export
   - Currency preference
```

### Mobile-First Design
- Bottom navigation bar on mobile
- Swipeable cards
- Pull-to-refresh for live data
- Touch-friendly inputs

---

## 5. Database Schema

### Users Collection
```javascript
{
  id: "uuid",
  email: "user@example.com",
  password_hash: "bcrypt",
  full_name: "John Smith",
  currency: "ZAR",  // Display currency
  created_at: ISODate(),
  subscription_tier: "free", // free, plus, pro
  settings: {
    notifications: true,
    weekly_email: true,
    theme: "dark"
  }
}
```

### Holdings Collection
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  symbol: "SLM.JO",      // Yahoo Finance format
  name: "Sanlam Limited",
  exchange: "JSE",
  asset_type: "stock",   // stock, etf, crypto, unit_trust, other
  quantity: 100,
  purchase_price: 65.50,
  purchase_date: "2024-01-15",
  purchase_currency: "ZAR",
  notes: "Long-term hold",
  created_at: ISODate()
}
```

### Watchlist Collection
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  symbol: "AAPL",
  name: "Apple Inc",
  exchange: "NASDAQ",
  list_name: "Tech Stocks",  // Custom list
  price_alert_above: 200,
  price_alert_below: 150,
  added_at: ISODate()
}
```

### Net Worth Snapshots Collection
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  date: "2024-12-01",
  assets: {
    cash: 50000,
    investments: 250000,
    property: 1500000,
    vehicles: 150000,
    other: 20000
  },
  liabilities: {
    home_loan: 1200000,
    car_loan: 80000,
    credit_cards: 15000,
    other: 0
  },
  net_worth: 675000
}
```

### Goals Collection
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  name: "House Deposit",
  target_amount: 500000,
  current_amount: 125000,
  target_date: "2026-06-01",
  monthly_contribution: 8000,
  icon: "home",
  color: "blue"
}
```

### Dividends Collection (Received)
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  holding_id: "holding_uuid",
  symbol: "SLM.JO",
  amount_per_share: 1.25,
  total_amount: 125.00,
  ex_date: "2024-11-15",
  pay_date: "2024-12-02",
  currency: "ZAR",
  withholding_tax: 25.00  // 20% DWT
}
```

---

## 6. Market Data Integration

### Primary Providers (Free Tiers)

#### US Stocks (NASDAQ/NYSE)
```python
# Using yfinance (no API key needed)
import yfinance as yf

ticker = yf.Ticker("AAPL")
price = ticker.info['currentPrice']
change = ticker.info['regularMarketChangePercent']
```

#### JSE Stocks
```python
# Using yfinance with JSE suffix
ticker = yf.Ticker("SLM.JO")  # Sanlam on JSE
# or
ticker = yf.Ticker("NPN.JO")  # Naspers
```

#### Crypto
```python
# Using CoinGecko API (free)
import requests

response = requests.get(
    "https://api.coingecko.com/api/v3/simple/price",
    params={
        "ids": "bitcoin,ethereum,solana",
        "vs_currencies": "zar,usd",
        "include_24hr_change": "true"
    }
)
```

#### Forex
```python
# Using Alpha Vantage (free tier)
# Or yfinance
ticker = yf.Ticker("USDZAR=X")
```

### Fallback Strategy
```
Primary: yfinance (free, no key)
Fallback: Alpha Vantage (free key, 5 calls/min)
Crypto: CoinGecko (free, generous limits)
```

### Caching Strategy
```
- Cache prices for 1 minute (avoid rate limits)
- Store daily close prices in DB
- Background job to refresh watchlist prices
- WebSocket for real-time on dashboard (optional premium feature)
```

---

## 7. API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
```

### Portfolio
```
GET    /api/portfolio              - Get all holdings with live prices
POST   /api/portfolio/holdings     - Add new holding
PUT    /api/portfolio/holdings/:id - Update holding
DELETE /api/portfolio/holdings/:id - Delete holding
POST   /api/portfolio/import       - Import from CSV
GET    /api/portfolio/performance  - Get performance metrics
GET    /api/portfolio/allocation   - Get asset allocation
```

### Market Data
```
GET /api/markets/quote/:symbol     - Get live quote
GET /api/markets/quotes            - Get multiple quotes
GET /api/markets/search?q=         - Search symbols
GET /api/markets/indices           - Get major indices (JSE, S&P500, etc.)
GET /api/markets/movers            - Top gainers/losers
```

### Watchlist
```
GET    /api/watchlist              - Get user's watchlist
POST   /api/watchlist              - Add to watchlist
DELETE /api/watchlist/:id          - Remove from watchlist
PUT    /api/watchlist/:id/alert    - Set price alert
```

### Dividends
```
GET /api/dividends/upcoming        - Get upcoming dividends for holdings
GET /api/dividends/calendar        - Calendar view
GET /api/dividends/history         - Past dividends received
GET /api/dividends/projection      - Annual income projection
POST /api/dividends/record         - Record received dividend
```

### Net Worth
```
GET  /api/networth                 - Get latest snapshot
GET  /api/networth/history         - Historical snapshots
POST /api/networth/snapshot        - Create new snapshot
```

### Goals
```
GET    /api/goals                  - Get all goals
POST   /api/goals                  - Create goal
PUT    /api/goals/:id              - Update goal
DELETE /api/goals/:id              - Delete goal
PUT    /api/goals/:id/contribute   - Add contribution
```

### Calculators
```
POST /api/calculators/retirement   - Calculate retirement projection
POST /api/calculators/compound     - Compound interest calculation
POST /api/calculators/cgt          - Capital gains tax calculation
POST /api/calculators/tfsa         - TFSA space calculation
```

---

## 8. Monetization

### Tier Structure
```
FREE (R0)
- 10 holdings max
- Basic portfolio tracking
- Daily price updates
- 2 calculators
- Ads shown

PLUS (R49/month)
- Unlimited holdings
- Real-time prices
- All calculators
- Dividend tracker
- Watchlist (50 items)
- No ads
- Email reports

PRO (R99/month)
- Everything in Plus
- Price alerts (SMS/push)
- Advanced analytics
- Tax reports
- CSV/PDF exports
- Priority support
- API access (for power users)
```

---

## 9. Project Structure

```
/app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   ├── portfolio/       # Portfolio components
│   │   │   ├── markets/         # Market data components
│   │   │   ├── dividends/       # Dividend components
│   │   │   └── layout/          # Header, Nav, Footer
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Portfolio.jsx
│   │   │   ├── Markets.jsx
│   │   │   ├── Dividends.jsx
│   │   │   ├── Planning.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── NetWorth.jsx
│   │   │   └── Settings.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── PortfolioContext.jsx
│   │   │   └── MarketDataContext.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── marketData.js
│   │   └── hooks/
│   │       ├── usePortfolio.js
│   │       └── useMarketData.js
│   └── public/
├── backend/
│   ├── models/
│   │   ├── user.py
│   │   ├── holding.py
│   │   ├── watchlist.py
│   │   ├── dividend.py
│   │   ├── networth.py
│   │   └── goal.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── portfolio.py
│   │   ├── markets.py
│   │   ├── watchlist.py
│   │   ├── dividends.py
│   │   ├── networth.py
│   │   ├── goals.py
│   │   └── calculators.py
│   ├── services/
│   │   ├── market_data.py       # yfinance, CoinGecko integration
│   │   ├── dividend_service.py
│   │   └── cache.py
│   ├── utils/
│   │   └── auth.py
│   └── server.py
└── memory/
    └── PRD.md
```

---

## 10. Implementation Phases

### Phase 1: MVP (Week 1-2)
- [ ] Auth (register/login)
- [ ] Portfolio CRUD (manual entry)
- [ ] Live prices via yfinance
- [ ] Basic dashboard
- [ ] Holdings list view

### Phase 2: Market Data (Week 2-3)
- [ ] Markets page with live data
- [ ] Watchlist functionality
- [ ] Search symbols
- [ ] Price history charts

### Phase 3: Dividends (Week 3-4)
- [ ] Dividend tracker
- [ ] Calendar view
- [ ] Income projections
- [ ] Dividend history

### Phase 4: Planning Tools (Week 4-5)
- [ ] Net worth tracker
- [ ] Goals feature
- [ ] Basic calculators
- [ ] Reports/exports

### Phase 5: Polish (Week 5-6)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Price alerts
- [ ] Email notifications

---

## 11. Sample Code Snippets

### Market Data Service (Backend)
```python
# backend/services/market_data.py
import yfinance as yf
from typing import Dict, List
import requests

class MarketDataService:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 60  # seconds
    
    def get_quote(self, symbol: str) -> Dict:
        """Get live quote for a symbol"""
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            "symbol": symbol,
            "name": info.get("shortName", ""),
            "price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "change": info.get("regularMarketChange"),
            "change_percent": info.get("regularMarketChangePercent"),
            "volume": info.get("volume"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "dividend_yield": info.get("dividendYield"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
        }
    
    def get_crypto_prices(self, symbols: List[str]) -> Dict:
        """Get crypto prices from CoinGecko"""
        ids = ",".join(symbols)
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={
                "ids": ids,
                "vs_currencies": "zar,usd",
                "include_24hr_change": "true",
                "include_market_cap": "true"
            }
        )
        return response.json()
    
    def get_jse_index(self) -> Dict:
        """Get JSE All Share Index"""
        ticker = yf.Ticker("^J203.JO")  # JSE All Share
        return self.get_quote("^J203.JO")
```

### Portfolio Value Calculation (Frontend)
```javascript
// frontend/src/hooks/usePortfolio.js
import { useMemo } from 'react';

export const usePortfolioValue = (holdings, prices) => {
  return useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    
    const enrichedHoldings = holdings.map(holding => {
      const currentPrice = prices[holding.symbol]?.price || 0;
      const currentValue = holding.quantity * currentPrice;
      const costBasis = holding.quantity * holding.purchase_price;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
      
      totalValue += currentValue;
      totalCost += costBasis;
      
      return {
        ...holding,
        currentPrice,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent,
      };
    });
    
    return {
      holdings: enrichedHoldings,
      totalValue,
      totalCost,
      totalGainLoss: totalValue - totalCost,
      totalGainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    };
  }, [holdings, prices]);
};
```

---

## 12. Getting Started

When starting the new project:

1. Set up auth first (copy from AdvisoryPro Advisor)
2. Build portfolio CRUD
3. Integrate yfinance for live prices
4. Build dashboard with portfolio summary
5. Add markets page
6. Add dividend tracker
7. Add planning tools

---

## 13. Branding

**App Name:** AdvisoryPro Personal
**Tagline:** "Your Investments, Simplified"
**Domain suggestion:** personal.advisorypro.co.za

Use same color scheme as main AdvisoryPro:
- Dark navy background
- Blue accent colors
- Clean, modern typography

---

Good luck building AdvisoryPro Personal! 🚀
