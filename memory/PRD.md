# AdvisoryPro - Financial Advisor Suite PRD

## Overview
A comprehensive financial calculator suite for financial advisors with client management, financial plan analysis, shortfall identification, subscription-based monetization, live market tracking, and AI-powered advisory.

## Original Requirements
1. Build a financial advisor application with various calculators
2. Initially requested: Future Value, Compound Interest, Bond, Car Finance calculators
3. Added: Inflation factor, Investment fee factor, Currency toggle (ZAR/USD)
4. Added: Life Insurance, Income Disability, Retirement calculators
5. Added: 8 new tools - Tax Calculator, Estate Planning, Emergency Fund, Debt Payoff, Education Savings, Budget Planner, Net Worth Tracker, Risk Profile Quiz
6. Annual return slider max increased to 50%, default 25%
7. ZAR set as default currency
8. **UI Redesign**: Modern, clean, professional look
9. **Backend Integration**: User auth, client management
10. **Financial Plan Shortfall Analysis**: Compile shortfalls and recommendations
11. **Subscription Tiers**: Free, Standard (R49/month), Premium (R149/month) with Stripe
12. **Live Market Tracker**: Gold, Silver, Bitcoin, Nasdaq, S&P 500, Nifty 50, Currency pairs to ZAR
13. **Feature Gating**: Only 4 calculators for free tier
14. **AI Financial Advisor**: GPT-5.2 powered chatbot for Premium users

## Tech Stack
- **Frontend**: React.js with react-router-dom
- **Backend**: FastAPI with Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui
- **Charts**: recharts
- **Payments**: Stripe (via emergentintegrations)
- **Market Data**: yfinance
- **AI**: GPT-5.2 via Emergent LLM Key

## Features Implemented

### 15 Financial Calculators
- **Investment**: Future Value, Compound Interest, Bond, Car Finance
- **Insurance**: Life Insurance (DIME), Income Disability, Retirement
- **Finance**: Tax Calculator, Budget Planner, Net Worth, Emergency Fund, Debt Payoff
- **Planning**: Estate Planning, Education Savings, Risk Profile Quiz

### Subscription System (NEW)
Three-tier pricing model:
- **Free (R0)**: 4 basic calculators, no client management
- **Standard (R49/month)**: All 15 calculators, 5 clients, PDF reports, market tracker
- **Premium (R149/month)**: Unlimited clients, all advanced tools, portfolio tracker
- **Annual discount**: 17% off (R490/year Standard, R1490/year Premium)
- **7-day free trial** for paid tiers

### Live Market Tracker (NEW)
Real-time market data refreshing every 15 minutes:
- **Indices**: Nasdaq, S&P 500, Nifty 50, SA Property ETF
- **Commodities**: Gold, Silver, Bitcoin
- **Currency Pairs**: USD/ZAR, EUR/ZAR, GBP/ZAR, JPY/ZAR, AUD/ZAR, CHF/ZAR, CNY/ZAR, INR/ZAR
- Data cached in MongoDB for performance

### AI Financial Advisor (Premium)
GPT-5.2 powered chatbot for premium users:
- Personalized financial advice
- Explains complex financial concepts
- South African tax and investment expertise
- Context-aware based on client data
- Chat history persistence
- Quick tips available for all users

### Feature Gating
Subscription-based feature access:
- **Free Tier (4 calculators)**: Future Value, Compound Interest, Bond, Car Finance
- **Standard+**: All 15 calculators + Market Tracker
- **Premium**: AI Advisor + All client tools + Unlimited clients

### Backend API
- **Auth**: Register/Login with JWT tokens
- **Clients CRUD**: Create, read, update, delete client profiles
- **Financial Data**: Store and update client financial information
- **Shortfall Analysis**: AI-powered analysis of financial gaps
- **Subscriptions**: Checkout, status polling, trial activation
- **Market Data**: Live indices and currency pairs

### Financial Plan Shortfall Analysis
Analyzes client's financial data and identifies gaps across 8 categories:

1. **Life Insurance Gap** - Compares coverage vs DIME-calculated need
2. **Emergency Fund Deficit** - Checks 3-6 months expenses coverage
3. **Retirement Shortfall** - Projects retirement savings adequacy
4. **Debt-to-Asset Ratio** - Flags high debt levels (>50%)
5. **Savings Rate** - Checks if saving 20%+ of income
6. **Education Savings Gap** - Projects children's education funding
7. **Estate Liquidity** - Checks liquid assets vs estate duty
8. **Disability Coverage** - Ensures 75%+ income replacement

Each shortfall includes:
- Priority level (Critical, High, Medium, Low)
- Current vs Target values with gap amount
- Specific recommendations
- Actionable items
- Estimated monthly cost to close gap

### Client Management
- Client profiles with contact info
- Financial data storage (income, assets, liabilities, insurance, etc.)
- Calculation history per client
- Shortfall analysis dashboard

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new advisor account
- `POST /api/auth/login` - Login and get JWT token

### Clients
- `GET /api/clients` - List all clients (requires auth)
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get specific client
- `PUT /api/clients/:id` - Update client info
- `DELETE /api/clients/:id` - Delete client
- `PUT /api/clients/:id/financial-data` - Update financial data
- `GET /api/clients/:id/analysis` - Get shortfall analysis
- `POST /api/clients/:id/analysis/refresh` - Force refresh analysis

