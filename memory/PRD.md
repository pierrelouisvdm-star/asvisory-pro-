# Financial Advisory Pro — PRD

## Original Problem Statement
Build and deploy "Financial Advisory Pro" — a dual-jurisdiction (SA + US) financial advisory SaaS platform targeting 100,000 American users and 10,000 South African users. Core requirements: Free/Premium subscription (R299/mo, R1999/yr SA; $19/mo, $199/yr US), updated 2026/2027 SA tax rules, cloud backend storage + AI OCR for receipts, real password reset emails, and full US version with parity.

## User Personas
- South African individuals and financial advisors
- American individuals, financial advisors, and 1099/freelance workers (primary growth target)

## Core Technical Architecture
- Frontend: React + Tailwind CSS + Shadcn UI
- Backend: FastAPI (Python)
- Database: MongoDB
- Context: JurisdictionContext (SA/US switch) + CurrencyContext (auto-syncs R/$ with jurisdiction)

---

## What's Been Implemented

### Phase 1 — SA Foundation (Complete)
- 20+ professional calculators for SA users (Investment, Debt, Insurance, Retirement, Personal Finance, Planning)
- 2026/2027 Tax rules fully updated (CGT R50k/R3m, Medical R376, RA R430k)
- Free/Premium subscription model: R299/month or R1999/year
- Custom SVG logo (`AdvisoryProLogo.jsx`)
- Landing page copy updated with user-provided copy deck
- Lifetime coupon codes: LIFETIME2026, FOUNDERS100

### Phase 2 — Infrastructure (Complete)
- Backend receipt storage (`/api/transactions/upload_receipt`) connected to UI
- AI-powered Receipt OCR using GPT-4o Vision (auto-extracts amount, date, merchant, category)
- Real password reset emails via Resend (6-digit code)
- `JurisdictionContext` — global SA/US state management
- `CurrencyContext` — auto-syncs R↔$ with jurisdiction, fixes currencySymbol bug

### Phase 3 — US Version Phase 1 (Complete — Feb 2026)
- US Tax Data (`usTaxData.js`) — 2024/25 federal brackets, all 50 states
- **9 US Calculators (Batch 1) fully built and routed**:
  - `TaxCalculatorUS.jsx` — Federal + State income tax for all 50 states
  - `Calculator401k.jsx` — 401(k) with employer match, tax benefits, Roth vs Traditional
  - `RothIRACalculator.jsx` — Tax-free growth projections, income limits, backdoor Roth
  - `SocialSecurityCalculator.jsx` — Benefit estimates, claiming age optimizer, spousal benefits
  - `HSACalculator.jsx` — Triple tax advantage, contribution limits, growth projection
  - `Calculator529.jsx` — College savings, state tax benefits, funding gap
  - `FIRECalculator.jsx` — Lean/Regular/Fat/Coast FIRE variants + **Social Share (Twitter/X, Reddit, Copy)**
  - `StudentLoanCalculator.jsx` — IBR/SAVE, PSLF, refinancing, extra payments comparison
  - `SelfEmployedTaxCalculator.jsx` — 1099 income, QBI deduction, SE tax, W-2 comparison
- **US Onboarding Wizard** (`USOnboardingWizard.jsx`): 5-step personalization
- **Dashboard fully jurisdiction-aware**: SA-only tools hidden from US users; 26 US calculators shown
- **Landing page fully US-aware**: Hero copy, stats, pricing ($19/mo, $199/yr)
- **Income & Expense Tracker** — US-specific categories; **Net Worth Tracker** — locale/currency adapt

### Phase 3 — US Version Phase 2 (Complete — Feb 2026)
- **13 NEW US Calculators fully built and routed** (total: 26 US calculators):
  - `CapitalGainsTaxCalculator.jsx` — `/us/capital-gains` — Short/LT rates, NIIT, all 50 states
  - `RMDCalculator.jsx` — `/us/rmd` — SECURE 2.0 (age 73), IRS uniform table, 20-yr schedule
  - `RothConversionCalculator.jsx` — `/us/roth-conversion` — Break-even analysis, optimal strategy
  - `PaycheckCalculator.jsx` — `/us/paycheck` — Gross-to-net, FICA, state tax, pre-tax deductions
  - `MedicareIRMAA.jsx` — `/us/irmaa` — Part B/D IRMAA surcharges, all 6 tiers, appeal tips
  - `W4Optimizer.jsx` — `/us/w4-optimizer` — W-4 Steps 3/4 recommendations, bracket room
  - `HomeAffordabilityCalculator.jsx` — `/us/home-affordability` — 28/36 DTI, PITI breakdown, PMI
  - `RentVsBuyCalculator.jsx` — `/us/rent-vs-buy` — Break-even, opportunity cost, net cost chart
  - `RSUCalculator.jsx` — `/us/rsu-calculator` — RSU/NSO/ISO vest+sale tax, NIIT, LTCG strategy
  - `ACASubsidyCalculator.jsx` — `/us/aca-subsidy` — Premium Tax Credit, FPL, Medicaid check
  - `MegaBackdoorRothCalculator.jsx` — `/us/mega-backdoor-roth` — After-tax 401k → Roth
  - `FreelancerRateCalculator.jsx` — `/us/freelancer-rate` — Hourly rate for 1099 income goal
  - `DCAvsLumpSumCalculator.jsx` — `/us/dca-vs-lump-sum` — Cash drag, growth chart, risk analysis
  - `AMTCalculator.jsx` — `/us/amt-calculator` — ISO spread, AMT exemption phase-out, AMT credit
  - `FinancialIndependenceScore.jsx` — `/us/fi-score` — 6-question quiz, FI score, shareable result
  - `USTaxCalendar.jsx` — `/us/tax-calendar` — 2025–2026 deadlines, 2025 contribution limits
  - `SavingsComparisonCalculator.jsx` — `/us/savings-comparison` — I-Bonds vs HYSA vs T-Bills vs CDs
- **FIRE Calculator Social Share**: Twitter/X, Reddit, Copy buttons with pre-written FIRE Number message

---

## API Endpoints
- `POST /api/transactions/upload_receipt` — file upload + GPT-4o OCR
- `GET /api/transactions/{id}/receipt` — retrieve receipt URL
- `POST /api/auth/forgot-password` — sends 6-digit code via Resend

## DB Schema
- **users**: id, email, password_hash, full_name, subscription_id, is_admin
- **transactions**: id, user_id, type, amount, category, receipt_url
- **receipts**: id, transaction_id, file_path, ocr_data

---

## Prioritized Backlog

### P0 — Immediate Next
- **Stripe Integration** — US premium subscriptions via Stripe checkout (SA keeps PayFast)

### P1 — Soon
- **Light Theme Audit** — Systematic fix of hardcoded dark colors for full light mode support

### P2 — Future
- **IRP5 File Storage Backend** — Parse and store SA IRP5 tax documents
- **US Retirement Planner Adaptation** — Integrate Social Security + 401k into retirement planner
- **Market Insights Real Data** — Connect to real market API/RSS feed (currently static)
- **Refactor TaxPlanningHub.jsx** — 1700+ lines, break into smaller components
- **White-labeling** for financial firms
- **Mobile App**

---

## 3rd Party Integrations
- OpenAI GPT-4o — Emergent LLM Key (Receipt OCR)
- Resend — User API Key (Password Reset Emails)
- PayFast — User API Key (SA Payments)
- Stripe — To be integrated (US Payments — P0)

## Known Issues / Mocked
- Market Insights page: MOCKED (static content)
- Jurisdiction switch persists within session (localStorage-based, by design)
