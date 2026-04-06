import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, TrendingUp, DollarSign, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtPct = (r) => `${(r).toFixed(2)}%`;

// I-Bonds: composite rate = fixed rate + 2 × inflation rate (CPI-U)
// HYSA, T-Bills, CDs: user-inputable current rates

const SAVINGS_TYPES = [
  {
    id: 'ibond',
    name: 'I-Bond',
    color: '#10b981',
    description: 'Inflation-protected, government-backed. Interest defers until redemption. No state/local tax.',
    defaultRate: 4.28,
    taxTreatment: 'federal_deferred',
    notes: ['Max $10k/person/year purchase', 'Must hold 1yr min', '3-month penalty if redeem <5yr', 'No state/local tax'],
  },
  {
    id: 'hysa',
    name: 'High-Yield Savings',
    color: '#6366f1',
    description: 'Online bank savings accounts, FDIC insured, fully liquid.',
    defaultRate: 4.80,
    taxTreatment: 'fully_taxable',
    notes: ['Fully liquid', 'FDIC insured up to $250k', 'Rate can change anytime', 'All interest ordinary income'],
  },
  {
    id: 'tbill_6mo',
    name: '6-Month T-Bill',
    color: '#f59e0b',
    description: 'Short-term US government bill, state/local tax exempt.',
    defaultRate: 5.10,
    taxTreatment: 'federal_no_state',
    notes: ['State/local tax exempt', 'Liquid at maturity', 'Auto-rolls available', 'Sold at discount'],
  },
  {
    id: 'tbill_1yr',
    name: '1-Year T-Bill',
    color: '#f97316',
    description: 'US Treasury bill maturing in 1 year, state/local tax exempt.',
    defaultRate: 4.80,
    taxTreatment: 'federal_no_state',
    notes: ['State/local tax exempt', 'Higher yield than 6mo (usually)', '1 year lock-up', 'TreasuryDirect.gov'],
  },
  {
    id: 'cd_1yr',
    name: '1-Year CD',
    color: '#8b5cf6',
    description: 'Bank certificate of deposit, FDIC insured.',
    defaultRate: 4.75,
    taxTreatment: 'fully_taxable',
    notes: ['FDIC insured', 'Early withdrawal penalty', 'Rate guaranteed', 'Shop for best rates at bankrate.com'],
  },
  {
    id: 'money_market',
    name: 'Money Market Fund',
    color: '#06b6d4',
    description: 'Near-cash fund investing in short-term government/corporate debt.',
    defaultRate: 5.00,
    taxTreatment: 'partially_state_exempt',
    notes: ['Highly liquid', 'Usually state-tax exempt if govt MMF', 'Not FDIC insured', 'SEC-regulated'],
  },
];

