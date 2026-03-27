# Financial Advisory Pro - US Version Specification

## Overview
Complete specification for building the US version of Financial Advisory Pro with full feature parity, all 50 state taxes, and Stripe payment integration.

---

## 1. US Federal Tax Brackets 2024/2025

### Single Filers
| Income Range | Tax Rate |
|--------------|----------|
| $0 - $11,600 | 10% |
| $11,601 - $47,150 | 12% |
| $47,151 - $100,525 | 22% |
| $100,526 - $191,950 | 24% |
| $191,951 - $243,725 | 32% |
| $243,726 - $609,350 | 35% |
| $609,351+ | 37% |

### Married Filing Jointly
| Income Range | Tax Rate |
|--------------|----------|
| $0 - $23,200 | 10% |
| $23,201 - $94,300 | 12% |
| $94,301 - $201,050 | 22% |
| $201,051 - $383,900 | 24% |
| $383,901 - $487,450 | 32% |
| $487,451 - $731,200 | 35% |
| $731,201+ | 37% |

### Head of Household
| Income Range | Tax Rate |
|--------------|----------|
| $0 - $16,550 | 10% |
| $16,551 - $63,100 | 12% |
| $63,101 - $100,500 | 22% |
| $100,501 - $191,950 | 24% |
| $191,951 - $243,700 | 32% |
| $243,701 - $609,350 | 35% |
| $609,351+ | 37% |

### Standard Deductions 2024
- Single: $14,600
- Married Filing Jointly: $29,200
- Married Filing Separately: $14,600
- Head of Household: $21,900

---

## 2. State Income Tax Rates (All 50 States)

### No State Income Tax (9 states)
- Alaska, Florida, Nevada, New Hampshire*, South Dakota, Tennessee*, Texas, Washington, Wyoming
- *NH and TN only tax interest/dividends

### Flat Tax States
| State | Rate |
|-------|------|
| Colorado | 4.4% |
| Illinois | 4.95% |
| Indiana | 3.05% |
| Kentucky | 4.0% |
| Massachusetts | 5.0% |
| Michigan | 4.25% |
| North Carolina | 4.75% |
| Pennsylvania | 3.07% |
| Utah | 4.65% |

### Progressive Tax States (Top Rates)
| State | Top Rate | Top Bracket |
|-------|----------|-------------|
| California | 13.3% | $1,000,000+ |
| Hawaii | 11.0% | $200,000+ |
| New Jersey | 10.75% | $1,000,000+ |
| Oregon | 9.9% | $125,000+ |
| Minnesota | 9.85% | $183,340+ |
| New York | 10.9% | $25,000,000+ |
| Vermont | 8.75% | $229,500+ |
| Iowa | 5.7% | $75,000+ |
| Wisconsin | 7.65% | $315,310+ |
| Maine | 7.15% | $58,050+ |
| South Carolina | 6.4% | $17,330+ |
| Montana | 5.9% | $20,500+ |
| Nebraska | 5.84% | $35,730+ |
| Idaho | 5.8% | $4,489+ |
| West Virginia | 5.12% | $60,000+ |
| Arkansas | 4.4% | $87,001+ |
| Delaware | 6.6% | $60,000+ |
| Georgia | 5.49% | Flat |
| Louisiana | 4.25% | $50,000+ |
| Maryland | 5.75% | $250,000+ |
| Mississippi | 5.0% | $10,000+ |
| Missouri | 4.8% | $8,968+ |
| New Mexico | 5.9% | $210,000+ |
| Ohio | 3.5% | $115,300+ |
| Oklahoma | 4.75% | $7,200+ |
| Rhode Island | 5.99% | $176,050+ |
| Virginia | 5.75% | $17,000+ |
| Alabama | 5.0% | $3,000+ |
| Arizona | 2.5% | Flat |
| Connecticut | 6.99% | $500,000+ |
| Kansas | 5.7% | $30,000+ |
| North Dakota | 2.5% | $225,975+ |

---

## 3. Capital Gains Tax (US)

### Short-Term (held < 1 year)
Taxed as ordinary income at federal bracket rates

### Long-Term (held ≥ 1 year)
| Filing Status | 0% Rate | 15% Rate | 20% Rate |
|---------------|---------|----------|----------|
| Single | $0 - $47,025 | $47,026 - $518,900 | $518,901+ |
| Married Joint | $0 - $94,050 | $94,051 - $583,750 | $583,751+ |
| Head of House | $0 - $63,000 | $63,001 - $551,350 | $551,351+ |

### Net Investment Income Tax (NIIT)
Additional 3.8% on investment income for:
- Single: AGI > $200,000
- Married Joint: AGI > $250,000

---

## 4. Retirement Account Limits 2024

### 401(k) / 403(b) / 457
- Employee contribution: $23,000
- Catch-up (50+): +$7,500
- Total (with employer): $69,000

### Traditional & Roth IRA
- Annual limit: $7,000
- Catch-up (50+): +$1,000

### Roth IRA Income Limits (Phase-out)
| Filing Status | Full Contribution | Phase-out | No Contribution |
|---------------|-------------------|-----------|-----------------|
| Single | < $146,000 | $146,000-$161,000 | > $161,000 |
| Married Joint | < $230,000 | $230,000-$240,000 | > $240,000 |

### SEP IRA (Self-employed)
- 25% of compensation up to $69,000

### HSA (Health Savings Account)
- Individual: $4,150
- Family: $8,300
- Catch-up (55+): +$1,000

### 529 College Savings
- Gift tax exclusion: $18,000/year per beneficiary
- 5-year front-loading: $90,000

