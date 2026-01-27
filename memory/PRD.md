# WealthCalc - Financial Advisor Suite PRD

## Overview
A comprehensive frontend-only financial calculator suite for financial advisors, featuring 15 professional calculators with premium UI design.

## Original Requirements
1. Build a financial advisor application with various calculators
2. Initially requested: Future Value, Compound Interest, Bond, Car Finance calculators
3. Added: Inflation factor, Investment fee factor, Currency toggle (ZAR/USD)
4. Added: Life Insurance, Income Disability, Retirement calculators
5. Added: 8 new tools - Tax Calculator, Estate Planning, Emergency Fund, Debt Payoff, Education Savings, Budget Planner, Net Worth Tracker, Risk Profile Quiz
6. Annual return slider max increased to 50%, default 25%
7. ZAR set as default currency

## Tech Stack
- **Frontend**: React.js with react-router-dom
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui
- **Charts**: recharts
- **Animation**: framer-motion
- **State**: React Hooks + Context API (CurrencyContext)

## Features Implemented

### 15 Financial Calculators

#### Investment Calculators (4)
1. **Future Value Calculator** - Inflation & fee adjusted projections
2. **Compound Interest** - Multiple compounding frequencies
3. **Bond Calculator** - Pricing, yields, duration metrics
4. **Car Finance** - Loan vs lease comparison

#### Insurance & Retirement (3)
5. **Life Insurance Calculator** - DIME method coverage analysis
6. **Income Disability** - Disability coverage calculator
7. **Retirement Planner** - Funding ratio & income sources

#### Personal Finance Tools (5)
8. **Tax Calculator** - SA 2024/2025 tax brackets, deductions, medical credits
9. **Budget Planner** - 50/30/20 rule analysis
10. **Net Worth Tracker** - Assets, liabilities, health score
11. **Emergency Fund** - Risk-based recommendations
12. **Debt Payoff** - Avalanche vs Snowball strategies

#### Planning Tools (3)
13. **Estate Planning** - Estate duty, executor fees, beneficiary distribution
14. **Education Savings** - Cost projection with education inflation
15. **Risk Profile Quiz** - 10-question assessment with portfolio allocation

### Core Features
- Multi-currency support (ZAR/USD) with ZAR default
- Dark/Light mode toggle
- Print report functionality on all calculators
- Responsive design with mobile navigation
- Interactive charts and visualizations
- Scenario comparison mode

## Architecture
```
/app/frontend
├── src
│   ├── components
│   │   ├── calculators/
│   │   │   ├── CalculatorCard.jsx
│   │   │   ├── InputField.jsx
│   │   │   ├── ResultDisplay.jsx
│   │   │   ├── GrowthChart.jsx
│   │   │   ├── PrintReport.jsx
│   │   │   └── ComparisonMode.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── ui/ (shadcn components)
│   │   └── CurrencySelector.jsx
│   ├── context/
│   │   └── CurrencyContext.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   └── (15 calculator pages)
│   ├── App.js
│   ├── index.css
│   └── tailwind.config.js
```

## Future Backlog
- **P2**: Backend integration (user auth, save history, PDF reports)
- **P2**: Client Management (CRM Lite)
- **P3**: Advanced simulations (Monte Carlo)
- **P3**: Portfolio tracking
- **P3**: Fix `for` to `htmlFor` linter warnings across JSX files

## Status
✅ **Complete** - All 15 calculators implemented and integrated
- Frontend testing: 100% pass rate
- All navigation and routing working
- Dashboard displays all 4 sections
- Currency toggle functional
- Dark/light mode working

## Last Updated
December 2025
