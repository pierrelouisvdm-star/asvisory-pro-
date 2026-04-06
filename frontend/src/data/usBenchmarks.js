// US Financial Benchmarks, Federal Reserve 2022 SCF + BEA + Vanguard/Fidelity data
// Used for "How do you compare?" features across calculators

export const US_SAVINGS_RATE_PERCENTILES = {
  // Savings rate % → what percentile that puts you in
  p10: 0,    // 10th: saves nothing
  p25: 2,    // 25th: saves ~2%
  p50: 5,    // Median American saves ~5% (BEA 2024)
  p60: 10,
  p70: 15,
  p75: 20,
  p80: 25,
  p90: 35,
  p95: 50,
  p99: 65,
};

export const US_NET_WORTH_BY_AGE = {
  // Federal Reserve 2022 Survey of Consumer Finances (inflation-adjusted)
  // { p25, p50, p75, p90 } in USD
  'under35': { p25: 0, p50: 39000, p75: 144000, p90: 412000 },
  '35-44':   { p25: 7000, p50: 135000, p75: 393000, p90: 954000 },
  '45-54':   { p25: 22000, p50: 247000, p75: 686000, p90: 1540000 },
  '55-64':   { p25: 50000, p50: 364000, p75: 949000, p90: 2100000 },
  '65-74':   { p25: 66000, p50: 410000, p75: 1090000, p90: 2200000 },
  '75plus':  { p25: 49000, p50: 335000, p75: 929000, p90: 1979000 },
};

export const US_RETIREMENT_SAVINGS_MEDIAN = {
  // Median retirement account balance by age (Vanguard/Fidelity 2024)
  '25-34': 30900,
  '35-44': 76354,
  '45-54': 142069,
  '55-64': 185286,
  '65-74': 209984,
};

export const US_EFFECTIVE_TAX_RATE_MEDIAN = {
  // IRS SOI data, median effective federal income tax rate by income band
  'under30k': 0.04,
  '30k-50k':  0.08,
  '50k-75k':  0.10,
  '75k-100k': 0.12,
  '100k-150k': 0.14,
  '150k-200k': 0.17,
  '200k-500k': 0.22,
  '500kplus':  0.26,
};

/**
 * Returns the percentile for a given savings rate (0-100)
 */
export const getSavingsRatePercentile = (rate) => {
  if (rate <= 0) return 10;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p99) return 99;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p95) return 95;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p90) return 90;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p80) return 80;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p75) return 75;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p70) return 70;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p60) return 60;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p50) return 50;
  if (rate >= US_SAVINGS_RATE_PERCENTILES.p25) return 25;
  return 10;
};

/**
 * Returns percentile for net worth given age and net worth value
 */
export const getNetWorthPercentile = (age, netWorth) => {
  let bracket;
  if (age < 35) bracket = US_NET_WORTH_BY_AGE['under35'];
  else if (age < 45) bracket = US_NET_WORTH_BY_AGE['35-44'];
  else if (age < 55) bracket = US_NET_WORTH_BY_AGE['45-54'];
  else if (age < 65) bracket = US_NET_WORTH_BY_AGE['55-64'];
  else if (age < 75) bracket = US_NET_WORTH_BY_AGE['65-74'];
  else bracket = US_NET_WORTH_BY_AGE['75plus'];

  if (netWorth >= bracket.p90) return 90;
  if (netWorth >= bracket.p75) return 75;
  if (netWorth >= bracket.p50) return 50;
  if (netWorth >= bracket.p25) return 25;
  return 10;
};

/**
 * Returns a label and color for a percentile
 */
export const getPercentileLabel = (percentile) => {
  if (percentile >= 95) return { label: `Top ${100 - percentile}% of Americans`, color: 'emerald', tier: 'exceptional' };
  if (percentile >= 80) return { label: `Top ${100 - percentile}% of Americans`, color: 'emerald', tier: 'excellent' };
  if (percentile >= 60) return { label: `Top ${100 - percentile}% of Americans`, color: 'blue', tier: 'above average' };
  if (percentile >= 40) return { label: 'Near the national average', color: 'amber', tier: 'average' };
  return { label: 'Below the national average', color: 'amber', tier: 'below average' };
};
