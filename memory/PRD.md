# AdvisoryPro - Product Requirements Document

## Latest Update: March 18, 2026

### Session: March 18, 2026 (Latest)
- ✅ **Tax Hub Highlighted Across App**
  - Added "Explore Tax Hub" button in landing page hero section
  - Created dedicated Tax Hub feature section on landing page with visual mockup
  - Shows all 6 tax tools: Income Tax, CGT, Medical Aid, RA Tax Savings, Provisional Tax, Income & Expense Tracker
  - Updated stats row to highlight "Tax Hub - Complete Tax Suite"
  
- ✅ **NEW: Income & Expense Tracker (Premium Feature)**
  - Track income and expenses with categories
  - Budget vs Actual comparison
  - Tax-deductible expense tagging (auto-suggests for business, education, healthcare)
  - Recurring transaction support
  - Monthly reports with PDF export
  - Savings rate calculation
  - Summary cards: Total Income, Total Expenses, Net Income, Tax Deductible
  - Local storage persistence
  
- ✅ **UI Updates**
  - Changed tagline to "EMPOWER YOUR FINANCIAL FUTURE"
  - Tax Planning Hub shows as "Featured" with green styling on Dashboard
  - Income & Expense Tracker shows "NEW" badge on Dashboard
  - Removed team/founders bio section from landing page
  - Fixed auth page pricing: R249/month (was R299)
  - Added Free tier display (R0/forever with 4 calculators)

- ✅ **Client Management Feature Removed** (earlier this session)
  - All client-related features and text removed
  - App now targets individual investors

### Previous Updates
- ✅ 2026/2027 Tax Year Updates (all brackets, rebates, CGT exclusions)
- ✅ Admin User Management Endpoints
- ✅ Coupon Code Bug Fixed
- ✅ Calculator Input Bug Fixed

---

## Original Problem Statement
Build a comprehensive financial SaaS platform called "AdvisoryPro" for South African investors. The platform should include:
- Full-stack application (React + FastAPI + MongoDB)
- Suite of financial calculators localized for South Africa
- User authentication with Free/Premium subscription model
- Tax Planning Hub with comprehensive tax tools
- High security standards (POPIA compliance)

## Core Features

### Financial Calculators (20 total)
**FREE (4 calculators):**
1. Future Value Calculator
2. Compound Interest Calculator
3. Bond/Mortgage Calculator
4. TFSA Calculator

**PREMIUM (16 calculators):**
5. Monte Carlo Simulator
6. Vehicle Finance Calculator
7. Debt Payoff Calculator
8. Loan Comparison Tool
9. Life Insurance Calculator
10. Income Protection Calculator
11. Emergency Fund Calculator
12. Retirement Planner
13. Living Annuity Calculator
14. RA Tax Savings Calculator
15. Tax Directive Simulator
16. Income Tax Calculator
17. Budget Planner
18. Cash Flow Projector
19. Fee Comparison Calculator (EAC)
20. **Income & Expense Tracker** (NEW)

### Tax Planning Hub (Premium)
- Income Tax Calculator (2026/2027 brackets)
- Capital Gains Tax Calculator (R50,000 annual exclusion)
- Tax Bracket Simulator
- Medical Aid Credits Estimator
- Provisional Tax Estimator
- IRP5 Storage

### Subscription Model
- **Free Tier:** R0/forever - 4 calculators
- **Premium Tier:** R249/month - All 20 calculators, PDF reports, AI features

---

## Tech Stack
- **Frontend**: React 18, TailwindCSS, shadcn/ui, Recharts
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt
- **Payments**: PayFast
- **AI**: OpenAI GPT-4o via Emergent LLM Key

## Test Credentials
- **Admin**: Pierrelouisvdm@gmail.com / Scorpio@57!!

---

## Pending Tasks

### P0 - Critical
- [ ] **Deploy to Production**

### P1 - High Priority
- [ ] **IRP5 File Storage Backend** - UI exists, needs file upload
- [ ] **Portfolio Builder & Xray Tool** - Placeholder exists

### P2 - Medium Priority
- [ ] **Refactor TaxPlanningHub.jsx** - Move inner components outside
- [ ] **Light Theme Audit** - Ensure consistency

---

## Future/Backlog
- Email integration for password reset (currently mocked)
- JSE data API integration
- Multi-language support (Afrikaans, Zulu)
- WhiteLabeling / Portal page
- US/Canada localized version

---

## Deployment Status
**Status:** ✅ READY FOR PRODUCTION

---

*Last Updated: March 18, 2026*
