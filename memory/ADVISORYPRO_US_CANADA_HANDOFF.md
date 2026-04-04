# AdvisoryPro US/Canada - Architecture Handoff Document

## Overview
This document provides a complete blueprint for building AdvisoryPro for the US and Canadian markets, based on the South African version's architecture.

---

## 1. Tech Stack

### Frontend
- **Framework:** React 18+ with Create React App
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui (located in `/components/ui/`)
- **Icons:** Lucide React
- **Charts:** Recharts
- **State Management:** React Context API
- **Routing:** React Router v6
- **Notifications:** Sonner (toast notifications)

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** MongoDB with Motor (async driver)
- **Authentication:** JWT tokens with bcrypt password hashing
- **AI Integration:** OpenAI GPT-4o via Emergent LLM Key
- **PDF Generation:** ReportLab (for client reports)

### Infrastructure
- **Preview/Dev:** Emergent Platform (Kubernetes)
- **Database:** MongoDB (local in preview, Emergent-managed in production)
- **Payments:** PayFast (SA) → Replace with **Stripe** for US/Canada

---

## 2. Project Structure

```
/app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components (Button, Card, Input, etc.)
│   │   │   ├── calculators/     # Shared calculator components
│   │   │   │   ├── CalculatorCard.jsx
│   │   │   │   ├── InputField.jsx
│   │   │   │   ├── ResultDisplay.jsx
│   │   │   │   ├── GrowthChart.jsx
│   │   │   │   ├── PrintReport.jsx      # PDF export
│   │   │   │   ├── Disclaimer.jsx
│   │   │   │   └── ComparisonMode.jsx
│   │   │   └── layout/          # Header, Sidebar, Footer
│   │   ├── context/             # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CurrencyContext.jsx      # Multi-currency support
│   │   │   ├── SubscriptionContext.jsx
│   │   │   └── ThemeContext.jsx         # Light/Dark mode
│   │   ├── pages/               # All page components
│   │   ├── services/
│   │   │   └── api.js           # Axios API client
│   │   └── hooks/               # Custom React hooks
│   └── public/
├── backend/
│   ├── models/                  # Pydantic models
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── subscription.py
│   │   ├── coupon.py
│   │   └── calculation.py
│   ├── routes/                  # API endpoints
│   │   ├── auth.py              # Login, register, password reset
│   │   ├── clients.py           # Client CRUD
│   │   ├── calculations.py      # Save/load calculations
│   │   ├── subscriptions.py     # Subscription management
│   │   ├── payments.py          # Payment processing
│   │   ├── documents.py         # AI Document Reader
│   │   ├── ai_advisor.py        # AI chat assistant
│   │   └── analytics.py         # Usage analytics
│   ├── utils/
│   │   ├── auth.py              # JWT utilities
│   │   ├── security.py          # Audit logging
│   │   └── financial_analyzer.py
│   └── server.py                # FastAPI app entry point
└── memory/
    └── PRD.md                   # Product requirements
```

---

## 3. Core Features (Keep As-Is)

### Authentication & Users
- Email/password registration with validation
- JWT token authentication (access + refresh tokens)
- Password reset flow (token-based)
- Remember me functionality
- Admin user support

### Client Management
- Create, read, update, delete clients
- Financial data tracking per client
- Client profile with comprehensive financial snapshot
- Audit logging for compliance

### Subscription System
- Free tier with limited features
- Premium tier with full access
- Coupon code redemption
- Feature gating based on subscription

### AI Features
- **AI Document Reader:** Upload PDFs, extract and analyze financial data
- **AI Chat Assistant:** Context-aware financial advice chatbot
- Both use OpenAI GPT-4o via Emergent LLM Key

### Dashboard & Analytics
- Overview dashboard with key metrics
- Client portfolio summary
- Usage analytics for advisors

### Shared Calculator Components
These components are reusable across all calculators:
- `CalculatorCard.jsx` - Standard calculator layout wrapper
- `InputField.jsx` - Numeric input with currency prefix/suffix
- `ResultDisplay.jsx` - Formatted results display
- `GrowthChart.jsx` - Line/area charts for projections
- `PrintReport.jsx` - PDF export functionality
- `Disclaimer.jsx` - Legal disclaimer component

