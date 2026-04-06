import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Briefcase, DollarSign, TrendingUp, CheckCircle2, Info } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';
import { US_STATE_TAX_DATA, getStateList } from '@/data/usTaxData';
import SEOHead from '@/components/SEOHead';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtPct = (r) => `${(r * 100).toFixed(1)}%`;

const FEDERAL_BRACKETS_SINGLE = [
  { max: 11925, rate: 0.10 }, { max: 48475, rate: 0.12 }, { max: 103350, rate: 0.22 },
  { max: 197300, rate: 0.24 }, { max: 250525, rate: 0.32 }, { max: 626350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
];
const FEDERAL_BRACKETS_MFJ = [
  { max: 23850, rate: 0.10 }, { max: 96950, rate: 0.12 }, { max: 206700, rate: 0.22 },
  { max: 394600, rate: 0.24 }, { max: 501050, rate: 0.32 }, { max: 751600, rate: 0.35 }, { max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTIONS = { single: 15750, mfj: 31500, hoh: 23625 };
const SS_WAGE_BASE = 176100;
const PAY_PERIODS = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12, annual: 1 };

const calcFederalTax = (taxableIncome, brackets) => {
  if (taxableIncome <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, b.max) - prev;
    tax += taxable * b.rate;
    prev = b.max;
  }
  return tax;
};

const getMarginalRate = (taxableIncome, brackets) => {
  for (const b of [...brackets].reverse()) {
    if (taxableIncome > (b.min || 0)) return b.rate;
  }
  return 0.10;
};

const getStateRate = (stateCode, income) => {
  const s = US_STATE_TAX_DATA?.[stateCode];
  if (!s || !s.hasStateTax) return 0;
  if (s.type === 'flat') return s.rate || 0;
  if (s.type === 'progressive' && s.brackets) {
    let tax = 0, prev = 0;
    for (const b of s.brackets) {
      if (income <= prev) break;
      const taxable = Math.min(income, b.max || Infinity) - prev;
      tax += taxable * b.rate;
      prev = b.max || Infinity;
    }
    return income > 0 ? tax / income : 0;
  }
  return 0;
};

export default function PaycheckCalculator() {
  const [grossPay, setGrossPay] = useState(6500);
  const [payFrequency, setPayFrequency] = useState('biweekly');
  const [filingStatus, setFilingStatus] = useState('single');
  const [state, setState] = useState('CA');
  const [allowances, setAllowances] = useState(1);
  const [preTax401k, setPreTax401k] = useState(500);
  const [preTaxHSA, setPreTaxHSA] = useState(150);
  const [healthInsurance, setHealthInsurance] = useState(200);
  const [postTaxDeductions, setPostTaxDeductions] = useState(0);

  const periods = PAY_PERIODS[payFrequency] || 26;

  const results = useMemo(() => {
    const annualGross = grossPay * periods;
    const preTaxTotal = preTax401k + preTaxHSA + healthInsurance;
    const annualPreTax = preTaxTotal * periods;

    // Adjusted gross for federal withholding
    const stdDed = STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single;
    const annualAdjusted = Math.max(0, annualGross - annualPreTax);
    const taxableAnnual = Math.max(0, annualAdjusted - stdDed);

    const brackets = filingStatus === 'mfj' ? FEDERAL_BRACKETS_MFJ : FEDERAL_BRACKETS_SINGLE;
    const annualFedTax = calcFederalTax(taxableAnnual, brackets);
    const fedTaxPerPeriod = annualFedTax / periods;
    const marginalRate = getMarginalRate(taxableAnnual, brackets);

    // FICA
    const annualGrossForFICA = annualGross - (preTax401k + preTaxHSA) * periods; // health ins not FICA exempt
    const ssTax = Math.min(annualGrossForFICA, SS_WAGE_BASE) * 0.062 / periods;
    const medicareTax = annualGrossForFICA * 0.0145 / periods;
    const additionalMedicare = annualGrossForFICA > (filingStatus === 'mfj' ? 250000 : 200000)
      ? (annualGrossForFICA - (filingStatus === 'mfj' ? 250000 : 200000)) * 0.009 / periods
      : 0;

    // State tax
    const stateRate = getStateRate(state, annualAdjusted);
    const stateTax = annualAdjusted * stateRate / periods;

    const totalDeductions = fedTaxPerPeriod + ssTax + medicareTax + additionalMedicare + stateTax + preTaxTotal + postTaxDeductions;
    const netPay = grossPay - totalDeductions;
    const effectiveRate = (fedTaxPerPeriod + ssTax + medicareTax + stateTax) / grossPay;

    return {
      grossPay,
      fedTax: fedTaxPerPeriod,
      ssTax,
      medicareTax,
      additionalMedicare,
      stateTax,
      preTaxTotal,
      postTaxDeductions,
      netPay: Math.max(0, netPay),
      totalDeductions,
      marginalRate,
      effectiveRate,
      annualNet: Math.max(0, netPay) * periods,
      annualGross,
      stateRate,
    };
  }, [grossPay, payFrequency, filingStatus, state, preTax401k, preTaxHSA, healthInsurance, postTaxDeductions, periods]);

  const pieData = [
    { name: 'Net Pay', value: Math.round(results.netPay), color: '#10b981' },
    { name: 'Federal Tax', value: Math.round(results.fedTax), color: '#6366f1' },
    { name: 'Social Security', value: Math.round(results.ssTax), color: '#f59e0b' },
    { name: 'Medicare', value: Math.round(results.medicareTax + results.additionalMedicare), color: '#ef4444' },
    { name: 'State Tax', value: Math.round(results.stateTax), color: '#f97316' },
    { name: 'Pre-Tax Benefits', value: Math.round(results.preTaxTotal), color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const comparisonData = [
    { label: 'Gross Pay', amount: Math.round(results.grossPay) },
    { label: 'Pre-Tax Ded.', amount: Math.round(results.preTaxTotal) },
    { label: 'Federal Tax', amount: Math.round(results.fedTax) },
    { label: 'FICA', amount: Math.round(results.ssTax + results.medicareTax) },
    { label: 'State Tax', amount: Math.round(results.stateTax) },
    { label: 'Net Pay', amount: Math.round(results.netPay) },
  ];

  const FREQ_LABELS = { weekly: 'Weekly', biweekly: 'Bi-Weekly', semimonthly: 'Semi-Monthly', monthly: 'Monthly', annual: 'Annual' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <SEOHead
        title="2025 Paycheck Calculator — Exact Take-Home Pay After Taxes"
        description="See your exact take-home pay after 2025 federal, state, FICA taxes and pre-tax deductions (401k, HSA). All 50 states, bi-weekly, monthly, and weekly pay periods."
        path="/us/paycheck"
        keywords="paycheck calculator 2025, take home pay calculator, salary after tax calculator, FICA tax calculator, net pay calculator 2025"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
          <Briefcase className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Paycheck Calculator</h1>
          <p className="text-muted-foreground text-sm">See your exact take-home pay after federal, state, FICA taxes and pre-tax deductions</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pay & Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Gross Pay Per Period ($)</Label>
                <Input type="number" value={grossPay} onChange={e => setGrossPay(+e.target.value)} className="h-9 mt-1" data-testid="pc-gross-pay" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pay Frequency</Label>
                <Select value={payFrequency} onValueChange={setPayFrequency}>
                  <SelectTrigger className="h-9 mt-1" data-testid="pc-pay-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQ_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l} ({PAY_PERIODS[v]}×/yr)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <SelectTrigger className="h-9 mt-1" data-testid="pc-state">
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
              <CardTitle className="text-base">Pre-Tax Deductions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">401(k) / 403(b) Contribution ($)</Label>
                <Input type="number" value={preTax401k} onChange={e => setPreTax401k(+e.target.value)} className="h-9 mt-1" data-testid="pc-401k" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">HSA Contribution ($)</Label>
                <Input type="number" value={preTaxHSA} onChange={e => setPreTaxHSA(+e.target.value)} className="h-9 mt-1" data-testid="pc-hsa" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Health Insurance Premium ($)</Label>
                <Input type="number" value={healthInsurance} onChange={e => setHealthInsurance(+e.target.value)} className="h-9 mt-1" data-testid="pc-health" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Other Post-Tax Deductions ($)</Label>
                <Input type="number" value={postTaxDeductions} onChange={e => setPostTaxDeductions(+e.target.value)} className="h-9 mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Result */}
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">{FREQ_LABELS[payFrequency]} Take-Home Pay</p>
              <p className="text-5xl font-bold text-emerald-500 mb-2" data-testid="pc-net-pay">{fmt(results.netPay)}</p>
              <div className="flex justify-center gap-6 text-sm mb-3">
                <div>
                  <p className="text-muted-foreground text-xs">Annual Net</p>
                  <p className="font-semibold text-foreground">{fmt(results.annualNet)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Effective Tax Rate</p>
                  <p className="font-semibold text-foreground">{fmtPct(results.effectiveRate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Marginal Rate</p>
                  <p className="font-semibold text-foreground">{fmtPct(results.marginalRate)}</p>
                </div>
              </div>
              {/* US Median Comparison */}
              {(() => {
                const annualGross = results.annualGross;
                const usMedianHousehold = 77397; // US median household income 2024 (Census Bureau)
                const usMedianTakeHome = usMedianHousehold * 0.72; // estimated
                const diff = results.annualNet - usMedianTakeHome;
                return (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${diff >= 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {diff >= 0
                      ? `${fmt(Math.abs(diff))} above the US median household take-home`
                      : `${fmt(Math.abs(diff))} below the US median household take-home`
                    }
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Breakdown */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Itemized */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pay Stub Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: 'Gross Pay', value: fmt(results.grossPay), style: 'text-foreground font-medium' },
                  { label: '401(k) / Pre-Tax', value: `– ${fmt(results.preTaxTotal)}`, style: 'text-purple-500' },
                  { label: 'Federal Income Tax', value: `– ${fmt(results.fedTax)}`, style: 'text-red-400' },
                  { label: 'Social Security (6.2%)', value: `– ${fmt(results.ssTax)}`, style: 'text-amber-400' },
                  { label: 'Medicare (1.45%)', value: `– ${fmt(results.medicareTax)}`, style: 'text-orange-400' },
                  { label: `State Tax (${fmtPct(results.stateRate)})`, value: `– ${fmt(results.stateTax)}`, style: 'text-blue-400' },
                  ...(results.postTaxDeductions > 0 ? [{ label: 'Post-Tax Deductions', value: `– ${fmt(results.postTaxDeductions)}`, style: 'text-muted-foreground' }] : []),
                ].map(({ label, value, style }, i) => (
                  <div key={i} className={`flex justify-between ${i === 0 ? 'pb-2 border-b border-border' : ''}`}>
                    <span className="text-muted-foreground">{label}</span>
                    <span className={style}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold text-foreground">Net Pay</span>
                  <span className="font-bold text-emerald-500">{fmt(results.netPay)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Where Does Your Money Go?</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(v)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Annual View */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Annual Summary ({PAY_PERIODS[payFrequency]} pay periods)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Annual Gross', value: fmt(results.annualGross), color: 'foreground' },
                  { label: 'Annual Federal Tax', value: fmt(results.fedTax * periods), color: 'red-500' },
                  { label: 'Annual FICA', value: fmt((results.ssTax + results.medicareTax) * periods), color: 'amber-500' },
                  { label: 'Annual Take-Home', value: fmt(results.annualNet), color: 'emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className={`font-bold text-${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              {results.stateRate === 0 && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-emerald-500">
                    You live in a state with no income tax — saving {fmt(results.grossPay * periods * 0.05)} vs the average 5% state rate!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
