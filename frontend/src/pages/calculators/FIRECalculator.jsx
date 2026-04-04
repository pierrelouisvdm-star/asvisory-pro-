import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Flame, Target, TrendingUp, PiggyBank, Zap, DollarSign, Clock, CheckCircle2, Info, Share2, Twitter, Copy, X } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount);

const FIRE_VARIANTS = [
  { id: 'lean', label: 'Lean FIRE', multiplier: 25, expenseRatio: 0.6, color: '#f59e0b', desc: 'Frugal lifestyle, lower expenses' },
  { id: 'regular', label: 'Regular FIRE', multiplier: 25, expenseRatio: 1.0, color: '#6366f1', desc: 'Comfortable, maintain current lifestyle' },
  { id: 'fat', label: 'Fat FIRE', multiplier: 25, expenseRatio: 1.5, color: '#10b981', desc: 'Luxury lifestyle, more flexibility' },
  { id: 'barista', label: 'Barista FIRE', multiplier: 25, expenseRatio: 0.5, color: '#f97316', desc: 'Part-time work covers some expenses' },
];

const calcYearsToFIRE = (currentSavings, annualSavings, returnRate, fireNumber) => {
  if (annualSavings <= 0 && currentSavings >= fireNumber) return 0;
  if (annualSavings <= 0) return Infinity;
  const r = returnRate / 100;
  if (r === 0) return Math.max(0, (fireNumber - currentSavings) / annualSavings);
  // S(1+r)^n + A((1+r)^n - 1)/r = F  =>  (1+r)^n = (F*r + A) / (S*r + A)
  const num = fireNumber * r + annualSavings;
  const den = currentSavings * r + annualSavings;
  if (den <= 0 || num / den <= 0) return Infinity;
  return Math.log(num / den) / Math.log(1 + r);
};

const calcCoastFIRE = (fireNumber, currentAge, retirementAge, returnRate) => {
  const yearsToGrow = retirementAge - currentAge;
  return fireNumber / Math.pow(1 + returnRate / 100, yearsToGrow);
};

const buildChartData = (currentSavings, annualSavings, returnRate, fireNumber, maxYears) => {
  const r = returnRate / 100;
  const data = [];
  let balance = currentSavings;
  for (let year = 0; year <= Math.min(maxYears, 60); year++) {
    data.push({
      year,
      balance: Math.round(balance),
      fireNumber: Math.round(fireNumber),
    });
    if (balance >= fireNumber * 2.5) break;
    balance = balance * (1 + r) + annualSavings;
  }
  return data;
};

