import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, DollarSign, CheckCircle2, ArrowRight, Sparkles, Info } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

// 2024 brackets (for comparison)
const BRACKETS_2024 = {
  single: [
    { max: 11600, rate: 0.10 }, { max: 47150, rate: 0.12 }, { max: 100525, rate: 0.22 },
    { max: 191950, rate: 0.24 }, { max: 243725, rate: 0.32 }, { max: 609350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { max: 23200, rate: 0.10 }, { max: 94300, rate: 0.12 }, { max: 201050, rate: 0.22 },
    { max: 383900, rate: 0.24 }, { max: 487450, rate: 0.32 }, { max: 731200, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { max: 16550, rate: 0.10 }, { max: 63100, rate: 0.12 }, { max: 100500, rate: 0.22 },
    { max: 191950, rate: 0.24 }, { max: 243700, rate: 0.32 }, { max: 609350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
};
const STD_DED_2024 = { single: 14600, mfj: 29200, hoh: 21900 };

// 2025 brackets
const BRACKETS_2025 = {
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
const STD_DED_2025 = { single: 15750, mfj: 31500, hoh: 23625 };

const calcTax = (income, brackets, stdDed) => {
  const taxable = Math.max(0, income - stdDed);
  if (taxable <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, b.max) - prev) * b.rate;
    prev = b.max;
  }
  return tax;
};

const SALARY_PRESETS = [40000, 60000, 75000, 100000, 150000, 200000, 300000];
const STATUS_LABELS = { single: 'Single', mfj: 'Married Filing Jointly', hoh: 'Head of Household' };

export default function TaxComparison2025() {
  const [income, setIncome] = useState(85000);
  const [filingStatus, setFilingStatus] = useState('single');

  const results = useMemo(() => {
    const b2024 = BRACKETS_2024[filingStatus] || BRACKETS_2024.single;
    const b2025 = BRACKETS_2025[filingStatus] || BRACKETS_2025.single;
    const ded2024 = STD_DED_2024[filingStatus] || STD_DED_2024.single;
    const ded2025 = STD_DED_2025[filingStatus] || STD_DED_2025.single;

    const tax2024 = calcTax(income, b2024, ded2024);
    const tax2025 = calcTax(income, b2025, ded2025);
    const savings = tax2024 - tax2025;
    const taxable2024 = Math.max(0, income - ded2024);
    const taxable2025 = Math.max(0, income - ded2025);
    const effective2024 = income > 0 ? tax2024 / income : 0;
    const effective2025 = income > 0 ? tax2025 / income : 0;

    // Show bracket details for 2024 vs 2025
    const allRates = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
    const bracketComparison = allRates.map(rate => {
      const b24 = b2024.find(b => b.rate === rate);
      const b25 = b2025.find(b => b.rate === rate);
      const prev24 = b2024[b2024.indexOf(b24) - 1]?.max || 0;
      const prev25 = b2025[b2025.indexOf(b25) - 1]?.max || 0;
      return {
        rate: `${(rate * 100).toFixed(0)}%`,
        top2024: b24?.max === Infinity ? '∞' : `$${(b24?.max || 0).toLocaleString()}`,
        top2025: b25?.max === Infinity ? '∞' : `$${(b25?.max || 0).toLocaleString()}`,
        wider: (b25?.max !== Infinity && b24?.max !== Infinity) ? (b25?.max || 0) > (b24?.max || 0) : false,
      };
    });

    // Multi-income scenario
    const incomePoints = [30000, 50000, 75000, 100000, 130000, 175000, 250000, 400000];
    const scenarioData = incomePoints.map(inc => ({
      income: inc,
      label: inc >= 1000 ? `$${inc / 1000}k` : `$${inc}`,
      savings2025: calcTax(inc, b2024, ded2024) - calcTax(inc, b2025, ded2025),
    }));

    return { tax2024, tax2025, savings, taxable2024, taxable2025, effective2024, effective2025, bracketComparison, scenarioData, ded2024, ded2025 };
  }, [income, filingStatus]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
          <Sparkles className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">2025 vs 2024 Tax Comparison</h1>
          <p className="text-muted-foreground text-sm">See exactly how much more you keep in 2025 thanks to wider brackets and a higher standard deduction</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Your Income</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Annual Income ($)</Label>
                <Input type="number" value={income} onChange={e => setIncome(+e.target.value)} className="h-9 mt-1" data-testid="tc-income" />
              </div>
              <div className="flex flex-wrap gap-2">
                {SALARY_PRESETS.map(p => (
                  <button key={p} onClick={() => setIncome(p)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${income === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    ${(p / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1" data-testid="tc-filing-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                    <SelectItem value="hoh">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">What Changed</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              {[
                { label: 'Standard Deduction', val2024: fmt(results.ded2024), val2025: fmt(results.ded2025), diff: `+${fmt(results.ded2025 - results.ded2024)}` },
                { label: 'Taxable Income 2024', val2024: fmt(results.taxable2024), val2025: fmt(results.taxable2025), diff: results.taxable2025 < results.taxable2024 ? `-${fmt(results.taxable2024 - results.taxable2025)}` : '—' },
              ].map((item, i) => (
                <div key={i} className="p-2 rounded-lg bg-muted/40">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">2024: {item.val2024}</span>
                    <span className="text-primary">2025: {item.val2025}</span>
                  </div>
                  {item.diff !== '—' && <p className="text-emerald-500 font-medium mt-0.5">{item.diff} lower taxable income</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Hero result */}
          <Card className={`${results.savings > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/30'}`}>
            <CardContent className="p-6 text-center">
              {results.savings > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">At {fmt(income)} income as {STATUS_LABELS[filingStatus]}</p>
                  <p className="text-6xl font-bold text-emerald-500 mb-2" data-testid="tc-savings">{fmt(results.savings)}</p>
                  <p className="text-base text-foreground font-semibold">more in your pocket in 2025 vs 2024</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {fmt(results.tax2024)} tax in 2024 → {fmt(results.tax2025)} tax in 2025
                    &nbsp;·&nbsp;
                    Effective rate: {(results.effective2024 * 100).toFixed(2)}% → {(results.effective2025 * 100).toFixed(2)}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-1">Your tax liability is the same in 2025 vs 2024</p>
                  <p className="text-3xl font-bold text-foreground">{fmt(results.tax2025)}</p>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: '2024 Federal Tax', value: fmt(results.tax2024), color: 'amber', sub: `${(results.effective2024 * 100).toFixed(2)}% effective rate` },
              { label: '2025 Federal Tax', value: fmt(results.tax2025), color: 'emerald', sub: `${(results.effective2025 * 100).toFixed(2)}% effective rate` },
              { label: 'Your 2025 Savings', value: fmt(results.savings), color: 'blue', sub: 'Thanks to IRS inflation adjustments' },
            ].map((item, i) => (
              <div key={i} className={`p-4 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20 text-center`}>
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className={`text-2xl font-bold text-${item.color}-500`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Savings by income level */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">2025 Tax Savings by Income Level ({STATUS_LABELS[filingStatus]})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={results.scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`$${Math.round(v)}`, '2025 savings vs 2024']} />
                  <Bar dataKey="savings2025" name="Tax Savings" radius={[4, 4, 0, 0]}>
                    {results.scenarioData.map((entry, i) => (
                      <Cell key={i} fill={entry.income === income ? '#10b981' : '#10b98150'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bracket comparison table */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Tax Bracket Comparison: 2024 vs 2025</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Rate', '2024 Bracket Top', '2025 Bracket Top', 'Change'].map(h => (
                        <th key={h} className="text-left py-2 pr-4 text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.bracketComparison.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 pr-4 font-bold text-foreground">{row.rate}</td>
                        <td className="py-1.5 pr-4 text-muted-foreground">{row.top2024}</td>
                        <td className="py-1.5 pr-4 text-foreground">{row.top2025}</td>
                        <td className="py-1.5 pr-4">
                          {row.wider ? <span className="text-emerald-500 font-medium">Wider ↑</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
