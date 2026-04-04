import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar
} from 'recharts';
import { PiggyBank, AlertCircle, CheckCircle2, Clock, Info, DollarSign } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

// IRS Uniform Lifetime Table (2022 SECURE 2.0 update)
const UNIFORM_LIFETIME_TABLE = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2,
  104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4,
  112: 3.3, 113: 3.1, 114: 2.9, 115: 2.8, 116: 2.7, 117: 2.5, 118: 2.3, 119: 2.0, 120: 2.0,
};

const getDistributionPeriod = (age) => {
  if (age < 73) return null;
  if (age >= 120) return UNIFORM_LIFETIME_TABLE[120];
  return UNIFORM_LIFETIME_TABLE[age] || UNIFORM_LIFETIME_TABLE[120];
};

// Federal ordinary income brackets for RMD taxation
const ORDINARY_BRACKETS = {
  single: [
    { max: 11600, rate: 0.10 }, { max: 47150, rate: 0.12 }, { max: 100525, rate: 0.22 },
    { max: 191950, rate: 0.24 }, { max: 243725, rate: 0.32 }, { max: 609350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { max: 23200, rate: 0.10 }, { max: 94300, rate: 0.12 }, { max: 201050, rate: 0.22 },
    { max: 383900, rate: 0.24 }, { max: 487450, rate: 0.32 }, { max: 731200, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
};

const getMarginalRate = (income, filingStatus) => {
  const brackets = ORDINARY_BRACKETS[filingStatus] || ORDINARY_BRACKETS.single;
  for (const b of [...brackets].reverse()) {
    if (income > b.min || b.min === undefined) return b.rate;
  }
  return 0.12;
};

export default function RMDCalculator() {
  const [age, setAge] = useState(73);
  const [accountBalance, setAccountBalance] = useState(500000);
  const [returnRate, setReturnRate] = useState(6);
  const [otherIncome, setOtherIncome] = useState(40000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [accountType, setAccountType] = useState('traditional_ira');

  const distributionPeriod = getDistributionPeriod(age);
  const currentRMD = distributionPeriod ? accountBalance / distributionPeriod : 0;

  const schedule = useMemo(() => {
    const data = [];
    let balance = accountBalance;
    const r = returnRate / 100;

    for (let yr = 0; yr <= 20; yr++) {
      const currentAge = age + yr;
      const dp = getDistributionPeriod(currentAge);
      if (!dp) {
        data.push({ year: yr, age: currentAge, rmd: 0, balance, tax: 0 });
        balance = balance * (1 + r);
        continue;
      }

      const rmd = balance / dp;
      const totalIncome = otherIncome + rmd;
      const marginalRate = getMarginalRate(totalIncome, filingStatus);
      const tax = rmd * marginalRate;
      const balanceAfterRMD = balance - rmd;

      data.push({
        year: yr,
        age: currentAge,
        rmd: Math.round(rmd),
        balance: Math.round(balance),
        balanceAfterRMD: Math.round(balanceAfterRMD),
        tax: Math.round(tax),
        netRMD: Math.round(rmd - tax),
        marginalRate,
        dp,
      });

      balance = balanceAfterRMD * (1 + r);
    }
    return data;
  }, [age, accountBalance, returnRate, otherIncome, filingStatus]);

  const totalRMDs10Yr = schedule.slice(0, 10).reduce((s, r) => s + r.rmd, 0);
  const totalTax10Yr = schedule.slice(0, 10).reduce((s, r) => s + r.tax, 0);
  const projectedBalanceAt10Yr = schedule[10]?.balance || 0;
  const qualifiedCharitableMax = Math.min(currentRMD, 105000);

  const penalty = currentRMD * 0.25; // 25% penalty for missing RMD

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
          <Clock className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">RMD Calculator</h1>
          <p className="text-muted-foreground text-sm">Required Minimum Distributions from IRAs and 401(k)s — SECURE 2.0 Act (age 73)</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Current Age</Label>
                <Input type="number" value={age} onChange={e => setAge(Math.max(60, +e.target.value))} className="h-9 mt-1" data-testid="rmd-age" min={60} max={120} />
                {age < 73 && (
                  <p className="text-xs text-amber-500 mt-1">RMDs begin at age 73 (SECURE 2.0)</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Account Balance ($)</Label>
                <Input type="number" value={accountBalance} onChange={e => setAccountBalance(+e.target.value)} className="h-9 mt-1" data-testid="rmd-balance" />
                <p className="text-xs text-muted-foreground mt-1">Use Dec 31 prior-year balance</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traditional_ira">Traditional IRA</SelectItem>
                    <SelectItem value="401k">Traditional 401(k)</SelectItem>
                    <SelectItem value="403b">403(b)</SelectItem>
                    <SelectItem value="sep_ira">SEP IRA</SelectItem>
                    <SelectItem value="simple_ira">SIMPLE IRA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Expected Annual Return (%)</Label>
                <Input type="number" value={returnRate} onChange={e => setReturnRate(+e.target.value)} className="h-9 mt-1" step={0.5} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Other Annual Income ($)</Label>
                <Input type="number" value={otherIncome} onChange={e => setOtherIncome(+e.target.value)} className="h-9 mt-1" data-testid="rmd-other-income" />
                <p className="text-xs text-muted-foreground mt-1">Social Security, pension, etc.</p>
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Penalty Warning */}
          <Card className="bg-red-500/5 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Missed RMD Penalty</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    If you miss your RMD, the IRS charges a 25% excise tax on the undistributed amount.
                    For your current balance, that's <span className="font-medium text-red-500">{fmt(penalty)}</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Year RMD */}
          {age >= 73 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: `Age ${age} RMD`, value: fmt(currentRMD), color: 'purple', sub: 'Required distribution' },
                { label: 'Distribution Period', value: distributionPeriod?.toFixed(1), color: 'blue', sub: 'IRS Uniform Table' },
                { label: '10-yr Total RMDs', value: fmt(totalRMDs10Yr), color: 'amber', sub: 'Next 10 years' },
                { label: '10-yr Tax on RMDs', value: fmt(totalTax10Yr), color: 'red', sub: 'Estimated federal tax' },
              ].map((item, i) => (
                <div key={i} className={`p-3 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-xl font-bold text-${item.color}-500`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-emerald-500/5 border-emerald-500/30">
              <CardContent className="p-4 flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">No RMDs Required Yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    RMDs begin at age 73 under SECURE 2.0. You have {73 - age} years of tax-free compounding left.
                    Consider Roth conversions before age 73 to reduce future RMDs.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RMD + Balance Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">20-Year RMD & Portfolio Balance Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={schedule}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="age" tickFormatter={a => `Age ${a}`} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v)]} labelFormatter={l => `Age ${l}`} />
                  <Line type="monotone" dataKey="balance" name="Account Balance" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rmd" name="Annual RMD" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  {age >= 73 && <ReferenceLine x={age} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Now', fontSize: 10 }} />}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 10-Year Schedule Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Annual RMD Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Age', 'Dist. Period', 'Balance (Jan 1)', 'RMD', 'Est. Tax', 'Net RMD'].map(h => (
                        <th key={h} className="text-left py-2 pr-3 text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.filter(r => r.rmd > 0).slice(0, 10).map((row) => (
                      <tr key={row.age} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-1.5 pr-3 font-medium text-foreground">{row.age}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground">{row.dp?.toFixed(1)}</td>
                        <td className="py-1.5 pr-3 text-foreground">{fmt(row.balance)}</td>
                        <td className="py-1.5 pr-3 text-amber-500 font-medium">{fmt(row.rmd)}</td>
                        <td className="py-1.5 pr-3 text-red-400">{fmt(row.tax)}</td>
                        <td className="py-1.5 pr-3 text-emerald-500">{fmt(row.netRMD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* QCD Tip */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-foreground mb-1">Qualified Charitable Distribution (QCD)</p>
                <p className="text-xs text-muted-foreground">
                  If you're 70½ or older, you can donate up to <span className="text-blue-500 font-medium">{fmt(qualifiedCharitableMax)}</span> directly
                  from your IRA to charity as a QCD. This satisfies your RMD requirement but is excluded from taxable income —
                  a better deal than taking the RMD and then donating the after-tax amount.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
