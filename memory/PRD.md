# Financial Advisory Pro - Product Requirements Document

## Latest Update: March 27, 2026

---

## Application Overview
**Financial Advisory Pro** is a comprehensive financial planning SaaS platform for South African investors. It provides 20+ professional calculators, tax planning tools, and financial tracking features - all localized for SA regulations and the 2026/2027 tax year.

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT

---

## Recent Session Updates (March 27, 2026)

### Features Implemented
1. ✅ **Tax Hub 2026/2027 Complete Update** - All tax values verified and updated
   - CGT annual exclusion: R50,000 (was R40,000)
   - CGT primary residence exclusion: R3m (was R2m)
   - Medical credits: R376/month main member (was R364)
   - Retirement deduction cap: R430,000 (was R350,000)
2. ✅ **Backend Receipt Storage** - Receipts now persist to Emergent Object Storage
   - New API: POST /api/transactions - Create transaction
   - New API: GET /api/transactions - List user transactions
   - New API: DELETE /api/transactions/{id} - Soft delete
   - New API: POST /api/transactions/{id}/receipt - Upload receipt
   - New API: GET /api/transactions/{id}/receipt - Download receipt
3. ✅ **Income & Expense Tracker Backend Integration** - Frontend now uses backend API
4. ✅ **AI-Powered Receipt OCR** - Auto-extracts data from receipt images using GPT-4o Vision
   - Extracts: amount, date, merchant name, category, description
   - New API: POST /api/transactions/{id}/receipt/analyze - Re-analyze existing receipt
   - New API: GET /api/transactions/{id}/receipt/ocr - Get stored OCR data
   - Frontend: "Apply Data" button to auto-fill form fields from OCR results
   - Frontend: "Re-analyze" button on receipts tab

### Previous Session (March 18, 2026)
1. ✅ **Client Management Feature Removed** - App now targets individual investors
2. ✅ **Tax Hub Highlighted** - Featured section on landing page with visual mockup
3. ✅ **Income & Expense Tracker** (Premium) - With receipt/invoice upload capability
4. ✅ **Weekly Market Insights** (Premium) - Analyst updates and CFP® tips
5. ✅ **Jurisdiction Selector** - SA active, USA/Canada/UK/Australia coming soon
6. ✅ **Annual Pricing Option** - R1,499/year (Save R1,489 vs monthly)
7. ✅ **Important Disclaimer** - Legal disclaimer across all pages
8. ✅ **App Renamed** - "Financial Advisory Pro"
9. ✅ **Tagline Updated** - "The Complete Financial Planning Toolkit for South Africans"
10. ✅ **Calculator Count Fixed** - Consistently shows 20+ calculators

### Tax Updates (2026/2027) ✅ VERIFIED
- Income tax brackets updated
- Tax rebates: Primary R17,820 | Secondary R9,765 | Tertiary R3,249
- Tax thresholds: Under 65 R99,000 | 65-74 R153,250 | 75+ R171,300
- TFSA annual limit: R46,000 (was R36,000)
- RA deduction cap: R430,000 (was R350,000)
- CGT annual exclusion: R50,000 (was R40,000)
- CGT primary residence: R3,000,000 (was R2,000,000)
- CGT death exclusion: R440,000 (was R300,000)
- Medical credits: R376/month main & first dependent, R254/month additional

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
6. Income & Expense Tracker (with receipt upload)
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

### Subscription Model
- **Free:** R0/forever - 4 calculators
- **Premium Monthly:** R249/month
- **Premium Annual:** R1,499/year (Save R1,489!)

---

## Tech Stack
- **Frontend:** React 18, TailwindCSS, shadcn/ui, Recharts
- **Backend:** FastAPI, Motor (async MongoDB)
- **Database:** MongoDB (Emergent-managed)
- **Auth:** JWT with bcrypt
- **Payments:** PayFast
- **AI:** OpenAI GPT-4o via Emergent LLM Key

## Test Credentials
- **Admin:** Pierrelouisvdm@gmail.com / Scorpio@57!!

---

## Deployment Checklist ✅
- [x] Environment variables configured
- [x] No hardcoded secrets
- [x] CORS allows production origins
- [x] Supervisor config valid
- [x] Database queries optimized
- [x] Frontend build scripts correct
- [x] Backend server configuration correct

---

## Future Roadmap

### P1 - High Priority
- [ ] IRP5 File Storage implementation
- [ ] Portfolio Builder & Xray Tool
- [ ] Connect Market Insights to real data API
- [ ] Password reset email integration

### P2 - Medium Priority
- [ ] Refactor TaxPlanningHub.jsx (1700+ lines - performance debt)
- [ ] Light theme audit and consistency
- [x] OCR for receipt auto-reading ✅ COMPLETED - Uses GPT-4o Vision
- [ ] Email notifications for weekly updates

### Future Projects
- US/Canada/UK/Australia localized versions (spec at /app/memory/US_VERSION_SPEC.md)
- White-labeling for financial firms
- Mobile app (React Native)

---

*Last Updated: March 27, 2026*