---

## 5. Social Security

### Full Retirement Age (FRA)
| Birth Year | FRA |
|------------|-----|
| 1943-1954 | 66 |
| 1955 | 66 + 2 months |
| 1956 | 66 + 4 months |
| 1957 | 66 + 6 months |
| 1958 | 66 + 8 months |
| 1959 | 66 + 10 months |
| 1960+ | 67 |

### Benefit Adjustments
- Early (62): Reduced ~6.67%/year before FRA
- Delayed (up to 70): +8%/year after FRA

### 2024 Figures
- Maximum taxable earnings: $168,600
- Cost-of-living adjustment (COLA): 3.2%
- Maximum benefit at FRA: $3,822/month

---

## 6. Estate & Gift Tax

### Federal Estate Tax 2024
- Exemption: $13.61 million (individual)
- Exemption: $27.22 million (married couple)
- Top rate: 40%

### Gift Tax
- Annual exclusion: $18,000 per recipient
- Lifetime exemption: Same as estate ($13.61M)

---

## 7. Calculator Mapping (SA → US)

| SA Calculator | US Equivalent |
|---------------|---------------|
| TFSA Calculator | Roth IRA Calculator |
| RA Tax Savings | 401(k) Tax Savings |
| Tax Calculator | Federal + State Tax Calculator |
| Living Annuity | Annuity Calculator |
| Estate Planning | Estate Tax Calculator |
| Medical Aid Credits | HSA Calculator |
| Tax Planning Hub | US Tax Planning Hub |
| Bond Calculator | Same (mortgage rates differ) |
| Retirement Calculator | 401(k)/IRA Retirement Planner |

### New US-Specific Calculators
1. **529 College Savings Calculator**
2. **Social Security Estimator**
3. **Required Minimum Distribution (RMD) Calculator**
4. **Qualified Dividend Calculator**
5. **AMT (Alternative Minimum Tax) Calculator**

---

## 8. Technical Architecture

### Folder Structure
```
/app
├── backend
│   ├── routes
│   │   ├── auth.py
│   │   ├── tax_us.py          # US tax calculations
│   │   ├── retirement_us.py   # 401k, IRA, Roth
│   │   └── payments_stripe.py # Stripe integration
│   ├── models
│   │   └── tax_data_us.py     # All 50 state tax data
│   └── server.py
├── frontend
│   └── src
│       ├── pages
│       │   ├── calculators
│       │   │   ├── TaxCalculatorUS.jsx
│       │   │   ├── Roth401kCalculator.jsx
│       │   │   ├── SocialSecurityCalculator.jsx
│       │   │   └── ...
│       │   └── TaxPlanningHubUS.jsx
│       └── data
│           └── stateTaxRates.js  # All 50 states
```

### State Tax Data Structure
```javascript
export const STATE_TAX_DATA = {
  CA: {
    name: 'California',
    hasStateTax: true,
    type: 'progressive',
    brackets: [
      { min: 0, max: 10412, rate: 0.01 },
      { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 },
      { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 },
      { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 },
      { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: 1000000, rate: 0.123 },
      { min: 1000000, max: Infinity, rate: 0.133 },
    ],
    standardDeduction: { single: 5363, married: 10726 },
  },
  TX: {
    name: 'Texas',
    hasStateTax: false,
    type: 'none',
    brackets: [],
  },
  // ... all 50 states
};
```

---

## 9. Stripe Integration

### Required Environment Variables
```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Subscription Products
- Monthly: $19.99/month
- Annual: $149.99/year (Save $90!)

### Stripe Checkout Flow
1. User clicks "Subscribe"
2. Create Stripe Checkout Session
3. Redirect to Stripe hosted checkout
4. Webhook confirms payment
5. Update user subscription in DB

---

## 10. Pricing (US Market)

### Suggested Pricing
| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 4 basic calculators |
| Premium Monthly | $19.99/mo | All calculators + features |
| Premium Annual | $149.99/yr | All calculators (Save $90) |

### Free Calculators
1. Compound Interest
2. Future Value
3. Loan Calculator
4. Basic Tax Estimator

---

## 11. Compliance Notes

### Disclaimers Required
- "Not tax advice - consult a CPA or tax professional"
- "Not investment advice - consult a financial advisor"
- "Calculations are estimates only"

### State-Specific Considerations
- California: Additional mental health tax (1% over $1M)
- New York: NYC has additional city tax
- Some states have local income taxes (OH, PA, etc.)

---

## 12. Implementation Priority

### Phase 1 (Week 1)
1. Clone SA codebase, rebrand
2. Implement Federal Tax Calculator
3. Implement 401(k) Calculator
4. Basic Stripe integration

### Phase 2 (Week 2)
5. All 50 state taxes
6. Roth IRA Calculator
7. Social Security Estimator
8. HSA Calculator

### Phase 3 (Week 3)
9. 529 College Savings
10. Estate Tax Calculator
11. Full testing
12. Deploy

---

## 13. Key Differences Summary

| Feature | SA Version | US Version |
|---------|------------|------------|
| Currency | ZAR | USD |
| Tax Year | March - February | January - December |
| Retirement | RA (27.5%) | 401(k) ($23k limit) |
| Tax-Free Savings | TFSA (R46k) | Roth IRA ($7k) |
| Capital Gains | 18% inclusion | 0/15/20% long-term |
| State/Province Tax | None | 41 states have income tax |
| Payment | PayFast | Stripe |
| Health Savings | Medical Aid Credits | HSA ($4,150) |

---

*Document prepared for Financial Advisory Pro US Version*
*Last Updated: March 2026*
