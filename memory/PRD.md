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
- Modern, clean, professional UI with **dark theme** (default) and optional light mode via toggle
- ZAR currency with South African tax calculations
- PDF report generation for all calculators
- Client management system
- Live market data tracker

---

## What's Been Implemented

### Session: February 16, 2026

#### 1. Password Reset Flow ✅
- Created `/request-password-reset` page for users to enter their email
- Created `/reset-password` page to enter reset code and new password
- Backend endpoints:
  - `POST /api/auth/forgot-password` - Generates 6-digit reset code (15 min expiry)
  - `POST /api/auth/verify-reset-code` - Validates code and updates password
- Features:
  - Secure reset code generation (6 digits)
  - Code expires after 15 minutes
  - Code can only be used once
  - Password validation (min 6 characters)
  - Email enumeration protection (same response for valid/invalid emails)
- "Forgot password?" link added to login form
- Header/footer hidden on password reset pages
- **Note**: Email sending is MOCKED - reset code returned in API response for testing

#### 2. Bug Fix: Timezone Comparison ✅
- Fixed `TypeError: can't compare offset-naive and offset-aware datetimes` in password reset
- Added timezone awareness handling in `auth.py`

### Session: February 6, 2026

#### 1. Theme Toggle Feature ✅
- Created `ThemeContext.jsx` - Context provider for managing theme state
- Created `ThemeToggle.jsx` - Sun/Moon icon button component
- Integrated toggle into Header (next to currency selector)
- Dark mode is now the **default** (user preference)
- Light mode available via toggle

#### 2. AI Document Reader Enhanced ✅
- Added custom prompt input field
- Added preset analysis buttons (Calculate Fees, List Holdings, etc.)
- Users can now choose what to extract from documents

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
- Password reset flow ✅

#### Payment Integration
- PayFast frontend integration
- PayFast backend ITN webhook
- Stripe integration (legacy)

---

## Pending/In Progress

### P0 - Critical
- [x] **Password Reset Flow** - Completed ✅
- [ ] **Verify coupon redemption flow** - Users reported "codes keep saying invalid"

### P1 - High Priority
- [x] **AI Document Reader E2E Test** - Working ✅
- [ ] **IRP5 File Storage Backend** - UI exists but needs file upload/storage implementation
- [ ] **Portfolio Builder & Xray Tool** - Placeholder in menu

### P2 - Medium Priority
- [x] **Client Creation API** - Fixed ✅
- [ ] **Fee Comparison Tool** - Placeholder in menu

---

## Future/Backlog

### Features
- [ ] Email integration for password reset (currently mocked)
- [ ] Integrate paid JSE data API (EODHD) - awaiting API key from user
- [ ] Multi-language support (Afrikaans, Zulu)
- [ ] Email notifications for registration, subscription changes
- [ ] AI-powered financial advice enhancement

### Technical Debt
- [ ] Add comprehensive backend tests
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Full light theme audit (some components may have hardcoded dark colors)

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
- **Test User**: test@advisor.com / newpassword123

---

*Last Updated: February 16, 2026*
