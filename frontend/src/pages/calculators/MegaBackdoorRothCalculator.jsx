import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PiggyBank, CheckCircle2, AlertCircle, Info, DollarSign, Zap } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

// 2025 limits
const EMPLOYEE_LIMIT_UNDER50 = 23500;
const EMPLOYEE_LIMIT_OVER50 = 31000; // $23,500 + $7,500 catch-up
const TOTAL_LIMIT_UNDER50 = 70000;
const TOTAL_LIMIT_OVER50 = 77500; // $70,000 + $7,500 catch-up

export default function MegaBackdoorRothCalculator() {
  const [salary, setSalary] = useState(180000);
  const [age, setAge] = useState(40);
  const [employeeContribution, setEmployeeContribution] = useState(23500);
  const [employerMatch, setEmployerMatch] = useState(6500);
  const [marginalTaxRate, setMarginalTaxRate] = useState(24);
  const [returnRate, setReturnRate] = useState(7);
  const [yearsToRetirement, setYearsToRetirement] = useState(20);
  const [planAllowsAfterTax, setPlanAllowsAfterTax] = useState(true);

  const results = useMemo(() => {
    const isOver50 = age >= 50;
    const employeeLimit = isOver50 ? EMPLOYEE_LIMIT_OVER50 : EMPLOYEE_LIMIT_UNDER50;
    const totalLimit = isOver50 ? TOTAL_LIMIT_OVER50 : TOTAL_LIMIT_UNDER50;

    const effectiveEmployee = Math.min(employeeContribution, employeeLimit);
    const effectiveEmployer = employerMatch;
    const totalEmployerEmployee = effectiveEmployee + effectiveEmployer;
    const afterTaxCapacity = Math.max(0, totalLimit - totalEmployerEmployee);

    // Tax savings from traditional 401k
    const traditionalTaxSavings = effectiveEmployee * (marginalTaxRate / 100);

    // Mega Backdoor Roth growth
    const r = returnRate / 100;
    const futureValueRoth = afterTaxCapacity * Math.pow(1 + r, yearsToRetirement);
    const futureValueTaxable = afterTaxCapacity * Math.pow(1 + r, yearsToRetirement) * (1 - 0.20); // minus assumed cap gains tax

    const rothAdvantage = futureValueRoth - futureValueTaxable;
    const tenYearRothValue = afterTaxCapacity * 10 * Math.pow(1 + r, yearsToRetirement);

    // Annual contribution comparison chart
    const chartData = [
      { name: 'Employee (Pre-Tax)', value: effectiveEmployee, color: '#6366f1' },
      { name: 'Employer Match', value: effectiveEmployer, color: '#10b981' },
      ...(planAllowsAfterTax && afterTaxCapacity > 0 ? [{ name: 'After-Tax (Mega Backdoor)', value: afterTaxCapacity, color: '#f59e0b' }] : []),
    ];

    return {
      isOver50, employeeLimit, totalLimit, afterTaxCapacity, effectiveEmployee, effectiveEmployer,
      totalEmployerEmployee, traditionalTaxSavings, futureValueRoth, futureValueTaxable,
      rothAdvantage, tenYearRothValue, chartData,
    };
  }, [salary, age, employeeContribution, employerMatch, marginalTaxRate, returnRate, yearsToRetirement, planAllowsAfterTax]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
          <PiggyBank className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Mega Backdoor Roth Calculator</h1>
          <p className="text-muted-foreground text-sm">Supercharge your Roth savings beyond the $7,000 IRA limit using after-tax 401(k) contributions</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Your 401(k) Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Annual Salary ($)</Label>
                <Input type="number" value={salary} onChange={e => setSalary(+e.target.value)} className="h-9 mt-1" data-testid="mbr-salary" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Your Age</Label>
                <Input type="number" value={age} onChange={e => setAge(+e.target.value)} className="h-9 mt-1" data-testid="mbr-age" />
                {age >= 50 && <p className="text-xs text-emerald-500 mt-1">Catch-up contributions available (+$7,500)</p>}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Employee 401(k) Contribution ($)</Label>
                <Input type="number" value={employeeContribution} onChange={e => setEmployeeContribution(+e.target.value)} className="h-9 mt-1" max={results.employeeLimit} data-testid="mbr-employee-contribution" />
                <p className="text-xs text-muted-foreground mt-1">Max: {fmt(results.employeeLimit)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Employer Match / Contribution ($)</Label>
                <Input type="number" value={employerMatch} onChange={e => setEmployerMatch(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Marginal Tax Rate (%)</Label>
                <Input type="number" value={marginalTaxRate} onChange={e => setMarginalTaxRate(+e.target.value)} className="h-9 mt-1" step={1} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="plan-allows" checked={planAllowsAfterTax} onChange={e => setPlanAllowsAfterTax(e.target.checked)} className="rounded" />
                <Label htmlFor="plan-allows" className="text-xs text-muted-foreground cursor-pointer">My plan allows after-tax contributions</Label>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Years to Retirement</Label>
                <Input type="number" value={yearsToRetirement} onChange={e => setYearsToRetirement(+e.target.value)} className="h-9 mt-1" />
              </div>
            </CardContent>
          </Card>

          {!planAllowsAfterTax && (
            <Card className="bg-amber-500/5 border-amber-500/30">
              <CardContent className="p-4 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Ask your HR if your 401(k) plan allows "after-tax contributions" and "in-service distributions or conversions." Many large plans do!</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total 401(k) Limit', value: fmt(results.totalLimit), color: 'foreground', sub: age >= 50 ? 'With catch-up' : '2024 limit' },
              { label: 'After-Tax Capacity', value: fmt(results.afterTaxCapacity), color: 'amber', sub: 'Mega Backdoor Roth' },
              { label: 'Roth Value at Retirement', value: fmt(results.futureValueRoth), color: 'emerald', sub: `${yearsToRetirement} years, ${returnRate}% return` },
              { label: 'Tax-Free Advantage', value: fmt(results.rothAdvantage), color: 'blue', sub: 'vs taxable investing' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border bg-${item.color === 'foreground' ? 'muted/30' : `${item.color}-500/5`} border-${item.color === 'foreground' ? 'border' : `${item.color}-500/20`}`}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-base font-bold ${item.color === 'foreground' ? 'text-foreground' : `text-${item.color}-500`}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Annual 401(k) Contribution Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={results.chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                  <Tooltip formatter={(v) => [fmt(v)]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {results.chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Max Employee Contribution', desc: `Contribute ${fmt(results.employeeLimit)} to your 401(k) (Traditional or Roth)`, color: 'indigo' },
              { step: '2', title: 'Add After-Tax Contributions', desc: `Add up to ${fmt(results.afterTaxCapacity)} in after-tax (non-deductible) contributions`, color: 'amber' },
              { step: '3', title: 'Convert to Roth', desc: 'Do an in-service Roth conversion, now it grows tax-free forever', color: 'emerald' },
            ].map((item, i) => (
              <Card key={i} className={`bg-${item.color}-500/5 border-${item.color}-500/20`}>
                <CardContent className="p-4">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-${item.color}-500/20 text-${item.color}-500 font-bold text-sm mb-2`}>
                    {item.step}
                  </div>
                  <p className="font-semibold text-sm text-foreground mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
