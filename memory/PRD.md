# AdvisoryPro - Product Requirements Document

## Original Problem Statement
Build a comprehensive financial advisor SaaS platform called "AdvisoryPro" for South African financial advisors. The platform should include:
- Full-stack application (React + FastAPI + MongoDB)
- Suite of financial calculators localized for South Africa (ZAR, local tax laws)
- User authentication with admin features
- Premium subscription model via PayFast or coupon codes
- High security standards (POPIA compliance, audit trails)

## User Personas
1. **Financial Advisors** - Primary users who need calculators and client management
2. **Admin Users** - Manage coupons, view analytics, access all features
3. **Clients** - End beneficiaries of the calculations (not direct users)

## Core Requirements
- Modern, clean, professional UI with **white and navy blue theme** (light mode)
- ZAR currency with South African tax calculations
- PDF report generation for all calculators
- Client management system
- Live market data tracker

---

## What's Been Implemented

### Session: February 6, 2026

#### 1. Theme Change to White & Navy Blue ✅
- Complete application-wide theme overhaul from dark to light mode
- Updated CSS variables in `index.css` and `tailwind.config.js`:
  - Background: Light gray/white (`210 40% 98%`)
  - Primary: Navy blue (`220 70% 25%`)
  - Cards: Pure white with subtle borders
- Files updated for theme consistency:
  - `App.js` - Changed from dark to light mode initialization
  - `LandingPage.jsx` - Full refactor with theme variables
  - `Dashboard.jsx` - Updated all sections with `bg-background`, `text-foreground`
  - `AuthPage.jsx` - Light theme with navy accents
  - `Header.jsx` - Already using theme variables
  - `QuickActionsWidget.jsx` - Updated to use theme-aware classes
  - `MarketTracker.jsx` - Updated card and text styling
- Removed hardcoded dark colors (`bg-navy-950`, `text-white`) in favor of CSS variables (`bg-background`, `text-foreground`, `bg-card`, `text-primary`)

### Session: February 4, 2026

#### 1. Life Insurance Calculator Update ✅
- Changed recommended coverage to **10x annual salary** (was DIME method max)
- Added guideline text: "This is just a guideline. Your actual life insurance needs may vary..."
- Badge updated to show "Recommended Coverage (10x Annual Salary)"

#### 2. PayFast Backend Webhook ✅
- Created `/api/payments/payfast-notify` endpoint
- Handles ITN (Instant Transaction Notification) from PayFast
- Processes COMPLETE, PENDING, FAILED, CANCELLED statuses
- Stores transactions in `payfast_transactions` collection
- Auto-activates premium subscription on successful payment
- Duplicate notification prevention

#### 3. Menu Reorganization ✅
- **Invest**: Future Value, Compound Interest, Monte Carlo Simulator
- **Debt**: Bond, Vehicle Finance, Debt Payoff, Loan Comparison
- **Insurance**: Life Insurance, Income Protection, Emergency Fund
- **Retirement**: Retirement Planner, Living Annuity, RA Tax Savings, Withdrawal Tax Simulator
- **Tax**: Tax Planning Hub, Income Tax Calculator
- **Planning**: Net Worth Tracker, Budget Planner, Cash Flow Projector, Estate Planning, Education Savings
- **More**: Financial Literacy Quiz, Security & Privacy, Coming Soon features

#### 4. Quick Actions Dashboard Widget ✅
- New widget showing recent client activity for logged-in users
- Displays: Total Clients, Calculations This Month
- Recent Calculations with client name, calculator type, and time ago
- Upcoming Reviews with days until review date
- Empty state with CTA for new users
- Backend endpoint: `/api/analytics/quick-actions`

#### 5. Info Tooltips System ✅
- Created reusable `InfoTooltip` and `SectionInfo` components
- Added tooltips throughout Tax Planning Hub:
  - Income Sources section with tips
  - Deductions & Contributions section
  - Medical Aid section
  - CGT Calculator section
  - Individual field tooltips explaining each input
- Tooltips provide context-aware explanations for SA tax concepts