### Calculations
- `POST /api/calculations` - Save calculation for client
- `GET /api/calculations/client/:id` - Get client's calculations

## Architecture
```
/app
├── backend/
│   ├── models/
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── calculation.py
│   │   └── financial_plan.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── clients.py
│   │   └── calculations.py
│   ├── utils/
│   │   ├── auth.py
│   │   └── financial_analyzer.py
│   └── server.py
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CurrencyContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── ClientsPage.jsx
│   │   │   ├── ClientProfilePage.jsx
│   │   │   └── (15 calculator pages)
│   │   └── components/
│   └── package.json
```

## Database Schema

### Users Collection
```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "company": "string",
  "hashed_password": "string",
  "is_active": true,
  "created_at": "datetime"
}
```

### Clients Collection
```json
{
  "id": "uuid",
  "advisor_id": "uuid",
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone": "string",
  "occupation": "string",
  "financial_data": {
    "monthly_income": 0,
    "monthly_expenses": 0,
    "total_assets": 0,
    "total_liabilities": 0,
    "life_insurance_coverage": 0,
    "life_insurance_needed": 0,
    "emergency_fund_current": 0,
    "emergency_fund_needed": 0,
    "retirement_savings": 0,
    "retirement_goal": 0,
    ...
  }
}
```

## Future Backlog
- **P3**: Email notifications for review reminders
- **P3**: Associate calculator results directly with client profiles
- **P3**: Add alternative JSE data source (Yahoo Finance doesn't support JSE indices)
- **P3**: Webhook handling for subscription renewals

## Status
✅ **Complete** - Full SaaS Platform with Subscription Monetization + AI Advisor
- Backend API: 100% pass rate (35/35 tests)
- Frontend: 100% pass rate
- Auth flow: Working (register, login, logout)
- Client CRUD: Working
- Shortfall Analysis: Working with 8 categories
- Advanced Tools: All 7 new tools working
- **Subscription System**: 3 tiers with Stripe checkout
- **Market Tracker**: Live indices, commodities (Gold/Silver/Bitcoin), currencies
- **Feature Gating**: 4 free calculators, paid calculators gated
- **AI Advisor**: GPT-5.2 chatbot for premium users

### Known Limitations
- JSE indices (Top 40, All Share) not directly available - using EZA ETF as SA market proxy
- AI Advisor requires EMERGENT_LLM_KEY budget - users can top up via Profile > Universal Key

## Advanced Tools Suite (New - December 2025)

### Standalone Tools (Public Access)
1. **Cash Flow Projector** (`/cash-flow`)
   - Track monthly income vs expenses
   - Multi-year projections with growth rates
   - Visual breakdown of expense categories

2. **Monte Carlo Retirement Simulator** (`/monte-carlo`)
   - 1000+ simulations for retirement planning
   - Probability of success calculation
   - Ending balance percentile distribution

3. **Loan Comparison Tool** (`/loan-comparison`)
   - Compare up to 5 loan options
   - Automatic best option identification
   - Total cost and savings calculation

### Client-Specific Tools (Authenticated)
4. **Goal Planner** (`/clients/{id}/goals`)
   - Track multiple financial goals
   - Progress tracking with status badges
   - Monthly contribution calculator

5. **Meeting Scheduler** (`/clients/{id}/meetings`)
   - Record meeting notes
   - Track action items
   - Schedule follow-ups

6. **Review Tracker** (`/clients/{id}/reviews`)
   - Set periodic review schedules
   - Customizable checklists
   - Reminder system

7. **Portfolio Tracker** (`/clients/{id}/portfolio`)
   - Track holdings by asset class
   - Diversification scoring
   - Rebalancing suggestions

8. **PDF Report Generation**
   - Download financial analysis reports
   - Download goals progress reports
   - Client-branded PDFs

## Changelog

### December 2025 - Advanced Tools Suite
- Added 7 new frontend pages for advanced financial tools
- Implemented Monte Carlo simulation endpoint
- Added Goal Planner with CRUD operations
- Added Meeting Scheduler with action item tracking
- Added Review Tracker with customizable checklists
- Added Portfolio Tracker with rebalancing suggestions
- Added PDF report generation using reportlab
- Updated Header navigation with "Advanced" dropdown
- Added quick action buttons on client profile page

### January 2026 - Subscription & Market Tracker
- Added 3-tier subscription system (Free, Standard R49, Premium R149)
- Integrated Stripe checkout for payments
- Added 7-day free trial functionality
- Annual billing with 17% discount
- Live Market Tracker with 15-minute refresh
- Indices: Nasdaq, S&P 500, Nifty 50, SA Property ETF
- Currency pairs: USD/ZAR, EUR/ZAR, GBP/ZAR, and 5 more
- Pricing page with feature comparison
- Subscription success page with status polling

### December 2025 - Backend & Client Management
- Implemented FastAPI backend with MongoDB
- Added JWT authentication (email/password)
- Created client management system
- Built financial plan shortfall analyzer
- Added client profile with financial data forms
- Integrated shortfall analysis display with priority cards

### December 2025 - UI Redesign
- Replaced Playfair Display/Inter fonts with Manrope/Public Sans
- Changed color scheme from Navy/Gold to Slate/Emerald
- Modernized all components

### December 2025 - Initial Implementation
- Implemented all 15 financial calculators
- Added currency toggle and dark mode