---

## 4. Calculators - Region Mapping

### South Africa → US/Canada Replacements

| SA Calculator | US Replacement | Canada Replacement |
|--------------|----------------|-------------------|
| **Tax Calculator** (SARS brackets) | IRS Federal Tax Calculator | CRA Tax Calculator |
| **Tax Planning Hub** (6 tools) | US Tax Planning Hub | Canada Tax Planning Hub |
| **Retirement Calculator** (RA/Pension) | 401(k)/IRA Calculator | RRSP/TFSA Calculator |
| **Living Annuity Calculator** | Annuity Calculator | RRIF Calculator |
| **Tax Directive Simulator** | N/A (different system) | N/A |
| **Retirement Tax Calculator** | Retirement Withdrawal Tax | RRSP Withdrawal Tax |
| **Education Savings** (Generic) | 529 Plan Calculator | RESP Calculator |
| **Estate Planning** (SA law) | US Estate Tax Calculator | Canada Estate Calculator |

### Universal Calculators (Minor Tweaks Needed)
These need only currency/terminology updates:

| Calculator | Changes Needed |
|-----------|----------------|
| Compound Interest | Currency symbol only |
| Future Value | Currency symbol only |
| Bond Calculator | Currency + terminology (Home loan → Mortgage) |
| Car Finance | Currency + terminology |
| Debt Payoff | Currency symbol only |
| Budget Planner | Currency symbol only |
| Emergency Fund | Currency + 3-6 months rule (same) |
| Life Insurance | Currency + terminology |
| Income/Disability | Currency + terminology |
| Net Worth Tracker | Currency symbol only |
| Cash Flow Projector | Currency symbol only |
| Loan Comparison | Currency + APR terminology |
| Monte Carlo Simulator | Currency symbol only |
| Risk Profile Quiz | No changes |
| Financial Literacy Quiz | Update questions for US/Canada context |

---

## 5. US-Specific Tax System

### Federal Tax Brackets (2024)
```javascript
const US_TAX_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11601, max: 47150, rate: 0.12 },
    { min: 47151, max: 100525, rate: 0.22 },
    { min: 100526, max: 191950, rate: 0.24 },
    { min: 191951, max: 243725, rate: 0.32 },
    { min: 243726, max: 609350, rate: 0.35 },
    { min: 609351, max: Infinity, rate: 0.37 },
  ],
  married_joint: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23201, max: 94300, rate: 0.12 },
    // ... etc
  ],
  // head_of_household, married_separate
};
```

### Key US Tax Concepts
- **Standard Deduction:** $14,600 single, $29,200 married filing jointly (2024)
- **401(k) Contribution Limit:** $23,000 ($30,500 if 50+)
- **IRA Contribution Limit:** $7,000 ($8,000 if 50+)
- **HSA Limits:** $4,150 individual, $8,300 family
- **Capital Gains:** 0%, 15%, or 20% based on income
- **Social Security Tax:** 6.2% up to $168,600
- **Medicare Tax:** 1.45% (+ 0.9% additional over $200k)
- **State Taxes:** Varies by state (0% to 13.3%)

### US Tax Hub Calculators
1. **Federal Income Tax** - IRS brackets, standard/itemized deductions
2. **State Income Tax** - State-specific rates
3. **Capital Gains Tax** - Short-term vs long-term
4. **Self-Employment Tax** - 15.3% SE tax
5. **Estimated Quarterly Tax** - Form 1040-ES
6. **W-4 Withholding Calculator**

---

## 6. Canada-Specific Tax System

### Federal Tax Brackets (2024)
```javascript
const CANADA_TAX_BRACKETS_2024 = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55868, max: 111733, rate: 0.205 },
  { min: 111734, max: 173205, rate: 0.26 },
  { min: 173206, max: 246752, rate: 0.29 },
  { min: 246753, max: Infinity, rate: 0.33 },
];
```

