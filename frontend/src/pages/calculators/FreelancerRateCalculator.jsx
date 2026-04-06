import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Briefcase, TrendingUp, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

export default function FreelancerRateCalculator() {
  const [targetAnnualIncome, setTargetAnnualIncome] = useState(100000);
  const [billableHoursPerWeek, setBillableHoursPerWeek] = useState(30);
  const [weeksPerYear, setWeeksPerYear] = useState(48);
  const [healthInsurance, setHealthInsurance] = useState(600);
  const [retirementContribution, setRetirementContribution] = useState(20000);
  const [annualExpenses, setAnnualExpenses] = useState(5000);
  const [sickVacationBuffer, setSickVacationBuffer] = useState(10);
  const [stateIncomeTaxRate, setStateIncomeTaxRate] = useState(5);
  const [w2SalaryComparison, setW2SalaryComparison] = useState(0);

  const results = useMemo(() => {
    const billableHoursPerYear = billableHoursPerWeek * weeksPerYear * (1 - sickVacationBuffer / 100);
    const annualHealthInsurance = healthInsurance * 12;

    // SE Tax: 15.3% on 92.35% of net self-employment income
    // Net SE income = targetAnnualIncome - expenses (simplified)
    // SE tax = 0.1530 * 0.9235 * net income
    const grossNeeded = targetAnnualIncome + annualHealthInsurance + retirementContribution + annualExpenses;
    const seTaxRate = 0.9235 * 0.153; // effective SE tax rate on gross
    // To find gross including SE tax: gross = (target + overhead) / (1 - seTaxRate/2)
    // SE tax deduction = 50% of SE tax, so effectively seTaxRate * 0.5 reduces taxable income
    const seTax = grossNeeded * seTaxRate;
    const halfSETax = seTax * 0.5;
    const fedTaxableIncome = Math.max(0, grossNeeded + seTax - halfSETax - 15750); // 2025 standard deduction
    const fedTaxEstimate = fedTaxableIncome * 0.22; // simplified 22% bracket
    const stateTaxEstimate = grossNeeded * (stateIncomeTaxRate / 100);

    const totalAnnualCost = grossNeeded + seTax + fedTaxEstimate + stateTaxEstimate;
    const totalAnnualNeed = totalAnnualCost;

    const hourlyRate = billableHoursPerYear > 0 ? totalAnnualNeed / billableHoursPerYear : 0;
    const dailyRate = hourlyRate * 8;
    const weeklyRate = hourlyRate * billableHoursPerWeek;
    const monthlyRate = totalAnnualNeed / 12;

    // W-2 equivalent comparison
    const w2NetTakeHome = w2SalaryComparison > 0 ? w2SalaryComparison * 0.72 : 0; // est 28% tax
    const freelanceNetTakeHome = targetAnnualIncome;
    const rateToMatchW2 = w2SalaryComparison > 0
      ? (w2SalaryComparison + annualHealthInsurance + retirementContribution + annualExpenses + seTax + fedTaxEstimate) / billableHoursPerYear
      : null;

    const breakdown = [
      { name: 'Target Income', value: Math.round(targetAnnualIncome), color: '#10b981' },
      { name: 'Health Insurance', value: Math.round(annualHealthInsurance), color: '#6366f1' },
      { name: 'Retirement', value: Math.round(retirementContribution), color: '#f59e0b' },
      { name: 'Business Expenses', value: Math.round(annualExpenses), color: '#8b5cf6' },
      { name: 'SE Tax', value: Math.round(seTax), color: '#ef4444' },
      { name: 'Income Taxes (est.)', value: Math.round(fedTaxEstimate + stateTaxEstimate), color: '#f97316' },
    ];

    return {
      hourlyRate, dailyRate, weeklyRate, monthlyRate, totalAnnualNeed,
      seTax, fedTaxEstimate, stateTaxEstimate, annualHealthInsurance,
      billableHoursPerYear, breakdown, rateToMatchW2,
    };
  }, [targetAnnualIncome, billableHoursPerWeek, weeksPerYear, healthInsurance, retirementContribution, annualExpenses, sickVacationBuffer, stateIncomeTaxRate, w2SalaryComparison]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
          <Briefcase className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Freelancer Rate Calculator</h1>
          <p className="text-muted-foreground text-sm">What hourly rate do you need to charge to hit your income goal as a 1099 freelancer?</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Income Goal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Target Annual Net Income ($)</Label>
                <Input type="number" value={targetAnnualIncome} onChange={e => setTargetAnnualIncome(+e.target.value)} className="h-9 mt-1" data-testid="fl-target-income" />
                <p className="text-xs text-muted-foreground mt-1">What you want to take home after taxes</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Billable Hours per Week</Label>
                <Input type="number" value={billableHoursPerWeek} onChange={e => setBillableHoursPerWeek(+e.target.value)} className="h-9 mt-1" data-testid="fl-billable-hours" />
                <p className="text-xs text-muted-foreground mt-1">Realistic paid hours (not total work hours)</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Billable Weeks per Year</Label>
                <Input type="number" value={weeksPerYear} onChange={e => setWeeksPerYear(+e.target.value)} className="h-9 mt-1" max={52} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Non-Billable Buffer</Label>
                  <span className="text-xs font-medium text-amber-500">{sickVacationBuffer}%</span>
                </div>
                <Slider value={[sickVacationBuffer]} onValueChange={([v]) => setSickVacationBuffer(v)} min={0} max={30} step={1} />
                <p className="text-xs text-muted-foreground mt-1">Sick days, marketing, admin time</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Costs to Cover</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Monthly Health Insurance ($)</Label>
                <Input type="number" value={healthInsurance} onChange={e => setHealthInsurance(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual Retirement Savings ($)</Label>
                <Input type="number" value={retirementContribution} onChange={e => setRetirementContribution(+e.target.value)} className="h-9 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">SEP-IRA up to 25% of net income</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual Business Expenses ($)</Label>
                <Input type="number" value={annualExpenses} onChange={e => setAnnualExpenses(+e.target.value)} className="h-9 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Software, equipment, home office</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State Income Tax Rate (%)</Label>
                <Input type="number" value={stateIncomeTaxRate} onChange={e => setStateIncomeTaxRate(+e.target.value)} className="h-9 mt-1" step={0.1} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">W-2 Salary to Match ($, optional)</Label>
                <Input type="number" value={w2SalaryComparison} onChange={e => setW2SalaryComparison(+e.target.value)} className="h-9 mt-1" placeholder="e.g. 120000" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-violet-500/10 border-violet-500/30">
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Required Hourly Rate</p>
                <p className="text-5xl font-bold text-violet-500" data-testid="fl-hourly-rate">{fmtD(results.hourlyRate)}</p>
                <p className="text-xs text-muted-foreground mt-2">{Math.round(results.billableHoursPerYear)} billable hours/year</p>
              </CardContent>
            </Card>
            <div className="grid grid-rows-3 gap-3">
              {[
                { label: 'Daily Rate (8hr)', value: fmt(results.dailyRate) },
                { label: 'Weekly Rate', value: fmt(results.weeklyRate) },
                { label: 'Monthly Revenue Needed', value: fmt(results.monthlyRate) },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl border bg-muted/30 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="font-bold text-foreground text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {results.rateToMatchW2 !== null && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">To match your {fmt(w2SalaryComparison)} W-2 salary</p>
                  <p className="text-xs text-muted-foreground">Including benefits you'd lose (health insurance, retirement match)</p>
                </div>
                <p className="text-2xl font-bold text-blue-500">{fmtD(results.rateToMatchW2)}/hr</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Annual Revenue Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={results.breakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(v) => [fmt(v)]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {results.breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-foreground mb-1">SE Tax Reality Check</p>
                <p className="text-xs text-muted-foreground">
                  Self-employment tax is <span className="font-medium text-emerald-500">{fmt(results.seTax)}/year</span> (15.3% on 92.35% of net income) — this replaces
                  the employer + employee share of FICA. You get to deduct 50% of it, which helps. Open a SEP-IRA to shelter up to 25% of net income tax-free.
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
