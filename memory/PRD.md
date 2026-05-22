# Financial Advisory Pro - Product Requirements Document

## Latest Update: Feb 2026 (AI Document Reader verified)

---

## Application Overview
**Financial Advisory Pro** is a comprehensive financial planning SaaS platform for South African investors. It provides 20+ professional calculators, tax planning tools, and financial tracking features - all localized for SA regulations and the 2026/2027 tax year.

**Status:** READY FOR PRODUCTION DEPLOYMENT

---

## Recent Session Updates (April 8, 2026)

### Changes Completed
1. **SA Pricing Updated** - Now R299/month or R1,299/year (Save R2,289!)
   - Updated PricingPage.jsx
   - Updated AuthPage.jsx
   - Updated LandingPage.jsx
2. **US Version Code Cleanup** - Removed all US-related code per user request (separate US app built)
   - Deleted: /frontend/src/pages/calculators/ (TaxCalculatorUS, Calculator401k, RothIRA, SocialSecurity, HSA, 529)
   - Deleted: /frontend/src/context/JurisdictionContext.jsx
   - Deleted: /frontend/src/components/JurisdictionSelector.jsx
   - Deleted: /frontend/src/data/usTaxData.js
   - Deleted: /app/memory/US_VERSION_SPEC.md
   - Deleted: /app/memory/ADVISORYPRO_US_CANADA_HANDOFF.md
   - Removed US routes from App.js
   - Removed US calculators section from Dashboard.jsx
   - Removed JurisdictionSelector from Header.jsx and LandingPage.jsx
3. **What's New Section** - Added to Dashboard highlighting:
   - 2026/2027 Tax Year updates
   - AI Receipt Scanner feature
   - Tax Planning Hub

### Previous Session (March 27, 2026)
1. **Tax Hub 2026/2027 Complete Update** - All tax values verified and updated
2. **Backend Receipt Storage** - Receipts persist to Emergent Object Storage
3. **AI-Powered Receipt OCR** - Auto-extracts data from receipt images using GPT-4o Vision
4. **Resend Email Integration** - Working password reset functionality

---

## Core Features

### Financial Calculators (20+)
**FREE (4 calculators):**
1. TFSA Calculator
2. Bond/Mortgage Calculator
3. Future Value Calculator
4. Compound Interest Calculator

**PREMIUM (16+ calculators):**
5. Tax Planning Hub (6 tax tools)
6. Income & Expense Tracker (with receipt upload & AI OCR)
7. Monte Carlo Simulator
8. Vehicle Finance Calculator
9. Debt Payoff Calculator
10. Loan Comparison Tool
11. Life Insurance Calculator
12. Income Protection Calculator
13. Emergency Fund Calculator
14. Retirement Planner
15. Living Annuity Calculator
16. RA Tax Savings Calculator
17. Tax Directive Simulator
18. Estate Planning Calculator
19. Education Savings Calculator
20. Budget Planner
21. Net Worth Tracker
22. Cash Flow Projector
23. Fee Comparison Calculator (EAC)
24. Risk Profile Quiz
25. Financial Literacy Quiz

### Premium Value Adds
- Weekly Market Updates by Analysts
- Tips from Certified Financial Planners
- PDF Report Generation
- AI Financial Assistant
- Live Market Tracker

### Subscription Model (South Africa)
- **Free:** R0/forever - 4 calculators
- **Premium Monthly:** R299/month (cancel anytime)
- **Premium Annual:** R1,499/year once-off (7-day refund policy, Save R2,089!)

---

## Tech Stack
- **Frontend:** React 18, TailwindCSS, shadcn/ui, Recharts
- **Backend:** FastAPI, Motor (async MongoDB)
- **Database:** MongoDB (Emergent-managed)
- **Auth:** JWT with bcrypt
- **Payments:** PayFast (SA)
- **AI:** OpenAI GPT-4o via Emergent LLM Key
- **Email:** Resend

---

## Deployment Checklist
- [x] Environment variables configured
- [x] No hardcoded secrets
- [x] CORS allows production origins
- [x] Supervisor config valid
- [x] Database queries optimized
- [x] Frontend build scripts correct
- [x] Backend server configuration correct

---

## Future Roadmap

### Recently Completed (Feb 2026)
- [x] **Client 360** — `/clients/:id/360` advisor-only hub with 5 stat tiles + Smart Actions + 6 tabs. New backend `GET /api/client-360/{id}` aggregates docs/reports/emails/compliance/portfolio_reviews. EmailGenerator, ComplianceNotes, PortfolioReview, ReportBuilder updated to read `?client_id=` from URL. ClientsPage gets green "360 View" button. Verified 6/6 backend + frontend. Side-fixes: registered missing `/clients` and `/clients/:id` routes, added Tailwind safelist.
- [x] **Multi-Document Portfolio Review** — `/portfolio-review`. Aggregates docs into one view with fee audit + diversification.
- [x] **AI Compliance & Advisor Notes** — `/compliance-notes`. 6 FAIS-aligned record types.
- [x] **Pricing redesigned** — 3-tier side-by-side comparison.
- [x] **AI Email & Communication Generator** (Feature #3) — `/email-generator`. 8 templates × 4 tones.
- [x] **Individual vs Financial Advisor workspace split** — role chosen at signup (locked in), dashboard renders advisor-only sections.
- [x] **AI Client Report Builder** (Feature #1) — `/report-builder`. Branded PDF reports.
- [x] **AI Document Reader fix** — client_id optional, formatted Summary/Details tabs.

### P1 - High Priority
- [ ] IRP5 File Storage implementation
- [ ] Portfolio Builder & Xray Tool
- [ ] Connect Market Insights to real data API

### P2 - Medium Priority
- [ ] Refactor TaxPlanningHub.jsx (1700+ lines - architectural debt)
- [ ] Light theme audit and consistency
- [ ] Email notifications for weekly updates

### Future Projects
- White-labeling for financial firms
- Mobile app (React Native)

---

*Last Updated: April 8, 2026*
