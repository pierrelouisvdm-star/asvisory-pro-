import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ClipboardList, CheckCircle2, AlertCircle, Info, DollarSign } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const BRACKETS_2024 = {
  single: [
    { max: 11925, rate: 0.10 }, { max: 48475, rate: 0.12 }, { max: 103350, rate: 0.22 },
    { max: 197300, rate: 0.24 }, { max: 250525, rate: 0.32 }, { max: 626350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { max: 23850, rate: 0.10 }, { max: 96950, rate: 0.12 }, { max: 206700, rate: 0.22 },
    { max: 394600, rate: 0.24 }, { max: 501050, rate: 0.32 }, { max: 751600, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { max: 17000, rate: 0.10 }, { max: 64850, rate: 0.12 }, { max: 103350, rate: 0.22 },
    { max: 197300, rate: 0.24 }, { max: 250500, rate: 0.32 }, { max: 626350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
};
const STD_DED = { single: 15750, mfj: 31500, hoh: 23625 };

const calcTax = (taxableIncome, brackets) => {
  if (taxableIncome <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (taxableIncome <= prev) break;
    const amt = Math.min(taxableIncome, b.max) - prev;
    tax += amt * b.rate;
    prev = b.max;
  }
  return tax;
};

const getMarginalBracket = (taxableIncome, brackets) => {
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome > (i === 0 ? 0 : brackets[i - 1].max)) return brackets[i];
  }
  return brackets[0];
};

export default function W4Optimizer() {
  const [filingStatus, setFilingStatus] = useState('single');
  const [wages, setWages] = useState(75000);
  const [otherIncome, setOtherIncome] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [dependentCredits, setDependentCredits] = useState(0);
  const [childrenUnder17, setChildrenUnder17] = useState(0);
  const [otherDependents, setOtherDependents] = useState(0);
  const [currentWithholding, setCurrentWithholding] = useState(8500);
  const [payPeriods, setPayPeriods] = useState(26);

  const childTaxCredit = childrenUnder17 * 2000;
  const otherDependentCredit = otherDependents * 500;
  const totalCredits = childTaxCredit + otherDependentCredit + dependentCredits;

  const results = useMemo(() => {
    const brackets = BRACKETS_2024[filingStatus] || BRACKETS_2024.single;
    const stdDed = STD_DED[filingStatus] || STD_DED.single;
    const totalDeductions = Math.max(stdDed, deductions);

    const agi = wages + otherIncome;
    const taxableIncome = Math.max(0, agi - totalDeductions);
    const grossTax = calcTax(taxableIncome, brackets);
    const finalTax = Math.max(0, grossTax - totalCredits);

    // FICA
    const ssTax = Math.min(wages, 176100) * 0.062;
    const medicareTax = wages * 0.0145;

    // Recommended per-period withholding (federal only)
    const recommendedAnnualWithholding = finalTax;
    const recommendedPerPeriod = recommendedAnnualWithholding / payPeriods;
    const currentAnnualWithholding = currentWithholding;
    const difference = currentAnnualWithholding - finalTax;

    // W-4 Step 3 value
    const step3Value = totalCredits;
    // W-4 Step 4b (additional deductions beyond standard)
    const step4b = deductions > stdDed ? deductions - stdDed : 0;
    // Step 4c additional per-paycheck amount
    const step4c = difference < 0 ? Math.abs(difference) / payPeriods : 0;

    const marginalBracket = getMarginalBracket(taxableIncome, brackets);
    const effectiveRate = agi > 0 ? finalTax / agi : 0;

    // Bracket room left
    const bracketMin = brackets.indexOf(marginalBracket) === 0 ? 0 : brackets[brackets.indexOf(marginalBracket) - 1].max;
    const bracketRoomLeft = marginalBracket.max === Infinity ? null : marginalBracket.max - taxableIncome;

    const chartData = brackets.map((b, i) => {
      const bMin = i === 0 ? 0 : brackets[i - 1].max;
      const bMax = b.max === Infinity ? bMin + 500000 : b.max;
      const inBracket = Math.max(0, Math.min(taxableIncome, bMax) - bMin);
      return {
        rate: `${(b.rate * 100).toFixed(0)}%`,
        inBracket: Math.round(inBracket),
        tax: Math.round(inBracket * b.rate),
        isActive: b === marginalBracket,
      };
    }).filter(d => d.inBracket > 0);

    return {
      agi, taxableIncome, grossTax, finalTax, ssTax, medicareTax,
      recommendedPerPeriod, currentAnnualWithholding, difference,
      step3Value, step4b, step4c, marginalBracket, effectiveRate,
      bracketRoomLeft, totalCredits, stdDed, totalDeductions,
      willOwe: difference < 0, willReceiveRefund: difference > 0,
      chartData,
    };
  }, [filingStatus, wages, otherIncome, deductions, dependentCredits, childrenUnder17, otherDependents, currentWithholding, payPeriods, totalCredits]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
          <ClipboardList className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">W-4 Withholding Optimizer</h1>
          <p className="text-muted-foreground text-sm">Tune your W-4 to avoid a surprise tax bill or an unnecessary refund</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Income & Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1" data-testid="w4-filing-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                    <SelectItem value="hoh">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual W-2 Wages ($)</Label>
                <Input type="number" value={wages} onChange={e => setWages(+e.target.value)} className="h-9 mt-1" data-testid="w4-wages" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Other Income (1099, investments) ($)</Label>
                <Input type="number" value={otherIncome} onChange={e => setOtherIncome(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Itemized Deductions ($)</Label>
                <Input type="number" value={deductions} onChange={e => setDeductions(+e.target.value)} className="h-9 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Standard deduction {fmt(results.stdDed)} auto-applied if larger</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Dependents & Credits</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Children under 17</Label>
                <Input type="number" value={childrenUnder17} onChange={e => setChildrenUnder17(+e.target.value)} className="h-9 mt-1" min={0} />
                <p className="text-xs text-muted-foreground mt-1">{fmt(childrenUnder17 * 2000)} Child Tax Credit</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Other dependents</Label>
                <Input type="number" value={otherDependents} onChange={e => setOtherDependents(+e.target.value)} className="h-9 mt-1" min={0} />
                <p className="text-xs text-muted-foreground mt-1">{fmt(otherDependents * 500)} credit</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Current Withholding</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Current Annual Federal Withholding ($)</Label>
                <Input type="number" value={currentWithholding} onChange={e => setCurrentWithholding(+e.target.value)} className="h-9 mt-1" data-testid="w4-current-withholding" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pay Periods Per Year</Label>
                <Select value={String(payPeriods)} onValueChange={v => setPayPeriods(+v)}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="52">Weekly (52)</SelectItem>
                    <SelectItem value="26">Bi-Weekly (26)</SelectItem>
                    <SelectItem value="24">Semi-Monthly (24)</SelectItem>
                    <SelectItem value="12">Monthly (12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Result Banner */}
          <Card className={results.willOwe ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {results.willOwe
                  ? <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  : <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                }
                <div>
                  <p className="font-semibold text-foreground">
                    {results.willOwe
                      ? `You're under-withholding by ${fmt(Math.abs(results.difference))} — you'll owe at tax time`
                      : results.difference > 200
                        ? `You're over-withholding by ${fmt(results.difference)} — getting a large refund`
                        : `Withholding looks accurate — within ${fmt(Math.abs(results.difference))} of your liability`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated tax liability: {fmt(results.finalTax)} · Current withholding: {fmt(results.currentAnnualWithholding)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Taxable Income', value: fmt(results.taxableIncome), color: 'foreground' },
                  { label: 'Est. Tax Owed', value: fmt(results.finalTax), color: 'red-500' },
                  { label: 'Effective Rate', value: `${(results.effectiveRate * 100).toFixed(1)}%`, color: 'foreground' },
                  { label: 'Marginal Rate', value: `${(results.marginalBracket.rate * 100).toFixed(0)}%`, color: 'amber-500' },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded-lg bg-background/50 text-center">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`font-bold text-${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* W-4 Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recommended W-4 Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Step 3: Dependents</p>
                  <p className="text-xl font-bold text-foreground">{fmt(results.step3Value)}</p>
                  <p className="text-xs text-muted-foreground">Enter in box 3</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Step 4(b): Extra Deductions</p>
                  <p className="text-xl font-bold text-foreground">{fmt(results.step4b)}</p>
                  <p className="text-xs text-muted-foreground">Above standard deduction</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${results.step4c > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  <p className="text-xs text-muted-foreground mb-1">Step 4(c): Extra Per Paycheck</p>
                  <p className={`text-xl font-bold ${results.step4c > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {results.step4c > 0 ? `+ ${fmt(results.step4c)}` : 'None needed'}
                  </p>
                  <p className="text-xs text-muted-foreground">Additional withholding</p>
                </div>
              </div>
              {results.step4c > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-muted-foreground">
                  Add <span className="font-medium text-amber-500">{fmt(results.step4c)}</span> in Step 4(c) of your W-4 per paycheck to avoid owing {fmt(Math.abs(results.difference))} at filing time.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Tax Bracket Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="rate" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, name) => [fmt(v), name]} />
                  <Bar dataKey="tax" name="Tax Paid" radius={[4, 4, 0, 0]}>
                    {results.chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.isActive ? '#6366f1' : '#6366f140'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {results.bracketRoomLeft !== null && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  You have <span className="font-medium text-primary">{fmt(results.bracketRoomLeft)}</span> of room left in the {(results.marginalBracket.rate * 100).toFixed(0)}% bracket.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