export default function FIRECalculator() {
  const [currentAge, setCurrentAge] = useState(30);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [annualIncome, setAnnualIncome] = useState(80000);
  const [annualExpenses, setAnnualExpenses] = useState(48000);
  const [returnRate, setReturnRate] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);
  const [retirementAge, setRetirementAge] = useState(65);
  const [activeVariant, setActiveVariant] = useState('regular');
  const [showShare, setShowShare] = useState(false);

  const annualSavings = annualIncome - annualExpenses;
  const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;

  const results = useMemo(() => {
    const realReturn = ((1 + returnRate / 100) / (1 + inflationRate / 100) - 1) * 100;
    return FIRE_VARIANTS.map(variant => {
      const adjustedExpenses = annualExpenses * variant.expenseRatio;
      const fireNumber = adjustedExpenses * variant.multiplier;
      const years = calcYearsToFIRE(currentSavings, annualSavings, realReturn, fireNumber);
      const fireAge = currentAge + Math.ceil(years);
      const coastFIRE = calcCoastFIRE(fireNumber, currentAge, retirementAge, realReturn);
      const monthlyNeeded = fireNumber / variant.multiplier / 12;
      return {
        ...variant,
        adjustedExpenses,
        fireNumber,
        years: isFinite(years) ? Math.ceil(years) : null,
        fireAge: isFinite(years) ? fireAge : null,
        coastFIRE,
        monthlyNeeded,
      };
    });
  }, [currentAge, currentSavings, annualIncome, annualExpenses, returnRate, inflationRate, retirementAge]);

  const activeResult = results.find(r => r.id === activeVariant);
  const chartData = activeResult
    ? buildChartData(currentSavings, annualSavings, returnRate - inflationRate, activeResult.fireNumber, activeResult.years || 60)
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
          <p className="font-medium text-foreground mb-1">Year {label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
          <Flame className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">FIRE Calculator</h1>
          <p className="text-muted-foreground text-sm">Financial Independence, Retire Early — find your number</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Age</Label>
                  <Input type="number" value={currentAge} onChange={e => setCurrentAge(+e.target.value)} className="h-9 mt-1" data-testid="fire-current-age" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Retirement Age</Label>
                  <Input type="number" value={retirementAge} onChange={e => setRetirementAge(+e.target.value)} className="h-9 mt-1" data-testid="fire-retirement-age" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Current Savings / Investments ($)</Label>
                <Input type="number" value={currentSavings} onChange={e => setCurrentSavings(+e.target.value)} className="h-9 mt-1" data-testid="fire-current-savings" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual Income ($)</Label>
                <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} className="h-9 mt-1" data-testid="fire-annual-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual Expenses ($)</Label>
                <Input type="number" value={annualExpenses} onChange={e => setAnnualExpenses(+e.target.value)} className="h-9 mt-1" data-testid="fire-annual-expenses" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Expected Return</Label>
                  <span className="text-xs font-medium text-primary">{returnRate}%</span>
                </div>
                <Slider value={[returnRate]} onValueChange={([v]) => setReturnRate(v)} min={3} max={12} step={0.5} data-testid="fire-return-rate" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Inflation Rate</Label>
                  <span className="text-xs font-medium text-muted-foreground">{inflationRate}%</span>
                </div>
                <Slider value={[inflationRate]} onValueChange={([v]) => setInflationRate(v)} min={1} max={6} step={0.5} />
              </div>

              {/* Savings Rate */}
              <div className={`p-3 rounded-lg border ${savingsRate >= 50 ? 'bg-emerald-500/10 border-emerald-500/30' : savingsRate >= 25 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
                <p className={`text-xl font-bold ${savingsRate >= 50 ? 'text-emerald-500' : savingsRate >= 25 ? 'text-blue-500' : 'text-amber-500'}`}>
                  {savingsRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">{formatCurrency(annualSavings)}/year saved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* FIRE Variant Cards */}
          <div className="grid grid-cols-2 gap-3">
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveVariant(r.id)}
                data-testid={`fire-variant-${r.id}`}
                className={`p-4 rounded-xl border text-left transition-all ${activeVariant === r.id ? 'border-2 shadow-md' : 'border hover:border-primary/40'}`}
                style={{ borderColor: activeVariant === r.id ? r.color : undefined, backgroundColor: activeVariant === r.id ? `${r.color}10` : undefined }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{r.label}</span>
                  {activeVariant === r.id && <CheckCircle2 className="h-4 w-4" style={{ color: r.color }} />}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{r.desc}</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(r.fireNumber)}</p>
                <p className="text-xs text-muted-foreground">FIRE Number</p>
                {r.years !== null ? (
                  <Badge className="mt-2 text-xs" style={{ backgroundColor: `${r.color}20`, color: r.color, border: `1px solid ${r.color}40` }}>
                    Age {r.fireAge} · {r.years}y
                  </Badge>
                ) : (
                  <Badge className="mt-2 text-xs bg-red-500/10 text-red-400 border-red-500/30">
                    Increase savings
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Main Result Card */}
          {activeResult && (
            <Card className="border-2" style={{ borderColor: `${activeResult.color}30` }}>
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(activeResult.fireNumber)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Your FIRE Number</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold" style={{ color: activeResult.color }}>
                      {activeResult.years !== null ? `${activeResult.years}y` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Years to FIRE</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">
                      {activeResult.fireAge !== null ? `Age ${activeResult.fireAge}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Retirement Age</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Monthly in Retirement</span>
                    <span className="font-medium text-foreground">{formatCurrency(activeResult.monthlyNeeded)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Coast FIRE Number</span>
                    <span className="font-medium text-foreground">{formatCurrency(activeResult.coastFIRE)}</span>
                  </div>
                </div>

                {/* Chart */}
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="year" tickFormatter={y => `Yr ${y}`} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="balance" name="Portfolio" stroke={activeResult.color} fill={`${activeResult.color}20`} strokeWidth={2} />
                    <Line type="monotone" dataKey="fireNumber" name="FIRE Number" stroke="#6b7280" strokeDasharray="6 3" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Educational Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Zap,
            title: 'The 4% Rule',
            color: 'orange',
            text: 'The 4% rule states you can safely withdraw 4% of your portfolio annually without running out of money over 30 years. That\'s why your FIRE Number = Annual Expenses × 25.',
          },
          {
            icon: TrendingUp,
            title: 'Savings Rate Matters Most',
            color: 'blue',
            text: 'Going from 10% to 50% savings rate reduces time to FIRE from 40+ years to under 17. Increasing your savings rate is the single biggest lever you can pull.',
          },
          {
            icon: PiggyBank,
            title: 'Coast FIRE',
            color: 'emerald',
            text: 'Coast FIRE is the amount you need today so that compound growth alone gets you to your FIRE Number by retirement — without saving another dollar.',
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className={`bg-${item.color}-500/5 border-${item.color}-500/20`}>
              <CardContent className="p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${item.color}-500/10 mb-3`}>
                  <Icon className={`h-4 w-4 text-${item.color}-500`} />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Disclaimer />
    </div>
  );
}
