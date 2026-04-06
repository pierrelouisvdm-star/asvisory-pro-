import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, DollarSign, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

// 2024 Federal Poverty Level (FPL), 48 contiguous states
const FPL_2024 = { 1: 15060, 2: 20440, 3: 25820, 4: 31200, 5: 36580, 6: 41960, 7: 47340, 8: 52720 };

// 2024 ACA Premium Contribution Cap (% of income) by FPL range
// American Rescue Plan enhanced through 2025 (no contribution above 8.5% for anyone)
const getContributionPct = (fplPct) => {
  if (fplPct <= 1.0) return 0;
  if (fplPct <= 1.33) return fplPct <= 1.0 ? 0 : 0.0 + (fplPct - 1.0) / 0.33 * 0.02;
  if (fplPct <= 1.5) return 0.02 + (fplPct - 1.33) / 0.17 * 0.03;
  if (fplPct <= 2.0) return 0.05 + (fplPct - 1.5) / 0.5 * 0.01;
  if (fplPct <= 2.5) return 0.06 + (fplPct - 2.0) / 0.5 * 0.02;
  if (fplPct <= 3.0) return 0.08 + (fplPct - 2.5) / 0.5 * 0.005;
  return 0.085; // 8.5% cap for everyone above 300% FPL (ARP provision)
};

// Benchmark silver plan averages by age group (national average estimates)
const getAvgSilverPremium = (age, householdSize) => {
  const basePerPerson = age < 27 ? 350 : age < 40 ? 450 : age < 50 ? 550 : age < 60 ? 750 : 900;
  return basePerPerson * Math.min(householdSize, 3); // ACA family premium capped at ~3 members
};

