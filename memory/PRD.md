# AdvisoryPro - Product Requirements Document

## Latest Update: February 24, 2026

### Session: February 24, 2026
- ✅ **Retirement Calculator Verified** - All calculations mathematically accurate
  - Projected Nest Egg calculation verified
  - Funding Ratio calculation verified  
  - Shortfall/Surplus calculation verified
  - Additional monthly savings recommendation verified
- ✅ **Deployment Check Passed** - Application ready for production
  - All environment variables properly configured
  - No hardcoded secrets or URLs
  - CORS correctly configured
  - MongoDB connections using environment variables
- ✅ **All Calculators Reset to 0 Defaults** - Updated 15+ calculators to have 0 as default values for all monetary inputs
  - Fee Comparison Calculator
  - TFSA Calculator
  - Debt Payoff Calculator
  - Net Worth Tracker
  - Budget Planner
  - Cash Flow Projector
  - Bond Calculator
  - Car Finance Calculator
  - Life Insurance Calculator
  - Income Disability Calculator
  - Emergency Fund Calculator
  - Living Annuity Calculator
  - Monte Carlo Simulator
  - Loan Comparison Tool
  - Tax Calculator
  - Retirement Tax Calculator
  - Estate Planning Calculator
  - Education Savings Calculator

### Previous Session: February 19, 2026
- ✅ PDF Export added to all Tax Hub calculator tabs
- ✅ Fee Comparison Calculator created (2-way comparison)
- ✅ TFSA Calculator created and integrated
- ✅ Mobile menu fixed with collapsible categories
- ✅ Complete branding overhaul (CSS logo, navy blue theme)
- ✅ 10 new Premium Lifetime coupon codes generated

---

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
- Modern, clean, professional UI with **dark theme** (default) and optional light mode
- ZAR currency with South African tax calculations
- PDF report generation for all calculators
- Client management system
- Live market data tracker

---

## What's Been Implemented

### Financial Calculators (19 total)
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
11. Retirement Planner ✅ (Verified Feb 24, 2026)
12. Living Annuity Calculator
13. RA Tax Savings Calculator
14. Tax Directive Simulator (Withdrawal Tax)
15. Income Tax Calculator
16. Budget Planner
17. Cash Flow Projector
18. Fee Comparison Calculator (NEW - Feb 2026)
19. TFSA Calculator (NEW - Feb 2026)

### Tax Planning Hub
- Income Tax Calculator (2025/2026 brackets)
- Capital Gains Tax Calculator
- Tax Bracket Simulator
- Medical Aid Credits Estimator
- Provisional Tax Estimator
- IRP5 Storage (UI placeholder)
- All tabs have PDF export functionality

### Security & Compliance
- API-level data isolation per user
- Audit logging for all client data access
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
- Stripe integration (legacy)

### UI/UX
- CSS-based logo on landing page (seamless dark theme integration)
- Navy blue color scheme
- Mobile-responsive with collapsible calculator menu
- Dark/Light theme toggle

---

## Pending Tasks

### P0 - Critical
- [x] **Verify Retirement Calculator** - Completed Feb 24, 2026 ✅
- [ ] **Deploy to Production** - Ready for deployment, awaiting user action

### P1 - High Priority
- [ ] **IRP5 File Storage Backend** - UI exists, needs file upload implementation
- [ ] **Portfolio Builder & Xray Tool** - Placeholder in menu

### P2 - Medium Priority
- [ ] **Refactor TaxPlanningHub.jsx** - Move inner components to top level for performance
- [ ] **Light Theme Audit** - Ensure all components respect light theme

---

## Future/Backlog

### Planned New Projects (Separate Codebases)
- **AdvisoryPro US/Canada** - North American localized version (see ADVISORYPRO_US_CANADA_HANDOFF.md)
- **AdvisoryPro Personal** - Consumer B2C version (see ADVISORYPRO_PERSONAL_SPEC.md)
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
- **Payments**: PayFast (primary), Stripe (legacy)
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

Checked on Feb 24, 2026:
- Environment variables properly configured
- No hardcoded secrets
- CORS allows all origins
- Database using environment variables
- Supervisor configuration correct

---

*Last Updated: February 24, 2026*
