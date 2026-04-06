import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Briefcase, DollarSign, Receipt, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';
import { US_STATE_TAX_DATA, getStateList, calculateStateTax } from '@/data/usTaxData';

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount || 0);

const formatPct = (rate) => `${(rate * 100).toFixed(1)}%`;

// Get effective state rate from state data
const getEffectiveStateRate = (stateCode, income) => {
  const stateData = US_STATE_TAX_DATA[stateCode];
  if (!stateData || !stateData.hasStateTax) return 0;
  if (stateData.type === 'flat') return stateData.rate || 0;
  if (stateData.type === 'progressive' && stateData.brackets) {
    const result = calculateStateTax(income, stateCode);
    return income > 0 ? result.stateTax / income : 0;
  }
  return 0;
};

// 2025 Federal Tax Brackets (Single) — Rev. Proc. 2024-40
const BRACKETS_SINGLE = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const BRACKETS_MFJ = [
  { min: 0, max: 23850, rate: 0.10 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTIONS = { single: 15750, mfj: 31500, hoh: 23625 };
const SS_WAGE_BASE = 176100;

const calcFederalTax = (taxableIncome, brackets) => {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
};

const getMarginalRate = (taxableIncome, brackets) => {
  for (const bracket of [...brackets].reverse()) {
    if (taxableIncome > bracket.min) return bracket.rate;
  }
  return 0;
};

const SE_TAX_RATE = 0.153;
const SS_RATE = 0.124;
const MEDICARE_RATE = 0.029;
const MEDICARE_SURCHARGE = 0.009;
const MEDICARE_SURCHARGE_THRESHOLD_SINGLE = 200000;
const MEDICARE_SURCHARGE_THRESHOLD_MFJ = 250000;

export default function SelfEmployedTaxCalculator() {
  const [grossIncome, setGrossIncome] = useState(100000);
  const [businessExpenses, setBusinessExpenses] = useState(15000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [additionalIncome, setAdditionalIncome] = useState(0);
  const [retirementContrib, setRetirementContrib] = useState(10000);
  const [healthInsurance, setHealthInsurance] = useState(6000);
  const [hsaContrib, setHsaContrib] = useState(3000);
  const [homeOffice, setHomeOffice] = useState(0);
  const [state, setState] = useState('CA');
  const [useQBI, setUseQBI] = useState(true);

  const stateData = US_STATE_TAX_DATA[state] || { name: 'California', hasStateTax: true, type: 'flat', rate: 0.093 };
  const stateEffectiveRate = getEffectiveStateRate(state, grossIncome);

  const results = useMemo(() => {
    const netProfit = Math.max(0, grossIncome - businessExpenses - homeOffice);

    // SE Tax
    const seSurcharge = netProfit * 0.9235;
    const ssTax = Math.min(seSurcharge, SS_WAGE_BASE) * (SS_RATE / 2); // employer+employee split
    const medicareTax = seSurcharge * (MEDICARE_RATE / 2);
    const seTax = (ssTax + medicareTax) * 2; // total SE tax
    const seTaxDeduction = seTax / 2; // deduct 50% of SE tax

    // Health insurance deduction (self-employed can deduct 100%)
    const healthDeduction = Math.min(healthInsurance, netProfit);

    // SEP-IRA or Solo 401k: up to 25% of net profit minus SE tax deduction
    const maxRetirement = (netProfit - seTaxDeduction) * 0.25;
    const retirementDeduction = Math.min(retirementContrib, maxRetirement, 66000);

    // HSA deduction
    const hsaDeduction = Math.min(hsaContrib, 4300); // 2025 self-only limit

    // QBI Deduction (20% of qualified business income)
    const qbiBasis = Math.max(0, netProfit - seTaxDeduction - retirementDeduction - healthDeduction);
    const qbiDeduction = useQBI ? qbiBasis * 0.20 : 0;

    // Standard deduction
    const standardDeduction = STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single;

    // Taxable income
    const agiDeductions = seTaxDeduction + healthDeduction + retirementDeduction + hsaDeduction;
    const agi = Math.max(0, netProfit + additionalIncome - agiDeductions);
    const taxableIncome = Math.max(0, agi - qbiDeduction - standardDeduction);

    // Federal income tax
    const brackets = filingStatus === 'mfj' ? BRACKETS_MFJ : BRACKETS_SINGLE;
    const federalTax = calcFederalTax(taxableIncome, brackets);
    const marginalRate = getMarginalRate(taxableIncome, brackets);

    // Medicare surcharge on high earners
    const surchargeThreshold = filingStatus === 'mfj' ? MEDICARE_SURCHARGE_THRESHOLD_MFJ : MEDICARE_SURCHARGE_THRESHOLD_SINGLE;
    const medicareSurcharge = Math.max(0, agi - surchargeThreshold) * MEDICARE_SURCHARGE;

    // State tax using effective rate
    const stateTax = agi * stateEffectiveRate;

    const totalTax = federalTax + seTax + medicareSurcharge + stateTax;
    const takeHome = grossIncome - businessExpenses - totalTax;
    const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

    // W2 comparison: same gross income as employee
    const w2Taxable = Math.max(0, grossIncome + additionalIncome - standardDeduction);
    const w2FederalTax = calcFederalTax(w2Taxable, brackets);
    const w2SsTax = Math.min(grossIncome, SS_WAGE_BASE) * 0.062; // employee only
    const w2Medicare = grossIncome * 0.0145;
    const w2StateTax = (grossIncome) * stateEffectiveRate;
    const w2TotalTax = w2FederalTax + w2SsTax + w2Medicare + w2StateTax;
    const w2TakeHome = grossIncome - w2TotalTax;

    return {
      netProfit,
      seTax,
      seTaxDeduction,
      healthDeduction,
      retirementDeduction,
      hsaDeduction,
      qbiDeduction,
      agi,
      taxableIncome,
      federalTax,
      medicareSurcharge,
      stateTax,
      totalTax,
      takeHome,
      effectiveRate,
      marginalRate,
      totalDeductions: agiDeductions + qbiDeduction + standardDeduction,
      // W2 comparison
      w2TotalTax,
      w2TakeHome,
      w2EffectiveRate: grossIncome > 0 ? w2TotalTax / grossIncome : 0,
    };
  }, [grossIncome, businessExpenses, filingStatus, additionalIncome, retirementContrib, healthInsurance, hsaContrib, homeOffice, state, useQBI, stateData, stateEffectiveRate]);

  const pieData = [
    { name: 'Take-Home', value: Math.max(0, results.takeHome), color: '#10b981' },
    { name: 'Federal Tax', value: Math.round(results.federalTax), color: '#6366f1' },
    { name: 'SE Tax', value: Math.round(results.seTax), color: '#f59e0b' },
    { name: 'State Tax', value: Math.round(results.stateTax), color: '#f97316' },
  ].filter(d => d.value > 0);

  const comparisonData = [
    { category: 'Self-Employed', total: Math.round(results.totalTax), takeHome: Math.round(results.takeHome) },
    { category: 'W-2 Employee', total: Math.round(results.w2TotalTax), takeHome: Math.round(results.w2TakeHome) },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
          <Briefcase className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Self-Employment Tax Estimator</h1>
          <p className="text-muted-foreground text-sm">1099 freelancers, consultants & small business owners — know your full tax burden</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Income & Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Gross 1099 / Business Income ($)</Label>
                <Input type="number" value={grossIncome} onChange={e => setGrossIncome(+e.target.value)} className="h-9 mt-1" data-testid="se-gross-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Business Expenses ($)</Label>
                <Input type="number" value={businessExpenses} onChange={e => setBusinessExpenses(+e.target.value)} className="h-9 mt-1" data-testid="se-expenses" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Other W-2 or Investment Income ($)</Label>
                <Input type="number" value={additionalIncome} onChange={e => setAdditionalIncome(+e.target.value)} className="h-9 mt-1" data-testid="se-other-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                    <SelectItem value="hoh">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {getStateList().map(s => (
                      <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deductions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">SEP-IRA / Solo 401k Contribution ($)</Label>
                <Input type="number" value={retirementContrib} onChange={e => setRetirementContrib(+e.target.value)} className="h-9 mt-1" data-testid="se-retirement" />
                <p className="text-xs text-muted-foreground mt-1">Max: 25% of net profit, up to $66,000</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Self-Employed Health Insurance ($)</Label>
                <Input type="number" value={healthInsurance} onChange={e => setHealthInsurance(+e.target.value)} className="h-9 mt-1" data-testid="se-health" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">HSA Contribution ($)</Label>
                <Input type="number" value={hsaContrib} onChange={e => setHsaContrib(+e.target.value)} className="h-9 mt-1" data-testid="se-hsa" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Home Office Deduction ($)</Label>
                <Input type="number" value={homeOffice} onChange={e => setHomeOffice(+e.target.value)} className="h-9 mt-1" data-testid="se-home-office" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">20% QBI Deduction</p>
                  <p className="text-xs text-muted-foreground">Qualified Business Income</p>
                </div>
                <Switch checked={useQBI} onCheckedChange={setUseQBI} data-testid="se-qbi-toggle" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Net Profit', value: formatCurrency(results.netProfit), color: 'blue' },
              { label: 'Total Tax', value: formatCurrency(results.totalTax), color: 'red' },
              { label: 'Take-Home', value: formatCurrency(results.takeHome), color: 'emerald' },
              { label: 'Effective Rate', value: formatPct(results.effectiveRate), color: 'amber' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold text-${item.color}-500`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Tax Breakdown */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tax Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SE vs W-2 Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={comparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total" name="Total Tax" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="takeHome" name="Take-Home" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>SE effective rate:</span>
                    <span className="font-medium text-foreground">{formatPct(results.effectiveRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>W-2 effective rate:</span>
                    <span className="font-medium text-foreground">{formatPct(results.w2EffectiveRate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deduction Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Deduction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                {[
                  ['Gross Income', formatCurrency(grossIncome)],
                  ['Business Expenses', `– ${formatCurrency(businessExpenses)}`],
                  ['Home Office', `– ${formatCurrency(homeOffice)}`],
                  ['Net Profit', formatCurrency(results.netProfit)],
                  ['SE Tax Deduction (50%)', `– ${formatCurrency(results.seTaxDeduction)}`],
                  ['Self-Employed Health Ins.', `– ${formatCurrency(results.healthDeduction)}`],
                  ['SEP-IRA / Solo 401k', `– ${formatCurrency(results.retirementDeduction)}`],
                  ['HSA Contribution', `– ${formatCurrency(Math.min(hsaContrib, 4300))}`],
                  ['Adjusted Gross Income', formatCurrency(results.agi)],
                  ['QBI Deduction (20%)', useQBI ? `– ${formatCurrency(results.qbiDeduction)}` : 'N/A'],
                  ['Standard Deduction', `– ${formatCurrency(STANDARD_DEDUCTIONS[filingStatus])}`],
                  ['Taxable Income', formatCurrency(results.taxableIncome)],
                ].map(([label, value], i) => (
                  <React.Fragment key={i}>
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`text-right font-medium ${value.startsWith('–') ? 'text-emerald-500' : 'text-foreground'}`}>{value}</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <p>Marginal Rate: <span className="font-medium text-foreground">{formatPct(results.marginalRate)}</span> · SE Tax Rate: <span className="font-medium">15.3%</span> · State: <span className="font-medium">{(stateEffectiveRate * 100).toFixed(1)}%</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
