import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Home, DollarSign, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

const calcMonthlyPayment = (principal, annualRate, months) => {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

export default function HomeAffordabilityCalculator() {
  const [annualIncome, setAnnualIncome] = useState(100000);
  const [monthlyDebt, setMonthlyDebt] = useState(400);
  const [downPayment, setDownPayment] = useState(60000);
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [insuranceRate, setInsuranceRate] = useState(0.5);
  const [hoa, setHoa] = useState(0);
  const [pmiRate, setPmiRate] = useState(0.5);

  const results = useMemo(() => {
    const monthlyIncome = annualIncome / 12;

    // 28% rule: max housing expense = 28% of gross monthly income
    const maxHousing28 = monthlyIncome * 0.28;
    // 36% rule: max total debt = 36% of gross monthly income
    const maxTotalDebt36 = monthlyIncome * 0.36;
    const maxHousing36 = maxTotalDebt36 - monthlyDebt;
    const conservativeHousing = Math.min(maxHousing28, maxHousing36);

    // Calculate max home price iteratively
    const calcMaxPrice = (maxMonthlyHousing) => {
      // PITI: Principal+Interest + Property Tax + Insurance + HOA + PMI
      // Start with a guess
      let low = 0, high = 5000000;
      for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        const loan = mid - downPayment;
        if (loan <= 0) { high = mid; continue; }
        const pi = calcMonthlyPayment(loan, interestRate / 100, loanTermYears * 12);
        const taxes = (mid * propertyTaxRate / 100) / 12;
        const ins = (mid * insuranceRate / 100) / 12;
        const pmi = (downPayment / mid) < 0.20 ? (loan * pmiRate / 100) / 12 : 0;
        const total = pi + taxes + ins + pmi + hoa;
        if (total < maxMonthlyHousing) low = mid;
        else high = mid;
      }
      return Math.floor((low + high) / 2);
    };

    const maxHomeConservative = Math.max(0, calcMaxPrice(conservativeHousing));
    const maxHome28Only = Math.max(0, calcMaxPrice(maxHousing28));

    // For the recommended price, use conservative
    const recPrice = maxHomeConservative;
    const recLoan = Math.max(0, recPrice - downPayment);
    const recPI = calcMonthlyPayment(recLoan, interestRate / 100, loanTermYears * 12);
    const recTax = (recPrice * propertyTaxRate / 100) / 12;
    const recIns = (recPrice * insuranceRate / 100) / 12;
    const recPMI = downPayment / recPrice < 0.20 ? (recLoan * pmiRate / 100) / 12 : 0;
    const recHOA = hoa;
    const recMonthly = recPI + recTax + recIns + recPMI + recHOA;
    const recDTI = (recMonthly + monthlyDebt) / monthlyIncome;
    const downPctRecommended = recPrice > 0 ? downPayment / recPrice : 0;

    const chartData = [
      { name: 'Principal & Interest', value: Math.round(recPI), color: '#6366f1' },
      { name: 'Property Tax', value: Math.round(recTax), color: '#f59e0b' },
      { name: 'Insurance', value: Math.round(recIns), color: '#10b981' },
      ...(recPMI > 0 ? [{ name: 'PMI', value: Math.round(recPMI), color: '#ef4444' }] : []),
      ...(recHOA > 0 ? [{ name: 'HOA', value: Math.round(recHOA), color: '#8b5cf6' }] : []),
    ];

    const totalInterest = recPI * loanTermYears * 12 - recLoan;

    return {
      maxHomeConservative, maxHome28Only, recPrice, recLoan, recPI, recTax, recIns, recPMI, recHOA,
      recMonthly, recDTI, downPctRecommended, monthlyIncome, maxHousing28, maxHousing36,
      conservativeHousing, chartData, totalInterest, needsPMI: recPMI > 0,
    };
  }, [annualIncome, monthlyDebt, downPayment, interestRate, loanTermYears, propertyTaxRate, insuranceRate, hoa, pmiRate]);

  const dtiStatus = results.recDTI <= 0.28 ? 'excellent' : results.recDTI <= 0.36 ? 'good' : 'high';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <Home className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Home Affordability Calculator</h1>
          <p className="text-muted-foreground text-sm">28/36 DTI rule — how much house can you actually afford?</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Income & Debts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Annual Gross Income ($)</Label>
                <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} className="h-9 mt-1" data-testid="ha-annual-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Monthly Debt Payments ($)</Label>
                <Input type="number" value={monthlyDebt} onChange={e => setMonthlyDebt(+e.target.value)} className="h-9 mt-1" data-testid="ha-monthly-debt" />
                <p className="text-xs text-muted-foreground mt-1">Car, student loans, credit cards</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Down Payment ($)</Label>
                <Input type="number" value={downPayment} onChange={e => setDownPayment(+e.target.value)} className="h-9 mt-1" data-testid="ha-down-payment" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Loan Terms</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Interest Rate</Label>
                  <span className="text-xs font-medium text-primary">{interestRate}%</span>
                </div>
                <Slider value={[interestRate]} onValueChange={([v]) => setInterestRate(v)} min={2} max={12} step={0.125} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Loan Term</Label>
                <div className="flex gap-2 mt-1">
                  {[15, 20, 30].map(y => (
                    <button key={y} onClick={() => setLoanTermYears(y)}
                      className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${loanTermYears === y ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                      {y}yr
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Property Tax Rate (%/yr)</Label>
                <Input type="number" value={propertyTaxRate} onChange={e => setPropertyTaxRate(+e.target.value)} className="h-9 mt-1" step={0.1} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">HOA Monthly ($)</Label>
                <Input type="number" value={hoa} onChange={e => setHoa(+e.target.value)} className="h-9 mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Max Home Price</p>
                <p className="text-4xl font-bold text-emerald-500" data-testid="ha-max-price">{fmt(results.maxHomeConservative)}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on 28/36 rule (conservative)</p>
                <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-0 text-xs">Recommended</Badge>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Monthly Payment (PITI)</p>
                <p className="text-4xl font-bold text-blue-500">{fmt(results.recMonthly)}</p>
                <p className="text-xs text-muted-foreground mt-1">At max recommended price</p>
                <Badge className={`mt-2 text-xs ${dtiStatus === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' : dtiStatus === 'good' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'} border-0`}>
                  DTI: {(results.recDTI * 100).toFixed(1)}%
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Loan Amount', value: fmt(results.recLoan), color: 'foreground' },
              { label: 'Down Payment %', value: `${(results.downPctRecommended * 100).toFixed(1)}%`, color: results.downPctRecommended >= 0.20 ? 'emerald-500' : 'amber-500' },
              { label: 'Total Interest', value: fmt(results.totalInterest), color: 'red-500' },
              { label: 'PMI', value: results.needsPMI ? `${fmt(results.recPMI)}/mo` : 'None', color: results.needsPMI ? 'amber-500' : 'emerald-500' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl border bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`font-bold text-${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Monthly Payment Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={results.chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tickFormatter={v => `$${v}`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={(v) => [fmt(v)]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {results.chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-2">The 28% Rule</p>
                <p className="text-xs text-muted-foreground">Your housing costs (PITI) should not exceed <span className="font-medium text-blue-500">{fmt(results.maxHousing28)}/month</span> — 28% of your gross monthly income of {fmt(results.monthlyIncome)}.</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-2">The 36% Rule</p>
                <p className="text-xs text-muted-foreground">Total monthly debt (housing + all debts) should stay under <span className="font-medium text-emerald-500">{fmt(results.monthlyIncome * 0.36)}/month</span>. With your current debts, max housing is {fmt(results.maxHousing36)}.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
