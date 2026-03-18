# AdvisoryPro - Product Requirements Document

## Latest Update: March 18, 2026

### Session: March 18, 2026
- ✅ **Complete Client Management Feature Removal** - All client-related features removed to align with new focus on individual investors:
  - Removed "Clients" navigation link from desktop and mobile Header
  - Removed "Unlimited Client Management" and "Up to 3 Clients" from PricingPage
  - Removed client routes from App.js (/clients, /clients/:clientId, etc.)
  - Updated Dashboard CTA from "client presentations" to "take control of your finances"
  - Changed Features section title from "Built for Advisors" to "Professional Tools"
  - Removed canAddMoreClients and getClientLimit from SubscriptionContext
  - Updated QuickActionsWidget to remove client stats
  - Updated LandingPage terminology (11+ instances updated)
  - Updated FinancialLiteracyQuiz terminology
  - Updated AuthPage premium features list
  - Updated FeatureGate premium features description

### Previous Session: March 18, 2026
- ✅ **Complete 2026/2027 CGT Updates** - All Capital Gains Tax exclusions updated:
  - **CGT Annual Exclusion** - R40,000 → **R50,000**
  - **CGT Primary Residence Exclusion** - R2,000,000 → **R3,000,000**
  - **CGT Death Exclusion** - R300,000 → **R440,000**
  - **Small Business Disposal (55+)** - R1,800,000 → **R2,700,000**
  
- ✅ **Admin User Management Endpoints** added:
  - DELETE /api/admin/users/{email} - Delete user and all their data
  - GET /api/admin/users - List all users
  - POST /api/admin/users/{email}/reset-subscription - Reset subscription

- ✅ **Coupon Code Issue Fixed** - Now creates in correct database
- ✅ **Compound Interest Calculator Verified** - Working correctly
- ✅ **Input Field Fix** - Added isFocused state to prevent typing issues

### Session: February 27, 2026
- ✅ **2026/2027 Tax Year Updates** - All tax figures updated per SA Budget Speech:
  - **Tax Brackets** - Updated all 7 brackets (e.g., 18% up to R245,100, etc.)
  - **Tax Rebates** - Primary: R17,820 | Secondary (65+): R9,765 | Tertiary (75+): R3,249
  - **Medical Credits** - Main: R376/month | Additional Dependent: R254/month
  - **TFSA Annual Limit** - Increased from R36,000 to **R46,000**
  - **RA Deduction Cap** - Increased from R350,000 to **R430,000**
  - **Tax Thresholds** - Under 65: R99,000 | 65-74: R153,250 | 75+: R171,300

---

## Original Problem Statement
Build a comprehensive financial SaaS platform called "AdvisoryPro" for South African investors and financial professionals. The platform should include:
- Full-stack application (React + FastAPI + MongoDB)
- Suite of financial calculators localized for South Africa (ZAR, local tax laws)
- User authentication with admin features
- Free/Premium subscription model (R249/month for Premium)
- High security standards (POPIA compliance, audit trails)

## User Personas
1. **Individual Investors** - Primary users who need calculators and planning tools
2. **Financial Professionals** - Secondary users who can use tools for personal planning
3. **Admin Users** - Manage coupons, view analytics, access all features

## Core Requirements
- Modern, clean, professional UI with **dark theme** (default) and optional light mode
- ZAR currency with South African tax calculations
- PDF report generation for all calculators
- Live market data tracker

---

## What's Been Implemented

### Financial Calculators (19 total)
1. Future Value Calculator (FREE)
2. Compound Interest Calculator (FREE)
3. Bond/Mortgage Calculator (FREE)
4. TFSA Calculator (FREE)
5. Monte Carlo Simulator
6. Vehicle Finance Calculator
7. Debt Payoff Calculator
8. Loan Comparison Tool
9. Life Insurance Calculator
10. Income Protection Calculator
11. Emergency Fund Calculator
12. Retirement Planner ✅ (Verified Feb 24, 2026)
13. Living Annuity Calculator
14. RA Tax Savings Calculator
15. Tax Directive Simulator (Withdrawal Tax)
16. Income Tax Calculator
17. Budget Planner
18. Cash Flow Projector
19. Fee Comparison Calculator (EAC)

### Tax Planning Hub
- Income Tax Calculator (2026/2027 brackets)
- Capital Gains Tax Calculator
- Tax Bracket Simulator
- Medical Aid Credits Estimator
- Provisional Tax Estimator
- IRP5 Storage (UI placeholder)
- All tabs have PDF export functionality

### Security & Compliance
- API-level data isolation per user
- Audit logging for all data access
- POPIA compliance documentation
- Security & Privacy Hub page

### User Management
- JWT authentication with "Remember Me"
- Admin role support
- Coupon code system (lifetime, annual, monthly)
- Password reset flow (email MOCKED)

### Payment Integration
- PayFast frontend integration
- PayFast backend ITN webhook

### Subscription Model
- **Free Tier:** TFSA, Bond, Future Value, Compound Interest calculators
- **Premium Tier:** All 19 calculators, PDF reports, AI features (R249/month)

### UI/UX
- CSS-based logo on landing page
- Navy blue color scheme
- Mobile-responsive design
- Dark/Light theme toggle

---

## Pending Tasks

### P0 - Critical
- [ ] **Deploy to Production** - Ready for deployment

### P1 - High Priority
- [ ] **IRP5 File Storage Backend** - UI exists, needs file upload implementation
- [ ] **Portfolio Builder & Xray Tool** - Placeholder in menu

### P2 - Medium Priority
- [ ] **Refactor TaxPlanningHub.jsx** - Move inner components to top level for performance
- [ ] **Light Theme Audit** - Ensure all components respect light theme

---

## Future/Backlog

### Planned New Projects (Separate Codebases)
- **AdvisoryPro US/Canada** - North American localized version
- **AdvisoryPro Personal** - Consumer B2C version
- **Portal Landing Page** - Domain router for regional subdomains

### Features
- [ ] Email integration for password reset (currently mocked)
- [ ] Integrate paid JSE data API (EODHD) - awaiting API key
- [ ] Multi-language support (Afrikaans, Zulu)
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
- **Payments**: PayFast (primary)
- **AI**: OpenAI GPT-4o via Emergent LLM Key

## Key Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing key
- `REACT_APP_BACKEND_URL` - API base URL
- `EMERGENT_LLM_KEY` - Universal LLM key

## Test Credentials
- **Admin**: Pierrelouisvdm@gmail.com / Scorpio@57!!
- **Test User**: test@advisor.com / newpassword123

---

## Deployment Status
**Status:** ✅ READY FOR PRODUCTION

Checked on March 18, 2026:
- Environment variables properly configured
- No hardcoded secrets
- CORS allows all origins
- Database using environment variables
- Supervisor configuration correct

---

*Last Updated: March 18, 2026*
