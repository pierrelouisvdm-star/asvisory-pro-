import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { GraduationCap, DollarSign, Clock, TrendingDown, CheckCircle2, AlertCircle, Info, Briefcase } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount);

// 2024 US Federal Poverty Guidelines (lower 48 states)
const POVERTY_LINE_2024 = 15060;

const FILING_STATUS_FAMILY = { single: 1, married_joint: 2, married_separate: 1, head_of_household: 2 };

const calcMonthlyPayment = (principal, annualRate, months) => {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
};

const calcIBRPayment = (agi, familySize, idrPlan) => {
  const povertyLine = POVERTY_LINE_2024 * familySize;
  const discretionary = Math.max(0, agi - povertyLine * 1.5);
  const rate = idrPlan === 'save' ? 0.05 : idrPlan === 'paye' ? 0.10 : 0.10;
  return (discretionary * rate) / 12;
};

const buildAmortization = (principal, annualRate, monthlyPayment, maxMonths = 360) => {
  const r = annualRate / 100 / 12;
  let balance = principal;
  let totalInterest = 0;
  const data = [];
  for (let m = 1; m <= maxMonths && balance > 0; m++) {
    const interest = balance * r;
    const principalPaid = Math.min(monthlyPayment - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    if (m % 12 === 0) {
      data.push({ year: m / 12, balance: Math.round(balance), totalInterest: Math.round(totalInterest) });
    }
    if (balance <= 0) break;
  }
  return data;
};

const STRATEGIES = [
  { id: 'standard', label: 'Standard (10 yr)', color: '#6366f1' },
  { id: 'extended', label: 'Extended (25 yr)', color: '#f59e0b' },
  { id: 'ibr', label: 'IBR/SAVE', color: '#10b981' },
  { id: 'extra', label: '+ Extra Payments', color: '#f97316' },
  { id: 'refinance', label: 'Refinanced', color: '#8b5cf6' },
];

export default function StudentLoanCalculator() {
  const [loanBalance, setLoanBalance] = useState(35000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [annualIncome, setAnnualIncome] = useState(55000);
  const [familySize, setFamilySize] = useState(1);
  const [idrPlan, setIdrPlan] = useState('save');
  const [extraPayment, setExtraPayment] = useState(200);
  const [refinanceRate, setRefinanceRate] = useState(4.5);
  const [hasPSLF, setHasPSLF] = useState(false);

  const results = useMemo(() => {
    const standard = {
      id: 'standard',
      payment: calcMonthlyPayment(loanBalance, interestRate, 120),
      months: 120,
    };
    standard.totalPaid = standard.payment * standard.months;
    standard.totalInterest = standard.totalPaid - loanBalance;

    const extended = {
      id: 'extended',
      payment: calcMonthlyPayment(loanBalance, interestRate, 300),
      months: 300,
    };
    extended.totalPaid = extended.payment * extended.months;
    extended.totalInterest = extended.totalPaid - loanBalance;

    const ibrMonthly = calcIBRPayment(annualIncome, familySize, idrPlan);
    const ibrData = buildAmortization(loanBalance, interestRate, ibrMonthly, hasPSLF ? 120 : 300);
    const ibrMonths = ibrData.length > 0 ? ibrData[ibrData.length - 1].year * 12 : 300;
    const ibrForgivenAmount = hasPSLF && ibrMonths >= 120 ? ibrData[ibrData.length - 1]?.balance || 0 : 0;

    const extraPmt = standard.payment + extraPayment;
    const extraData = buildAmortization(loanBalance, interestRate, extraPmt, 120);
    const extraMonths = extraData.length > 0 ? extraData[extraData.length - 1].year * 12 : 120;

    const refinanced = {
      id: 'refinance',
      payment: calcMonthlyPayment(loanBalance, refinanceRate, 120),
      months: 120,
    };
    refinanced.totalPaid = refinanced.payment * 120;
    refinanced.totalInterest = refinanced.totalPaid - loanBalance;

    return {
      standard,
      extended,
      ibr: { id: 'ibr', payment: ibrMonthly, months: hasPSLF ? 120 : ibrMonths, totalInterest: ibrData[ibrData.length - 1]?.totalInterest || 0, forgiven: ibrForgivenAmount },
      extra: { id: 'extra', payment: extraPmt, months: extraMonths, totalInterest: extraData[extraData.length - 1]?.totalInterest || 0 },
      refinanced,
    };
  }, [loanBalance, interestRate, annualIncome, familySize, idrPlan, hasPSLF, extraPayment, refinanceRate]);

  const comparisonData = [
    { name: 'Standard 10yr', payment: Math.round(results.standard.payment), totalInterest: Math.round(results.standard.totalInterest), months: 120 },
    { name: 'Extended 25yr', payment: Math.round(results.extended.payment), totalInterest: Math.round(results.extended.totalInterest), months: 300 },
    { name: 'IBR/SAVE', payment: Math.round(results.ibr.payment), totalInterest: Math.round(results.ibr.totalInterest), months: results.ibr.months },
    { name: 'Extra Payments', payment: Math.round(results.extra.payment), totalInterest: Math.round(results.extra.totalInterest), months: results.extra.months },
    { name: 'Refinanced', payment: Math.round(results.refinanced.payment), totalInterest: Math.round(results.refinanced.totalInterest), months: 120 },
  ];

  const bestOption = comparisonData.reduce((best, opt) =>
    (opt.totalInterest < best.totalInterest ? opt : best), comparisonData[0]);

  const standardAmortization = buildAmortization(loanBalance, interestRate, results.standard.payment);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
          <GraduationCap className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Student Loan Payoff Calculator</h1>
          <p className="text-muted-foreground text-sm">Compare repayment strategies, IBR, PSLF, and refinancing</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Total Loan Balance ($)</Label>
                <Input type="number" value={loanBalance} onChange={e => setLoanBalance(+e.target.value)} className="h-9 mt-1" data-testid="sl-balance" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Interest Rate</Label>
                  <span className="text-xs font-medium text-primary">{interestRate}%</span>
                </div>
                <Slider value={[interestRate]} onValueChange={([v]) => setInterestRate(v)} min={1} max={14} step={0.25} data-testid="sl-rate" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual Income (AGI) ($)</Label>
                <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} className="h-9 mt-1" data-testid="sl-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Family Size</Label>
                <Select value={String(familySize)} onValueChange={v => setFamilySize(+v)}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'person' : 'people'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">IDR Plan</Label>
                <Select value={idrPlan} onValueChange={setIdrPlan}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="save">SAVE (New IBR)</SelectItem>
                    <SelectItem value="ibr">IBR (Old)</SelectItem>
                    <SelectItem value="paye">PAYE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Extra Payments & Refinancing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Extra Monthly Payment ($)</Label>
                <Input type="number" value={extraPayment} onChange={e => setExtraPayment(+e.target.value)} className="h-9 mt-1" data-testid="sl-extra" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Refinance Rate</Label>
                  <span className="text-xs font-medium text-primary">{refinanceRate}%</span>
                </div>
                <Slider value={[refinanceRate]} onValueChange={([v]) => setRefinanceRate(v)} min={2} max={10} step={0.25} data-testid="sl-refi-rate" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div>
                  <p className="text-sm font-medium text-foreground">PSLF Eligible?</p>
                  <p className="text-xs text-muted-foreground">10 years / 120 payments</p>
                </div>
                <button
                  onClick={() => setHasPSLF(!hasPSLF)}
                  className={`w-12 h-6 rounded-full transition-colors ${hasPSLF ? 'bg-blue-500' : 'bg-muted'}`}
                  data-testid="sl-pslf-toggle"
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${hasPSLF ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Best Option Banner */}
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Best Strategy: {bestOption.name}</p>
                <p className="text-xs text-muted-foreground">
                  Saves most on interest — total interest: {formatCurrency(bestOption.totalInterest)} over {Math.round(bestOption.months / 12)} years
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {comparisonData.map((opt, i) => (
              <div key={i} className={`p-3 rounded-xl border ${opt.name === bestOption.name ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border bg-card'}`}>
                <p className="text-xs font-medium text-foreground mb-2">{opt.name}</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(opt.payment)}<span className="text-xs text-muted-foreground">/mo</span></p>
                <p className="text-xs text-red-400 mt-1">+{formatCurrency(opt.totalInterest)} interest</p>
                <p className="text-xs text-muted-foreground">{Math.round(opt.months / 12)} years</p>
              </div>
            ))}
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Interest Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Total Interest']} />
                  <Bar dataKey="totalInterest" name="Total Interest" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Amortization Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Balance Over Time (Standard Repayment)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={standardAmortization}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="year" tickFormatter={y => `Yr ${y}`} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [formatCurrency(v)]} />
                  <Area type="monotone" dataKey="balance" name="Remaining Balance" stroke="#6366f1" fill="#6366f120" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">PSLF Tip</p>
                <p className="text-xs text-muted-foreground">Working for a 501(c)(3) nonprofit or government agency? After 10 years (120 payments) on an IDR plan, your remaining balance is forgiven tax-free. This can save tens of thousands.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">Extra Payments Strategy</p>
                <p className="text-xs text-muted-foreground">Even $100-200 extra per month can cut years off your repayment and save thousands in interest. Always apply extra payments to principal, not future payments.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Disclaimer />
    </div>
  );
}