#### 6. Tax Hub Input Fix ✅
- Fixed input fields losing focus after each keystroke
- Moved InputField component outside main component to prevent re-renders

#### 7. Landing Page Updates ✅
- Restored "Empower Your Practice with AdvisoryPro" tagline
- Changed badge to "Built for Financial Advisors"
- Removed "What's New" section (hidden until public launch)
- Removed "hundreds of advisors" text
- Stats: 17+ calculators, SA localized, 24/7 access, PDF reports

#### 8. AI Document Reader ✅
- New feature at `/document-reader`
- Drag & drop upload for financial documents (PNG, JPG, JPEG, WEBP)
- GPT-4o Vision AI analysis for:
  - Investment statements (Allan Gray, Coronation, etc.)
  - Bank statements
  - Pension/Provident fund statements
  - IRP5 tax certificates
- Extracts: Personal details, account balances, holdings, transactions, fees, tax info
- Save extracted data to client profiles
- View history of analyzed documents
- Backend: `/api/documents/analyze`, `/api/documents/analyses`

### Previously Implemented Features

#### Financial Calculators (17 total)
1. Future Value Calculator
2. Compound Interest Calculator
3. Monte Carlo Simulator
4. Bond/Mortgage Calculator
5. Vehicle Finance Calculator
6. Debt Payoff Calculator
7. Loan Comparison Tool
8. Life Insurance Calculator
9. Income Protection Calculator
10. Emergency Fund Calculator
11. Retirement Planner
12. Living Annuity Calculator
13. RA Tax Savings Calculator
14. Tax Directive Simulator (Withdrawal Tax)
15. Income Tax Calculator
16. Budget Planner
17. Cash Flow Projector

#### Tax Planning Hub
- Income Tax Calculator (2025/2026 brackets)
- Capital Gains Tax Calculator
- Tax Bracket Simulator
- Medical Aid Credits Estimator
- Provisional Tax Estimator
- IRP5 Storage (UI placeholder)

#### Security & Compliance
- API-level data isolation per user
- Audit logging for all client data access
- POPIA compliance documentation
- Security & Privacy Hub page

#### User Management
- JWT authentication with "Remember Me"
- Admin role support
- Coupon code system (lifetime, annual, monthly)

#### Payment Integration
- PayFast frontend integration
- PayFast backend ITN webhook ✅ NEW
- Stripe integration (legacy)

---

## Pending/In Progress

### P0 - Critical
- [x] **Theme Change** - Completed white/navy blue theme ✅
- [ ] **Verify coupon redemption flow** - Users reported "codes keep saying invalid"

### P1 - High Priority
- [ ] **AI Document Reader E2E Test** - Backend/frontend exists but not tested end-to-end
- [ ] **IRP5 File Storage Backend** - UI exists but needs file upload/storage implementation
- [ ] **Portfolio Builder & Xray Tool** - Placeholder in menu

### P2 - Medium Priority
- [ ] **Client Creation API Debug** - `/api/clients/` endpoint returning redirect
- [ ] **Fee Comparison Tool** - Placeholder in menu
- [ ] **Password Reset Flow** - Standard "Forgot Password"

---

## Future/Backlog

### Features
- [ ] Integrate paid JSE data API (EODHD) - awaiting API key from user
- [ ] Multi-language support (Afrikaans, Zulu)
- [ ] Email notifications for registration, subscription changes
- [ ] AI-powered financial advice enhancement

### Technical Debt
- [ ] Add comprehensive backend tests
- [ ] Implement rate limiting
- [ ] Add request validation middleware

---

## Tech Stack
- **Frontend**: React 18, TailwindCSS, shadcn/ui, Recharts
- **Backend**: FastAPI, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing
- **Payments**: PayFast (primary), Stripe (legacy)

## Key Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing key
- `REACT_APP_BACKEND_URL` - API base URL
- `EMERGENT_LLM_KEY` - Universal LLM key

## Test Credentials
- **Admin**: pierrelouisvdm@gmail.com / Admin123!

---

*Last Updated: February 4, 2026*
