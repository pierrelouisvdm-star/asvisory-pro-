// US Federal Tax Data, 2025 Tax Year (Rev. Proc. 2024-40)
// Returns filed in 2026 for income earned in 2025
// All 50 State Tax Rates included

export const US_FEDERAL_TAX_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  marriedJoint: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
  marriedSeparate: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 375800, rate: 0.35 },
    { min: 375800, max: Infinity, rate: 0.37 },
  ],
  headOfHousehold: [
    { min: 0, max: 17000, rate: 0.10 },
    { min: 17000, max: 64850, rate: 0.12 },
    { min: 64850, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250500, rate: 0.32 },
    { min: 250500, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
};

export const US_STANDARD_DEDUCTIONS_2024 = {
  single: 15750,
  marriedJoint: 31500,
  marriedSeparate: 15750,
  headOfHousehold: 23625,
};

// Long-term Capital Gains Tax Brackets 2025 (held >= 1 year)
export const US_CAPITAL_GAINS_BRACKETS_2024 = {
  single: [
    { min: 0, max: 48350, rate: 0.00 },
    { min: 48350, max: 533400, rate: 0.15 },
    { min: 533400, max: Infinity, rate: 0.20 },
  ],
  marriedJoint: [
    { min: 0, max: 96700, rate: 0.00 },
    { min: 96700, max: 600050, rate: 0.15 },
    { min: 600050, max: Infinity, rate: 0.20 },
  ],
  marriedSeparate: [
    { min: 0, max: 48350, rate: 0.00 },
    { min: 48350, max: 300000, rate: 0.15 },
    { min: 300000, max: Infinity, rate: 0.20 },
  ],
  headOfHousehold: [
    { min: 0, max: 64750, rate: 0.00 },
    { min: 64750, max: 566700, rate: 0.15 },
    { min: 566700, max: Infinity, rate: 0.20 },
  ],
};

// Net Investment Income Tax (NIIT) thresholds
export const US_NIIT_THRESHOLDS = {
  single: 200000,
  marriedJoint: 250000,
  marriedSeparate: 125000,
  headOfHousehold: 200000,
  rate: 0.038, // 3.8%
};

// Retirement Account Limits 2025
export const US_RETIREMENT_LIMITS_2024 = {
  traditional401k: {
    employeeLimit: 23500,
    catchUp50Plus: 7500,
    catchUp6063: 11250, // SECURE 2.0: special catch-up for ages 60-63
    totalWithEmployer: 70000,
  },
  rothIRA: {
    annualLimit: 7000,
    catchUp50Plus: 1000,
    incomePhaseOut: {
      single: { start: 150000, end: 165000 },
      marriedJoint: { start: 236000, end: 246000 },
    },
  },
  traditionalIRA: {
    annualLimit: 7000,
    catchUp50Plus: 1000,
  },
  sepIRA: {
    maxContribution: 70000,
    percentOfCompensation: 0.25,
  },
  hsa: {
    individual: 4300,
    family: 8550,
    catchUp55Plus: 1000,
  },
  plan529: {
    giftTaxExclusion: 19000,
    fiveYearFrontLoad: 95000,
  },
};

// Social Security Data 2025
export const US_SOCIAL_SECURITY_2024 = {
  maxTaxableEarnings: 176100,
  taxRate: 0.062, // 6.2% employee portion
  cola: 0.025, // 2.5% cost of living adjustment for 2025
  maxBenefitAtFRA: 4018, // per month (2025)
  fullRetirementAge: {
    1943: { years: 66, months: 0 },
    1954: { years: 66, months: 0 },
    1955: { years: 66, months: 2 },
    1956: { years: 66, months: 4 },
    1957: { years: 66, months: 6 },
    1958: { years: 66, months: 8 },
    1959: { years: 66, months: 10 },
    1960: { years: 67, months: 0 },
  },
  earlyReductionPerYear: 0.0667, // ~6.67% per year before FRA
  delayedCreditPerYear: 0.08, // 8% per year after FRA (up to 70)
};

// Estate & Gift Tax 2025
export const US_ESTATE_TAX_2024 = {
  exemptionIndividual: 13990000,
  exemptionMarried: 27980000,
  topRate: 0.40,
  giftAnnualExclusion: 19000,
};

// All 50 State Tax Data
export const US_STATE_TAX_DATA = {
  // No State Income Tax (9 states)
  AK: { name: 'Alaska', abbr: 'AK', hasStateTax: false, type: 'none', brackets: [] },
  FL: { name: 'Florida', abbr: 'FL', hasStateTax: false, type: 'none', brackets: [] },
  NV: { name: 'Nevada', abbr: 'NV', hasStateTax: false, type: 'none', brackets: [] },
  NH: { name: 'New Hampshire', abbr: 'NH', hasStateTax: false, type: 'none', brackets: [], note: 'Only taxes interest/dividends' },
  SD: { name: 'South Dakota', abbr: 'SD', hasStateTax: false, type: 'none', brackets: [] },
  TN: { name: 'Tennessee', abbr: 'TN', hasStateTax: false, type: 'none', brackets: [], note: 'Only taxes interest/dividends' },
  TX: { name: 'Texas', abbr: 'TX', hasStateTax: false, type: 'none', brackets: [] },
  WA: { name: 'Washington', abbr: 'WA', hasStateTax: false, type: 'none', brackets: [] },
  WY: { name: 'Wyoming', abbr: 'WY', hasStateTax: false, type: 'none', brackets: [] },
  
  // Flat Tax States
  AZ: { name: 'Arizona', abbr: 'AZ', hasStateTax: true, type: 'flat', rate: 0.025, brackets: [] },
  CO: { name: 'Colorado', abbr: 'CO', hasStateTax: true, type: 'flat', rate: 0.044, brackets: [] },
  GA: { name: 'Georgia', abbr: 'GA', hasStateTax: true, type: 'flat', rate: 0.0549, brackets: [] },
  IL: { name: 'Illinois', abbr: 'IL', hasStateTax: true, type: 'flat', rate: 0.0495, brackets: [] },
  IN: { name: 'Indiana', abbr: 'IN', hasStateTax: true, type: 'flat', rate: 0.0305, brackets: [] },
  KY: { name: 'Kentucky', abbr: 'KY', hasStateTax: true, type: 'flat', rate: 0.04, brackets: [] },
  MA: { name: 'Massachusetts', abbr: 'MA', hasStateTax: true, type: 'flat', rate: 0.05, brackets: [] },
  MI: { name: 'Michigan', abbr: 'MI', hasStateTax: true, type: 'flat', rate: 0.0425, brackets: [] },
  NC: { name: 'North Carolina', abbr: 'NC', hasStateTax: true, type: 'flat', rate: 0.0475, brackets: [] },
  ND: { name: 'North Dakota', abbr: 'ND', hasStateTax: true, type: 'flat', rate: 0.025, brackets: [] },
  PA: { name: 'Pennsylvania', abbr: 'PA', hasStateTax: true, type: 'flat', rate: 0.0307, brackets: [] },
  UT: { name: 'Utah', abbr: 'UT', hasStateTax: true, type: 'flat', rate: 0.0465, brackets: [] },
  
  // Progressive Tax States
  AL: {
    name: 'Alabama', abbr: 'AL', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 500, rate: 0.02 },
      { min: 500, max: 3000, rate: 0.04 },
      { min: 3000, max: Infinity, rate: 0.05 },
    ],
  },
  AR: {
    name: 'Arkansas', abbr: 'AR', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 4300, rate: 0.02 },
      { min: 4300, max: 8500, rate: 0.04 },
      { min: 8500, max: Infinity, rate: 0.044 },
    ],
  },
  CA: {
    name: 'California', abbr: 'CA', hasStateTax: true, type: 'progressive',
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
    note: 'Additional 1% mental health tax over $1M',
  },
  CT: {
    name: 'Connecticut', abbr: 'CT', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 10000, rate: 0.03 },
      { min: 10000, max: 50000, rate: 0.05 },
      { min: 50000, max: 100000, rate: 0.055 },
      { min: 100000, max: 200000, rate: 0.06 },
      { min: 200000, max: 250000, rate: 0.065 },
      { min: 250000, max: 500000, rate: 0.069 },
      { min: 500000, max: Infinity, rate: 0.0699 },
    ],
  },
  DE: {
    name: 'Delaware', abbr: 'DE', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 2000, rate: 0.022 },
      { min: 2000, max: 5000, rate: 0.039 },
      { min: 5000, max: 10000, rate: 0.048 },
      { min: 10000, max: 20000, rate: 0.052 },
      { min: 20000, max: 25000, rate: 0.0555 },
      { min: 25000, max: 60000, rate: 0.066 },
      { min: 60000, max: Infinity, rate: 0.066 },
    ],
  },
  HI: {
    name: 'Hawaii', abbr: 'HI', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 2400, rate: 0.014 },
      { min: 2400, max: 4800, rate: 0.032 },
      { min: 4800, max: 9600, rate: 0.055 },
      { min: 9600, max: 14400, rate: 0.064 },
      { min: 14400, max: 19200, rate: 0.068 },
      { min: 19200, max: 24000, rate: 0.072 },
      { min: 24000, max: 36000, rate: 0.076 },
      { min: 36000, max: 48000, rate: 0.079 },
      { min: 48000, max: 150000, rate: 0.0825 },
      { min: 150000, max: 175000, rate: 0.09 },
      { min: 175000, max: 200000, rate: 0.10 },
      { min: 200000, max: Infinity, rate: 0.11 },
    ],
  },
  ID: {
    name: 'Idaho', abbr: 'ID', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 1662, rate: 0.01 },
      { min: 1662, max: 4489, rate: 0.058 },
      { min: 4489, max: Infinity, rate: 0.058 },
    ],
  },
  IA: {
    name: 'Iowa', abbr: 'IA', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 6210, rate: 0.044 },
      { min: 6210, max: 31050, rate: 0.0482 },
      { min: 31050, max: 62100, rate: 0.057 },
      { min: 62100, max: Infinity, rate: 0.057 },
    ],
  },
  KS: {
    name: 'Kansas', abbr: 'KS', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 15000, rate: 0.031 },
      { min: 15000, max: 30000, rate: 0.0525 },
      { min: 30000, max: Infinity, rate: 0.057 },
    ],
  },
  LA: {
    name: 'Louisiana', abbr: 'LA', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 12500, rate: 0.0185 },
      { min: 12500, max: 50000, rate: 0.035 },
      { min: 50000, max: Infinity, rate: 0.0425 },
    ],
  },
  ME: {
    name: 'Maine', abbr: 'ME', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 24500, rate: 0.058 },
      { min: 24500, max: 58050, rate: 0.0675 },
      { min: 58050, max: Infinity, rate: 0.0715 },
    ],
  },
  MD: {
    name: 'Maryland', abbr: 'MD', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 1000, rate: 0.02 },
      { min: 1000, max: 2000, rate: 0.03 },
      { min: 2000, max: 3000, rate: 0.04 },
      { min: 3000, max: 100000, rate: 0.0475 },
      { min: 100000, max: 125000, rate: 0.05 },
      { min: 125000, max: 150000, rate: 0.0525 },
      { min: 150000, max: 250000, rate: 0.055 },
      { min: 250000, max: Infinity, rate: 0.0575 },
    ],
  },
  MN: {
    name: 'Minnesota', abbr: 'MN', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 30070, rate: 0.0535 },
      { min: 30070, max: 98760, rate: 0.068 },
      { min: 98760, max: 183340, rate: 0.0785 },
      { min: 183340, max: Infinity, rate: 0.0985 },
    ],
  },
  MS: {
    name: 'Mississippi', abbr: 'MS', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 10000, rate: 0.047 },
      { min: 10000, max: Infinity, rate: 0.05 },
    ],
  },
  MO: {
    name: 'Missouri', abbr: 'MO', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 1207, rate: 0.02 },
      { min: 1207, max: 2414, rate: 0.025 },
      { min: 2414, max: 3621, rate: 0.03 },
      { min: 3621, max: 4828, rate: 0.035 },
      { min: 4828, max: 6035, rate: 0.04 },
      { min: 6035, max: 7242, rate: 0.045 },
      { min: 7242, max: 8449, rate: 0.05 },
      { min: 8449, max: Infinity, rate: 0.048 },
    ],
  },
  MT: {
    name: 'Montana', abbr: 'MT', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 3600, rate: 0.01 },
      { min: 3600, max: 6300, rate: 0.02 },
      { min: 6300, max: 9700, rate: 0.03 },
      { min: 9700, max: 13000, rate: 0.04 },
      { min: 13000, max: 16800, rate: 0.05 },
      { min: 16800, max: 20500, rate: 0.059 },
      { min: 20500, max: Infinity, rate: 0.059 },
    ],
  },
  NE: {
    name: 'Nebraska', abbr: 'NE', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 3700, rate: 0.0246 },
      { min: 3700, max: 22170, rate: 0.0351 },
      { min: 22170, max: 35730, rate: 0.0501 },
      { min: 35730, max: Infinity, rate: 0.0584 },
    ],
  },
  NJ: {
    name: 'New Jersey', abbr: 'NJ', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 20000, rate: 0.014 },
      { min: 20000, max: 35000, rate: 0.0175 },
      { min: 35000, max: 40000, rate: 0.035 },
      { min: 40000, max: 75000, rate: 0.05525 },
      { min: 75000, max: 500000, rate: 0.0637 },
      { min: 500000, max: 1000000, rate: 0.0897 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
  },
  NM: {
    name: 'New Mexico', abbr: 'NM', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 5500, rate: 0.017 },
      { min: 5500, max: 11000, rate: 0.032 },
      { min: 11000, max: 16000, rate: 0.047 },
      { min: 16000, max: 210000, rate: 0.049 },
      { min: 210000, max: Infinity, rate: 0.059 },
    ],
  },
  NY: {
    name: 'New York', abbr: 'NY', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 8500, rate: 0.04 },
      { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 },
      { min: 13900, max: 80650, rate: 0.0585 },
      { min: 80650, max: 215400, rate: 0.0625 },
      { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: 5000000, rate: 0.0965 },
      { min: 5000000, max: 25000000, rate: 0.103 },
      { min: 25000000, max: Infinity, rate: 0.109 },
    ],
    note: 'NYC residents pay additional city tax',
  },
  OH: {
    name: 'Ohio', abbr: 'OH', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 26050, rate: 0 },
      { min: 26050, max: 100000, rate: 0.028 },
      { min: 100000, max: Infinity, rate: 0.035 },
    ],
  },
  OK: {
    name: 'Oklahoma', abbr: 'OK', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 1000, rate: 0.0025 },
      { min: 1000, max: 2500, rate: 0.0075 },
      { min: 2500, max: 3750, rate: 0.0175 },
      { min: 3750, max: 4900, rate: 0.0275 },
      { min: 4900, max: 7200, rate: 0.0375 },
      { min: 7200, max: Infinity, rate: 0.0475 },
    ],
  },
  OR: {
    name: 'Oregon', abbr: 'OR', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 4050, rate: 0.0475 },
      { min: 4050, max: 10200, rate: 0.0675 },
      { min: 10200, max: 125000, rate: 0.0875 },
      { min: 125000, max: Infinity, rate: 0.099 },
    ],
  },
  RI: {
    name: 'Rhode Island', abbr: 'RI', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 73450, rate: 0.0375 },
      { min: 73450, max: 166950, rate: 0.0475 },
      { min: 166950, max: Infinity, rate: 0.0599 },
    ],
  },
  SC: {
    name: 'South Carolina', abbr: 'SC', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 3200, rate: 0 },
      { min: 3200, max: 16040, rate: 0.03 },
      { min: 16040, max: Infinity, rate: 0.064 },
    ],
  },
  VT: {
    name: 'Vermont', abbr: 'VT', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 45400, rate: 0.0335 },
      { min: 45400, max: 110050, rate: 0.066 },
      { min: 110050, max: 229500, rate: 0.076 },
      { min: 229500, max: Infinity, rate: 0.0875 },
    ],
  },
  VA: {
    name: 'Virginia', abbr: 'VA', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 3000, rate: 0.02 },
      { min: 3000, max: 5000, rate: 0.03 },
      { min: 5000, max: 17000, rate: 0.05 },
      { min: 17000, max: Infinity, rate: 0.0575 },
    ],
  },
  WV: {
    name: 'West Virginia', abbr: 'WV', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 10000, rate: 0.0236 },
      { min: 10000, max: 25000, rate: 0.0315 },
      { min: 25000, max: 40000, rate: 0.0354 },
      { min: 40000, max: 60000, rate: 0.0472 },
      { min: 60000, max: Infinity, rate: 0.0512 },
    ],
  },
  WI: {
    name: 'Wisconsin', abbr: 'WI', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 14320, rate: 0.0354 },
      { min: 14320, max: 28640, rate: 0.0465 },
      { min: 28640, max: 315310, rate: 0.053 },
      { min: 315310, max: Infinity, rate: 0.0765 },
    ],
  },
  DC: {
    name: 'District of Columbia', abbr: 'DC', hasStateTax: true, type: 'progressive',
    brackets: [
      { min: 0, max: 10000, rate: 0.04 },
      { min: 10000, max: 40000, rate: 0.06 },
      { min: 40000, max: 60000, rate: 0.065 },
      { min: 60000, max: 250000, rate: 0.085 },
      { min: 250000, max: 500000, rate: 0.0925 },
      { min: 500000, max: 1000000, rate: 0.0975 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
  },
};

// Helper function to get state list sorted by name
export const getStateList = () => {
  return Object.values(US_STATE_TAX_DATA)
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Helper function to calculate federal tax
export const calculateFederalTax = (income, filingStatus, useStandardDeduction = true) => {
  const brackets = US_FEDERAL_TAX_BRACKETS_2024[filingStatus];
  const standardDeduction = useStandardDeduction ? US_STANDARD_DEDUCTIONS_2024[filingStatus] : 0;
  const taxableIncome = Math.max(0, income - standardDeduction);
  
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }
  
  return {
    grossIncome: income,
    standardDeduction,
    taxableIncome,
    federalTax: tax,
    effectiveRate: income > 0 ? (tax / income) * 100 : 0,
    marginalRate: getMarginalRate(taxableIncome, brackets) * 100,
  };
};

// Helper to get marginal rate
export const getMarginalRate = (taxableIncome, brackets) => {
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1].rate;
};

// Helper function to calculate state tax
export const calculateStateTax = (income, stateCode, filingStatus = 'single') => {
  const state = US_STATE_TAX_DATA[stateCode];
  
  if (!state || !state.hasStateTax) {
    return { stateTax: 0, effectiveRate: 0 };
  }
  
  let tax = 0;
  
  if (state.type === 'flat') {
    tax = income * state.rate;
  } else if (state.type === 'progressive') {
    let remainingIncome = income;
    
    for (const bracket of state.brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
  }
  
  return {
    stateName: state.name,
    stateTax: tax,
    effectiveRate: income > 0 ? (tax / income) * 100 : 0,
  };
};