### Key Canada Tax Concepts
- **Basic Personal Amount:** $15,705 (2024)
- **RRSP Contribution Limit:** 18% of income, max $31,560
- **TFSA Contribution Limit:** $7,000/year (2024)
- **RESP Lifetime Limit:** $50,000 per beneficiary
- **Capital Gains Inclusion Rate:** 50% (changing to 66.67% for gains over $250k)
- **CPP/QPP:** Canada/Quebec Pension Plan contributions
- **EI Premiums:** Employment Insurance
- **Provincial Taxes:** Varies by province

### Canada Tax Hub Calculators
1. **Federal + Provincial Tax** - Combined calculator
2. **RRSP Contribution Optimizer** - Tax savings analysis
3. **TFSA vs RRSP Comparison**
4. **Capital Gains Calculator** - With inclusion rate
5. **Self-Employed Tax** - CPP contributions
6. **GST/HST Calculator** - For business owners

---

## 7. Database Schema

### Users Collection
```javascript
{
  id: "uuid",
  email: "user@example.com",
  password_hash: "bcrypt_hash",
  full_name: "John Smith",
  company: "Smith Financial",
  is_admin: false,
  reset_token: null,
  reset_token_expiration: null,
  created_at: ISODate(),
  updated_at: ISODate()
}
```

### Clients Collection
```javascript
{
  id: "uuid",
  advisor_id: "user_uuid",  // Foreign key to users
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@client.com",
  phone: "+1-555-123-4567",
  date_of_birth: "1985-03-15",
  occupation: "Software Engineer",
  notes: "High net worth, risk tolerant",
  financial_data: {
    monthly_income: 15000,
    monthly_expenses: 8000,
    total_assets: 500000,
    // ... comprehensive financial snapshot
  },
  created_at: ISODate(),
  updated_at: ISODate()
}
```

### Subscriptions Collection
```javascript
{
  user_id: "user_uuid",
  tier: "premium",  // "free" | "standard" | "premium"
  status: "active",
  billing_cycle: "annual",
  current_period_start: ISODate(),
  current_period_end: ISODate(),
  coupon_code: "ADVISOR-ABC123",
  payment_provider: "stripe",
  stripe_subscription_id: "sub_xxx"
}
```

### Coupons Collection
```javascript
{
  code: "ADVISOR-ABC123",
  coupon_type: "premium_lifetime",
  status: "active",  // "active" | "redeemed" | "disabled" | "expired"
  created_at: ISODate(),
  expires_at: null,
  redeemed_at: null,
  redeemed_by: null,
  redeemed_by_email: null
}
```

---

## 8. API Endpoints

### Authentication
```
POST /api/auth/register     - Create new user
POST /api/auth/login        - Login, returns JWT
POST /api/auth/refresh      - Refresh access token
POST /api/auth/request-password-reset
POST /api/auth/reset-password
GET  /api/auth/me           - Get current user
```

### Clients
```
GET    /api/clients         - List advisor's clients
POST   /api/clients         - Create client
GET    /api/clients/{id}    - Get client details
PUT    /api/clients/{id}    - Update client
DELETE /api/clients/{id}    - Delete client
PUT    /api/clients/{id}/financial-data - Update financial data
GET    /api/clients/{id}/analysis - Get AI analysis
```

### Subscriptions
```
GET  /api/subscriptions/status   - Get current subscription
POST /api/subscriptions/create   - Create subscription
POST /api/coupons/redeem         - Redeem coupon code
GET  /api/coupons/validate/{code}
```

### AI Features
```
POST /api/documents/analyze      - Analyze uploaded document
POST /api/ai-advisor/chat        - AI chat endpoint
GET  /api/ai-advisor/history     - Get chat history
```

### Calculations (Optional - for saving/loading)
```
POST /api/calculations           - Save calculation
GET  /api/calculations           - List saved calculations
GET  /api/calculations/{id}      - Get specific calculation
DELETE /api/calculations/{id}    - Delete calculation
```

---

## 9. Design System

