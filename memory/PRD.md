# Financial Advisory Pro - Product Requirements Document

## Latest Update: March 18, 2026

---

## Application Overview
**Financial Advisory Pro** is a comprehensive financial planning SaaS platform for South African investors. It provides 20+ professional calculators, tax planning tools, and financial tracking features - all localized for SA regulations and the 2026/2027 tax year.

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT

---

## Recent Session Updates (March 18, 2026)

### Features Implemented
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

### Tax Updates (2026/2027)
- Income tax brackets updated
- Tax rebates: Primary R17,820 | Secondary R9,765 | Tertiary R3,249
- TFSA annual limit: R46,000
- RA deduction cap: R430,000
- CGT annual exclusion: R50,000
- CGT primary residence: R3,000,000

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
- [ ] Backend storage for receipts (currently localStorage)
- [ ] IRP5 File Storage implementation
- [ ] Portfolio Builder & Xray Tool
- [ ] Connect Market Insights to real data API

### P2 - Medium Priority
- [ ] Refactor TaxPlanningHub.jsx (performance)
- [ ] Light theme audit
- [ ] OCR for receipt auto-reading
- [ ] Email notifications for weekly updates

### Future Projects
- US/Canada/UK/Australia localized versions
- White-labeling for financial firms
- Mobile app (React Native)

---

*Last Updated: March 18, 2026*