export default function ACASubsidyCalculator() {
  const [householdSize, setHouseholdSize] = useState(1);
  const [annualIncome, setAnnualIncome] = useState(35000);
  const [primaryAge, setPrimaryAge] = useState(35);
  const [state, setState] = useState('TX');
  const [customBenchmarkPremium, setCustomBenchmarkPremium] = useState(0); // 0 = use estimate

  const results = useMemo(() => {
    const size = Math.min(Math.max(householdSize, 1), 8);
    const fpl = FPL_2024[size] || FPL_2024[8] + (size - 8) * 5380;
    const fplPct = annualIncome / fpl;
    const fplPctDisplay = fplPct * 100;

    const benchmarkMonthly = customBenchmarkPremium > 0 ? customBenchmarkPremium : getAvgSilverPremium(primaryAge, size);
    const benchmarkAnnual = benchmarkMonthly * 12;

    const eligible = fplPct >= 1.0; // 100% FPL minimum
    const contributionPct = eligible ? Math.min(getContributionPct(fplPct), 0.085) : 1.0;
    const maxContributionAnnual = Math.min(annualIncome * contributionPct, benchmarkAnnual);
    const maxContributionMonthly = maxContributionAnnual / 12;

    const annualSubsidy = eligible ? Math.max(0, benchmarkAnnual - maxContributionAnnual) : 0;
    const monthlySubsidy = annualSubsidy / 12;
    const subsidizedPremium = Math.max(0, benchmarkMonthly - monthlySubsidy);
    const subsidyPct = benchmarkAnnual > 0 ? annualSubsidy / benchmarkAnnual : 0;

    // Medicaid eligibility (138% FPL in expansion states)
    const medicaidEligible = fplPct <= 1.38;
    const medicaidStates = ['AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'HI', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SD', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI'];
    const stateExpandedMedicaid = medicaidStates.includes(state);

    // Income scenarios for chart
    const scenarios = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map(multiplier => {
      const scenarioIncome = fpl * multiplier;
      const scenarioFplPct = multiplier;
      const scenarioContrib = Math.min(getContributionPct(scenarioFplPct), 0.085);
      const scenarioMaxContrib = Math.min(scenarioIncome * scenarioContrib, benchmarkAnnual);
      const scenarioSubsidy = Math.max(0, benchmarkAnnual - scenarioMaxContrib) / 12;
      return {
        label: `${(multiplier * 100).toFixed(0)}% FPL`,
        subsidy: Math.round(scenarioSubsidy),
        yourPremium: Math.round(Math.max(0, benchmarkMonthly - scenarioSubsidy)),
        isCurrentIncome: Math.abs(multiplier - fplPct) < 0.25,
      };
    });

    return {
      fpl, fplPct, fplPctDisplay, benchmarkMonthly, benchmarkAnnual,
      eligible, medicaidEligible, stateExpandedMedicaid,
      annualSubsidy, monthlySubsidy, subsidizedPremium, subsidyPct,
      maxContributionMonthly, scenarios,
    };
  }, [householdSize, annualIncome, primaryAge, state, customBenchmarkPremium]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
          <Activity className="h-6 w-6 text-teal-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">ACA Health Insurance Subsidy Calculator</h1>
          <p className="text-muted-foreground text-sm">Estimate your Premium Tax Credit for Marketplace health insurance (2024)</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Household Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Household Size (for coverage)</Label>
                <Input type="number" value={householdSize} onChange={e => setHouseholdSize(Math.max(1, Math.min(8, +e.target.value)))} className="h-9 mt-1" min={1} max={8} data-testid="aca-household-size" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual Household Income ($)</Label>
                <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} className="h-9 mt-1" data-testid="aca-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Primary Applicant Age</Label>
                <Input type="number" value={primaryAge} onChange={e => setPrimaryAge(Math.max(18, Math.min(64, +e.target.value)))} className="h-9 mt-1" min={18} max={64} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Monthly Benchmark Premium ($, optional)</Label>
                <Input type="number" value={customBenchmarkPremium} onChange={e => setCustomBenchmarkPremium(+e.target.value)} className="h-9 mt-1" placeholder="Leave 0 to use estimate" />
                <p className="text-xs text-muted-foreground mt-1">Find on healthcare.gov, 2nd-lowest cost silver plan</p>
              </div>
            </CardContent>
          </Card>

          <Card className={results.medicaidEligible && results.stateExpandedMedicaid ? 'bg-teal-500/5 border-teal-500/30' : results.eligible ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/30'}>
            <CardContent className="p-4 flex gap-2">
              {results.eligible
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              }
              <div>
                <p className="text-sm font-medium text-foreground">
                  {results.medicaidEligible && results.stateExpandedMedicaid
                    ? 'Medicaid Eligible'
                    : results.eligible
                      ? 'Subsidy Eligible'
                      : 'Income Too Low for Subsidy'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {results.fplPctDisplay.toFixed(0)}% of Federal Poverty Level
                  {' · '}FPL for {householdSize}: {fmt(results.fpl)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Benchmark Premium', value: fmtD(results.benchmarkMonthly) + '/mo', color: 'foreground' },
              { label: 'Monthly Subsidy', value: fmtD(results.monthlySubsidy) + '/mo', color: 'emerald' },
              { label: 'Your Net Premium', value: fmtD(results.subsidizedPremium) + '/mo', color: 'blue' },
              { label: 'Annual Savings', value: fmt(results.annualSubsidy), color: 'amber' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border bg-${item.color === 'foreground' ? 'muted/30' : `${item.color}-500/5`} border-${item.color === 'foreground' ? 'border' : `${item.color}-500/20`}`}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-base font-bold ${item.color === 'foreground' ? 'text-foreground' : `text-${item.color}-500`}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Monthly Subsidy by Income Level</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={results.scenarios}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, name) => [`$${v}/mo`, name]} />
                  <Bar dataKey="subsidy" name="Subsidy" radius={[4, 4, 0, 0]}>
                    {results.scenarios.map((entry, i) => (
                      <Cell key={i} fill={entry.isCurrentIncome ? '#10b981' : '#10b98140'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-foreground mb-1">Important Notes</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Subsidies are Premium Tax Credits, taken monthly or as refund at filing</li>
                  <li>• American Rescue Plan enhanced subsidies (8.5% cap) extended through 2025</li>
                  <li>• Benchmark = 2nd-lowest Silver plan in your county. Visit healthcare.gov for exact rates</li>
                  {results.medicaidEligible && !results.stateExpandedMedicaid && (
                    <li className="text-amber-400">• Your state ({state}) hasn't expanded Medicaid, you may fall in the "coverage gap" below 100% FPL</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
