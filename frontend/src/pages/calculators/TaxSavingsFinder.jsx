import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, DollarSign, CheckCircle2, AlertCircle, ChevronRight, Sparkles, Target, Info } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';
import SEOHead from '@/components/SEOHead';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

// 2025 limits
const LIMITS = {
  k401_under50: 23500,
  k401_over50: 31000,
  hsa_individual: 4300,
  hsa_family: 8550,
  ira: 7000,
  ira_over50: 8000,
  sep_ira_pct: 0.25,
  sep_ira_max: 70000,
  qbi_rate: 0.20,
  student_loan_max_deduction: 2500,
  student_loan_phaseout_single: { start: 75000, end: 90000 },
  student_loan_phaseout_mfj: { start: 155000, end: 185000 },
};

const BRACKETS_SINGLE = [
  { max: 11925, rate: 0.10 }, { max: 48475, rate: 0.12 }, { max: 103350, rate: 0.22 },
  { max: 197300, rate: 0.24 }, { max: 250525, rate: 0.32 }, { max: 626350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
];
const BRACKETS_MFJ = [
  { max: 23850, rate: 0.10 }, { max: 96950, rate: 0.12 }, { max: 206700, rate: 0.22 },
  { max: 394600, rate: 0.24 }, { max: 501050, rate: 0.32 }, { max: 751600, rate: 0.35 }, { max: Infinity, rate: 0.37 },
];
const STD_DED = { single: 15750, mfj: 31500, hoh: 23625 };

const getMarginalRate = (taxableIncome, brackets) => {
  for (const b of [...brackets].reverse()) {
    if (taxableIncome > (b.min || 0)) return b.rate;
  }
  return 0.10;
};
const calcTax = (income, brackets) => {
  if (income <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (income <= prev) break;
    tax += (Math.min(income, b.max) - prev) * b.rate;
    prev = b.max;
  }
  return tax;
};

export default function TaxSavingsFinder() {
  const [grossIncome, setGrossIncome] = useState(95000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [age, setAge] = useState(35);
  const [current401k, setCurrent401k] = useState(5000);
  const [hasHSAPlan, setHasHSAPlan] = useState(false);
  const [hsaFamily, setHsaFamily] = useState(false);
  const [currentHSA, setCurrentHSA] = useState(0);
  const [selfEmployed, setSelfEmployed] = useState(false);
  const [hasStudentLoan, setHasStudentLoan] = useState(false);
  const [studentLoanInterest, setStudentLoanInterest] = useState(0);
  const [hasCurrentRothIRA, setHasCurrentRothIRA] = useState(false);
  const [charitableGiving, setCharitableGiving] = useState(0);
  const [stateTaxRate, setStateTaxRate] = useState(5);

  const results = useMemo(() => {
    const brackets = filingStatus === 'mfj' ? BRACKETS_MFJ : BRACKETS_SINGLE;
    const stdDed = STD_DED[filingStatus] || STD_DED.single;
    const isOver50 = age >= 50;
    const combinedTaxRate = (marginalRate) => marginalRate + stateTaxRate / 100;

    const taxableNow = Math.max(0, grossIncome - stdDed);
    const marginalRate = getMarginalRate(taxableNow, brackets);
    const currentTax = calcTax(taxableNow, brackets);
    const effectiveRate = grossIncome > 0 ? currentTax / grossIncome : 0;

    const opportunities = [];

    // 1. 401k Top-Up
    const k401Limit = isOver50 ? LIMITS.k401_over50 : LIMITS.k401_under50;
    const k401Gap = Math.max(0, k401Limit - current401k);
    if (k401Gap > 0) {
      const taxSaved = k401Gap * combinedTaxRate(marginalRate);
      opportunities.push({
        id: '401k',
        title: 'Max Out Your 401(k)',
        subtitle: `Increase contributions by ${fmt(k401Gap)} to reach the ${fmt(k401Limit)} limit`,
        savingsMin: Math.round(k401Gap * marginalRate),
        savingsMax: Math.round(taxSaved),
        savings: Math.round(taxSaved),
        effort: 'Easy',
        effortColor: 'emerald',
        how: `Increase your paycheck 401(k) deferral to ${fmt(k401Limit / 12)}/month. Pre-tax contributions reduce your W-2 income dollar-for-dollar.`,
        icon: '💼',
        action: '/us/401k-calculator',
        actionLabel: '401(k) Calculator',
      });
    }

    // 2. HSA
    if (hasHSAPlan) {
      const hsaLimit = hsaFamily ? LIMITS.hsa_family : LIMITS.hsa_individual;
      const hsaGap = Math.max(0, hsaLimit - currentHSA);
      if (hsaGap > 0) {
        const taxSaved = hsaGap * (marginalRate + 0.0765 + stateTaxRate / 100); // triple tax: income + FICA + state
        opportunities.push({
          id: 'hsa',
          title: 'Maximize Your HSA (Triple Tax Advantage)',
          subtitle: `Contribute ${fmt(hsaGap)} more to reach the ${fmt(hsaLimit)} limit`,
          savings: Math.round(taxSaved),
          effort: 'Easy',
          effortColor: 'emerald',
          how: `HSA contributions are pre-tax (reduce FICA too), grow tax-free, and withdrawals for medical expenses are tax-free. No other account has this triple benefit.`,
          icon: '🏥',
          action: '/us/hsa',
          actionLabel: 'HSA Calculator',
        });
      }
    }

    // 3. Traditional IRA (if income-eligible and not already Roth)
    const iraLimit = isOver50 ? LIMITS.ira_over50 : LIMITS.ira;
    const iraPhaseoutSingle = { start: 87000, end: 97000 }; // 2025 if covered by workplace plan
    const iraPhaseoutMFJ = { start: 146000, end: 166000 };
    const phaseout = filingStatus === 'mfj' ? iraPhaseoutMFJ : iraPhaseoutSingle;
    const iraEligible = grossIncome < phaseout.end;
    if (iraEligible && !hasCurrentRothIRA) {
      let deductibleAmount = iraLimit;
      if (grossIncome > phaseout.start) {
        deductibleAmount = iraLimit * (1 - (grossIncome - phaseout.start) / (phaseout.end - phaseout.start));
      }
      deductibleAmount = Math.max(0, Math.round(deductibleAmount));
      if (deductibleAmount > 0) {
        opportunities.push({
          id: 'trad_ira',
          title: 'Deductible Traditional IRA Contribution',
          subtitle: `Up to ${fmt(deductibleAmount)} deductible for 2025 (deadline: April 15, 2026)`,
          savings: Math.round(deductibleAmount * combinedTaxRate(marginalRate)),
          effort: 'Easy',
          effortColor: 'emerald',
          how: `Open or contribute to a Traditional IRA by April 15, 2026. Deductible contributions reduce your adjusted gross income immediately.`,
          icon: '🏦',
          action: '/us/roth-ira',
          actionLabel: 'IRA Calculator',
        });
      }
    }

    // 4. Roth Conversion (low bracket opportunity)
    const rothConversionRoom = marginalRate <= 0.22 && grossIncome < (filingStatus === 'mfj' ? 206700 : 103350);
    if (rothConversionRoom) {
      const roomInBracket = (filingStatus === 'mfj' ? 206700 : 103350) - taxableNow;
      const conversionAmount = Math.min(50000, Math.max(0, roomInBracket));
      if (conversionAmount > 5000) {
        opportunities.push({
          id: 'roth_conversion',
          title: 'Roth Conversion Opportunity',
          subtitle: `You're in the ${(marginalRate * 100).toFixed(0)}% bracket — convert up to ${fmt(conversionAmount)} at a favorable rate`,
          savings: null,
          savingsNote: `Future tax-free growth — estimated benefit varies by retirement tax rate`,
          effort: 'Medium',
          effortColor: 'blue',
          how: `Converting Traditional IRA/401k funds to Roth now (while in a lower bracket) creates tax-free growth forever and reduces future RMDs.`,
          icon: '♻️',
          action: '/us/roth-conversion',
          actionLabel: 'Roth Conversion Analyzer',
        });
      }
    }

    // 5. SEP-IRA for self-employed
    if (selfEmployed) {
      const netSelfEmployed = grossIncome * 0.9235;
      const seTax = netSelfEmployed * 0.153;
      const netEarnings = netSelfEmployed - seTax / 2;
      const sepContrib = Math.min(LIMITS.sep_ira_max, netEarnings * LIMITS.sep_ira_pct);
      opportunities.push({
        id: 'sep_ira',
        title: 'SEP-IRA — Massive Self-Employed Tax Shelter',
        subtitle: `Contribute up to ${fmt(sepContrib)} (25% of net self-employment income)`,
        savings: Math.round(sepContrib * combinedTaxRate(marginalRate)),
        effort: 'Easy',
        effortColor: 'emerald',
        how: `SEP-IRA lets you contribute up to $70,000/year (2025) — far more than a regular IRA. Deadline is your tax return due date including extensions.`,
        icon: '🧾',
        action: '/us/self-employed',
        actionLabel: 'Self-Employment Tax',
      });
    }

    // 6. Student loan interest
    if (hasStudentLoan && studentLoanInterest > 0) {
      const phaseoutRange = filingStatus === 'mfj'
        ? LIMITS.student_loan_phaseout_mfj
        : LIMITS.student_loan_phaseout_single;
      let deductible = Math.min(studentLoanInterest, LIMITS.student_loan_max_deduction);
      if (grossIncome > phaseoutRange.end) deductible = 0;
      else if (grossIncome > phaseoutRange.start) {
        deductible *= 1 - (grossIncome - phaseoutRange.start) / (phaseoutRange.end - phaseoutRange.start);
      }
      if (deductible > 0) {
        opportunities.push({
          id: 'student_loan',
          title: 'Student Loan Interest Deduction',
          subtitle: `Deduct up to ${fmt(deductible)} in student loan interest paid in 2025`,
          savings: Math.round(deductible * marginalRate),
          effort: 'Easy',
          effortColor: 'emerald',
          how: `Up to $2,500 of student loan interest is deductible above-the-line (no itemizing needed). Your lender sends Form 1098-E.`,
          icon: '🎓',
          action: '/us/student-loan',
          actionLabel: 'Student Loan Calculator',
        });
      }
    }

    // 7. Itemize check
    const potentialItemized = charitableGiving + (filingStatus === 'mfj' ? 2000 : 1000); // rough SALT+mortgage guess
    if (potentialItemized > stdDed * 0.7) {
      opportunities.push({
        id: 'itemize',
        title: 'Consider Itemizing Deductions',
        subtitle: `Your charitable giving alone is ${fmt(charitableGiving)} — you may beat the ${fmt(stdDed)} standard deduction`,
        savings: Math.round(Math.max(0, charitableGiving - stdDed) * marginalRate),
        effort: 'Medium',
        effortColor: 'blue',
        how: `If mortgage interest + property taxes + charitable giving + medical expenses > ${fmt(stdDed)}, itemizing saves you more. Track receipts year-round.`,
        icon: '📋',
        action: '/us/tax-calculator',
        actionLabel: 'Tax Calculator',
      });
    }

    // 8. Always-on tips
    opportunities.push({
      id: 'tax_loss',
      title: 'Tax-Loss Harvesting',
      subtitle: 'Offset capital gains — sell losing investments before Dec 31',
      savings: null,
      savingsNote: 'Up to $3,000/yr offsets ordinary income; unlimited gains offset',
      effort: 'Medium',
      effortColor: 'blue',
      how: `Review your taxable investment accounts. Sell positions at a loss to offset capital gains. Losses in excess of gains offset up to $3,000 of ordinary income per year.`,
      icon: '📉',
      action: '/us/capital-gains',
      actionLabel: 'Capital Gains Calculator',
    });

    const totalSavings = opportunities.reduce((sum, o) => sum + (o.savings || 0), 0);
    return { opportunities, totalSavings, marginalRate, effectiveRate, currentTax };
  }, [grossIncome, filingStatus, age, current401k, hasHSAPlan, hsaFamily, currentHSA, selfEmployed, hasStudentLoan, studentLoanInterest, hasCurrentRothIRA, charitableGiving, stateTaxRate]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <SEOHead
        title="2025 Tax Savings Finder — Personalized Ways to Cut Your Tax Bill"
        description="Enter your income and situation. Get a personalized list of every legal way to reduce your 2025 federal tax bill: 401k, HSA, IRA, QBI deduction, student loan interest, and more."
        path="/us/tax-savings-finder"
        keywords="tax savings 2025, how to reduce taxes 2025, tax deductions 2025, 401k tax savings, HSA tax benefit, IRA deduction 2025"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <TrendingDown className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Tax Savings Finder</h1>
          <p className="text-muted-foreground text-sm">Enter your situation — we'll show you every legal way to cut your 2025 tax bill</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Your Situation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Annual Gross Income ($)</Label>
                <Input type="number" value={grossIncome} onChange={e => setGrossIncome(+e.target.value)} className="h-9 mt-1" data-testid="tsf-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                    <SelectItem value="hoh">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Your Age</Label>
                <Input type="number" value={age} onChange={e => setAge(+e.target.value)} className="h-9 mt-1" min={18} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Current Annual 401(k) Contributions ($)</Label>
                <Input type="number" value={current401k} onChange={e => setCurrent401k(+e.target.value)} className="h-9 mt-1" data-testid="tsf-401k" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State Income Tax Rate (%)</Label>
                <Input type="number" value={stateTaxRate} onChange={e => setStateTaxRate(+e.target.value)} className="h-9 mt-1" step={0.1} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Your Accounts & Situation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 'hsa', label: 'I have an HSA-eligible health plan', state: hasHSAPlan, setter: setHasHSAPlan },
                { id: 'hsa_family', label: 'Family HSA plan (not self-only)', state: hsaFamily, setter: setHsaFamily, disabled: !hasHSAPlan },
                { id: 'self_employed', label: 'I have self-employment / 1099 income', state: selfEmployed, setter: setSelfEmployed },
                { id: 'student_loan', label: 'I pay student loan interest', state: hasStudentLoan, setter: setHasStudentLoan },
                { id: 'roth_ira', label: 'I already contribute to a Roth IRA', state: hasCurrentRothIRA, setter: setHasCurrentRothIRA },
              ].map(item => (
                <div key={item.id} className={`flex items-center gap-2 ${item.disabled ? 'opacity-50' : ''}`}>
                  <input type="checkbox" id={item.id} checked={item.state} onChange={e => item.setter(e.target.checked)} className="rounded" disabled={item.disabled} />
                  <Label htmlFor={item.id} className="text-xs text-muted-foreground cursor-pointer">{item.label}</Label>
                </div>
              ))}
              {hasHSAPlan && (
                <div>
                  <Label className="text-xs text-muted-foreground">Current Annual HSA Contribution ($)</Label>
                  <Input type="number" value={currentHSA} onChange={e => setCurrentHSA(+e.target.value)} className="h-9 mt-1" />
                </div>
              )}
              {hasStudentLoan && (
                <div>
                  <Label className="text-xs text-muted-foreground">Annual Student Loan Interest Paid ($)</Label>
                  <Input type="number" value={studentLoanInterest} onChange={e => setStudentLoanInterest(+e.target.value)} className="h-9 mt-1" />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Annual Charitable Donations ($)</Label>
                <Input type="number" value={charitableGiving} onChange={e => setCharitableGiving(+e.target.value)} className="h-9 mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Current Tax Summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">Your Current Tax Picture</p>
              {[
                ['Marginal Rate', `${(results.marginalRate * 100).toFixed(0)}%`],
                ['Effective Rate', `${(results.effectiveRate * 100).toFixed(1)}%`],
                ['Est. Federal Tax', fmt(results.currentTax)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-medium text-foreground">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          {/* Total savings banner */}
          {results.totalSavings > 0 && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    <p className="font-bold text-foreground text-lg">We found {results.opportunities.length} tax-saving opportunities</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Implement all of these and you could save approximately:</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-4xl font-bold text-emerald-500">{fmt(results.totalSavings)}</p>
                  <p className="text-xs text-muted-foreground">in 2025 taxes</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Opportunities list */}
          <div className="space-y-3">
            {results.opportunities.map((opp, i) => (
              <Card key={opp.id} className={`border transition-all hover:shadow-md ${i === 0 && opp.savings > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{opp.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-foreground text-sm">{opp.title}</p>
                        <Badge className={`text-[10px] bg-${opp.effortColor}-500/10 text-${opp.effortColor}-500 border-0`}>
                          {opp.effort}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{opp.subtitle}</p>
                      <p className="text-xs text-muted-foreground/80 leading-relaxed mb-3">{opp.how}</p>
                      {opp.action && (
                        <a href={opp.action} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          {opp.actionLabel} <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      {opp.savings != null ? (
                        <>
                          <p className="text-lg font-bold text-emerald-500">{fmt(opp.savings)}</p>
                          <p className="text-xs text-muted-foreground">saved</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground text-right">{opp.savingsNote}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex gap-2">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Tax savings estimates are based on your marginal federal rate + state rate. Actual savings depend on your complete tax situation.
                These strategies are widely applicable but consult a CPA for personalized advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
