# Financial Advisory Pro — PRD

## Original Problem Statement
Build and deploy "Financial Advisory Pro" — a dual-jurisdiction (SA + US) financial advisory SaaS platform. Core requirements: Free/Premium subscription (R299/mo, R1999/yr for SA), updated 2026/2027 SA tax rules, cloud backend storage + AI OCR for receipts, real password reset emails, updated landing page, and full US version with parity.

## User Personas
- South African individuals and financial advisors
- American individuals and financial advisors (target: 10,000 US subscribers)

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

### Phase 3 — US Version (Complete — Feb 2026)
- US Tax Data (`usTaxData.js`) — 2024/25 federal brackets, all 50 states
- **6 US Calculators fully built and routed**:
  - `TaxCalculatorUS.jsx` — Federal + State income tax for all 50 states
  - `Calculator401k.jsx` — 401(k) with employer match, tax benefits, Roth vs Traditional
  - `RothIRACalculator.jsx` — Tax-free growth projections, income limits, backdoor Roth
  - `SocialSecurityCalculator.jsx` — Benefit estimates, claiming age optimizer, spousal benefits
  - `HSACalculator.jsx` — Triple tax advantage, contribution limits, growth projection
  - `Calculator529.jsx` — College savings, state tax benefits, funding gap
- **Dashboard fully jurisdiction-aware**:
  - SA-only tools (TFSA, Living Annuity, RA Tax Savings, SA Tax Hub, SA Tax Calculator) hidden from US users
  - US Tax & Retirement section appears prominently for US users (after Investment section)
  - Bond renamed → "Mortgage Calculator" for US users
  - Vehicle Finance renamed → "Auto Loan Calculator" for US users
- **Income & Expense Tracker** — US-specific categories (401k Contribution, HSA, Social Security, 1099 income, Health Insurance); jurisdiction-aware tax hint (22% federal vs 31% SA)
- **Net Worth Tracker** — locale and currency dynamically adapt (en-US/$  for US, en-ZA/R for SA)
- All 6 US calculator routes registered in App.js

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

### P1 — Next Sprint
- **Stripe Integration** — US premium subscriptions via Stripe checkout (SA keeps PayFast)

### P2 — Soon
- **Light Theme Audit** — Systematic fix of hardcoded dark colors for light mode
- **IRP5 File Storage Backend** — Parse and store SA IRP5 tax documents
- **LandingPage US-aware copy** — Show "Americans" instead of "South Africans" when jurisdiction is US

### P3 — Future
- **Market Insights Real Data** — Connect to real market API/RSS feed (currently static)
- **Refactor TaxPlanningHub.jsx** — 1700+ lines, break into smaller components
- **White-labeling** for financial firms
- **Mobile App**

---

## 3rd Party Integrations
- OpenAI GPT-4o — Emergent LLM Key (Receipt OCR)
- Resend — User API Key (Password Reset Emails)
- PayFast — User API Key (SA Payments)
- Stripe — To be integrated (US Payments — P1)

## Known Issues / Mocked
- Market Insights page: MOCKED (static content)
- Jurisdiction switch persists within session but not across browser sessions (localStorage-based, by design)