export default function SavingsComparisonCalculator() {
  const [investmentAmount, setInvestmentAmount] = useState(50000);
  const [timeHorizonYears, setTimeHorizonYears] = useState(3);
  const [federalTaxRate, setFederalTaxRate] = useState(22);
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const [rates, setRates] = useState(
    Object.fromEntries(SAVINGS_TYPES.map(t => [t.id, t.defaultRate]))
  );

  const updateRate = (id, val) => setRates(prev => ({ ...prev, [id]: val }));

  const results = useMemo(() => {
    return SAVINGS_TYPES.map(type => {
      const rate = rates[type.id] / 100;
      const fedRate = federalTaxRate / 100;
      const stateRate = stateTaxRate / 100;

      let afterTaxRate;
      switch (type.taxTreatment) {
        case 'fully_taxable':
          afterTaxRate = rate * (1 - fedRate - stateRate);
          break;
        case 'federal_no_state':
          afterTaxRate = rate * (1 - fedRate);
          break;
        case 'federal_deferred':
          // I-Bond: defer tax, then pay federal at redemption
          afterTaxRate = rate * (1 - fedRate); // Simplified: same effective rate but deferred
          break;
        case 'partially_state_exempt':
          afterTaxRate = rate * (1 - fedRate - stateRate * 0.3); // ~30% state taxable
          break;
        default:
          afterTaxRate = rate * (1 - fedRate - stateRate);
      }

      const grossFinal = investmentAmount * Math.pow(1 + rate, timeHorizonYears);
      const afterTaxFinal = investmentAmount * Math.pow(1 + afterTaxRate, timeHorizonYears);
      const grossInterest = grossFinal - investmentAmount;
      const afterTaxInterest = afterTaxFinal - investmentAmount;
      const taxPaid = grossInterest - afterTaxInterest;

      // Year by year data
      const yearData = [];
      for (let yr = 1; yr <= Math.min(timeHorizonYears, 10); yr++) {
        yearData.push({
          year: yr,
          value: Math.round(investmentAmount * Math.pow(1 + afterTaxRate, yr)),
        });
      }

      return {
        ...type,
        rate: rates[type.id],
        afterTaxRate: afterTaxRate * 100,
        grossFinal, afterTaxFinal, grossInterest, afterTaxInterest, taxPaid, yearData,
      };
    }).sort((a, b) => b.afterTaxFinal - a.afterTaxFinal);
  }, [investmentAmount, timeHorizonYears, federalTaxRate, stateTaxRate, rates]);

  const bestOption = results[0];

  // Chart: compare after-tax final value
  const comparisonChart = results.map(r => ({
    name: r.name,
    afterTaxValue: Math.round(r.afterTaxFinal),
    interest: Math.round(r.afterTaxInterest),
    color: r.color,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
          <BarChart3 className="h-6 w-6 text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Savings Vehicle Comparison</h1>
          <p className="text-muted-foreground text-sm">I-Bonds vs HYSA vs T-Bills vs CDs, after-tax returns with current rates</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Your Parameters</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Investment Amount ($)</Label>
                <Input type="number" value={investmentAmount} onChange={e => setInvestmentAmount(+e.target.value)} className="h-9 mt-1" data-testid="sc-amount" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Time Horizon</Label>
                  <span className="text-xs font-medium text-primary">{timeHorizonYears} years</span>
                </div>
                <Slider value={[timeHorizonYears]} onValueChange={([v]) => setTimeHorizonYears(v)} min={1} max={10} step={1} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Federal Tax Rate (%)</Label>
                <Input type="number" value={federalTaxRate} onChange={e => setFederalTaxRate(+e.target.value)} className="h-9 mt-1" step={1} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State Tax Rate (%)</Label>
                <Input type="number" value={stateTaxRate} onChange={e => setStateTaxRate(+e.target.value)} className="h-9 mt-1" step={0.1} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Current Rates (Editable)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {SAVINGS_TYPES.map(type => (
                <div key={type.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />
                  <Label className="text-xs text-muted-foreground flex-1">{type.name}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={rates[type.id]}
                      onChange={e => updateRate(type.id, +e.target.value)}
                      className="h-8 w-20 text-xs"
                      step={0.1}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Best After-Tax Return: {bestOption.name}</p>
                <p className="text-xs text-muted-foreground">{fmtPct(bestOption.afterTaxRate)} after-tax yield · {timeHorizonYears}-year horizon</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-500">{fmt(bestOption.afterTaxFinal)}</p>
                <p className="text-xs text-muted-foreground">{fmt(bestOption.afterTaxInterest)} interest earned</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">After-Tax Final Value Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v)]} />
                  <Bar dataKey="afterTaxValue" name="After-Tax Value" radius={[4, 4, 0, 0]}>
                    {comparisonChart.map((entry, i) => (
                      <Cell key={i} fill={results[i]?.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {results.map((r, i) => (
              <div key={r.id} className={`p-4 rounded-xl border ${i === 0 ? 'border-2' : 'border'}`} style={{ borderColor: i === 0 ? r.color : undefined }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0">Best</Badge>}
                    <span className="font-semibold text-foreground text-sm">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{fmtPct(r.rate)} gross · {fmtPct(r.afterTaxRate)} after-tax</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-foreground text-sm">{fmt(r.afterTaxFinal)}</p>
                    <p className="text-xs text-muted-foreground">+{fmt(r.afterTaxInterest)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.notes.map((note, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{note}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