### Color Palette (Dark Theme - Default)
```css
--navy-900: #0f172a;   /* Background */
--navy-800: #1e293b;   /* Cards */
--navy-700: #334155;   /* Borders */
--emerald-400: #34d399; /* Primary accent */
--emerald-500: #10b981; /* Primary */
--gold: #f59e0b;        /* Premium/highlight */
--slate-300: #cbd5e1;   /* Primary text */
--slate-400: #94a3b8;   /* Secondary text */
```

### Color Palette (Light Theme)
```css
--background: #ffffff;
--card: #f8fafc;
--border: #1e3a5f;      /* Navy blue */
--primary: #1e3a5f;     /* Navy blue */
--accent: #10b981;      /* Emerald */
```

### Typography
- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)
- **Font sizes:** Use Tailwind's scale (text-sm, text-base, text-lg, etc.)

### Component Patterns
- Cards with `bg-navy-900/60 border-navy-700` (dark mode)
- Inputs with `bg-navy-800 border-navy-600`
- Primary buttons: `bg-emerald-500 hover:bg-emerald-600`
- Result highlights: gradient backgrounds with colored borders

---

## 10. Key Implementation Notes

### Currency Context
The app uses a CurrencyContext that can be adapted:
```jsx
// Change default currency and add US/Canada options
const currencies = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
};
```

### Feature Gating
Use the `FeatureGate` component to restrict premium features:
```jsx
<FeatureGate feature="advancedCalculators">
  <MonteCarloSimulator />
</FeatureGate>
```

### Print/PDF Reports
Every calculator should include `<PrintReport />` component for client-ready exports.

### Mobile Responsiveness
All calculators use responsive grid: `grid lg:grid-cols-2 gap-6`

### Error Handling
- Use `sonner` toast notifications for user feedback
- API errors should return proper HTTP status codes
- Frontend catches errors and displays user-friendly messages

---

## 11. Payment Integration

### Replace PayFast with Stripe
```javascript
// US/Canada uses Stripe
// Key endpoints:
POST /api/payments/create-checkout-session
POST /api/payments/webhook  // Stripe webhook
GET  /api/payments/portal   // Customer billing portal
```

### Stripe Integration Notes
- Use Stripe Checkout for payment flow
- Implement webhook for subscription events
- Support monthly and annual billing
- Use Stripe Customer Portal for self-service

---

## 12. Getting Started Checklist

1. [ ] Set up new Emergent project
2. [ ] Copy project structure from this document
3. [ ] Install dependencies (see package.json, requirements.txt)
4. [ ] Set up MongoDB database
5. [ ] Configure environment variables
6. [ ] Implement authentication system
7. [ ] Build client management
8. [ ] Create US/Canada tax calculators (priority)
9. [ ] Adapt universal calculators (currency/terminology)
10. [ ] Implement Stripe payments
11. [ ] Add AI features (Document Reader, Chat)
12. [ ] Build dashboard and analytics
13. [ ] Test all features
14. [ ] Deploy

---

## 13. Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://taxcalc-us.preview.emergentagent.com
```

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=advisorypro_us
CORS_ORIGINS=*
JWT_SECRET=your-secret-key
EMERGENT_LLM_KEY=your-emergent-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_ANNUAL=price_xxx
```

---

## 14. Files to Copy Directly

These files can be copied with minimal changes:
- All `/components/ui/` shadcn components
- All `/components/calculators/` shared components
- `/context/AuthContext.jsx`
- `/context/SubscriptionContext.jsx`
- `/context/ThemeContext.jsx`
- `/services/api.js`
- `/backend/models/user.py`
- `/backend/models/client.py`
- `/backend/models/subscription.py`
- `/backend/routes/auth.py`
- `/backend/routes/clients.py`
- `/backend/utils/auth.py`
- `/backend/utils/security.py`

---

## Questions?

When starting the new project, you can reference this document and ask for specific implementations. The core architecture is proven and battle-tested in the South African version.

**Recommended first steps:**
1. Set up auth + client management (copy from SA version)
2. Build 401(k)/IRA calculator (US) or RRSP/TFSA calculator (Canada)
3. Build federal tax calculator
4. Add remaining calculators incrementally

Good luck with AdvisoryPro US/Canada!
