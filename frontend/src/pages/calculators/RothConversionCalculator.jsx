import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { RefreshCw, TrendingUp, DollarSign, CheckCircle2, Clock, Info, PiggyBank } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const BRACKETS_2024 = {
  single: [
    { max: 11600, rate: 0.10 }, { max: 47150, rate: 0.12 }, { max: 100525, rate: 0.22 },
    { max: 191950, rate: 0.24 }, { max: 243725, rate: 0.32 }, { max: 609350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { max: 23200, rate: 0.10 }, { max: 94300, rate: 0.12 }, { max: 201050, rate: 0.22 },
    { max: 383900, rate: 0.24 }, { max: 487450, rate: 0.32 }, { max: 731200, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTIONS = { single: 14600, mfj: 29200, hoh: 21900 };

const calcTax = (taxableIncome, brackets) => {
  if (taxableIncome <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, b.max) - prev;
    tax += taxable * b.rate;
    prev = b.max;
  }
  return tax;
};

const getMarginalRate = (taxableIncome, filingStatus) => {
  const brackets = BRACKETS_2024[filingStatus] || BRACKETS_2024.single;
  for (const b of [...brackets].reverse()) {
    if (taxableIncome > (b.min || 0)) return b.rate;
  }
  return 0.12;
};

export default function RothConversionCalculator() {
  const [currentAge, setCurrentAge] = useState(45);
  const [retirementAge, setRetirementAge] = useState(65);
  const [traditionalBalance, setTraditionalBalance] = useState(250000);
  const [conversionAmount, setConversionAmount] = useState(50000);
  const [otherIncome, setOtherIncome] = useState(80000);
  const [currentGrowthRate, setCurrentGrowthRate] = useState(7);
  const [futureExpectedRate, setFutureExpectedRate] = useState(7);
  const [filingStatus, setFilingStatus] = useState('single');
  const [expectedRetirementRate, setExpectedRetirementRate] = useState(22);

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const brackets = BRACKETS_2024[filingStatus] || BRACKETS_2024.single;
  const stdDed = STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single;
  const taxableNow = Math.max(0, otherIncome + conversionAmount - stdDed);
  const taxWithoutConversion = calcTax(Math.max(0, otherIncome - stdDed), brackets);
  const taxWithConversion = calcTax(taxableNow, brackets);
  const conversionTaxCost = taxWithConversion - taxWithoutConversion;
  const marginalRateNow = getMarginalRate(taxableNow, filingStatus);
  const effectiveRateOnConversion = conversionAmount > 0 ? conversionTaxCost / conversionAmount : 0;

  const results = useMemo(() => {
    const r = currentGrowthRate / 100;
    const remaining = traditionalBalance - conversionAmount;

    // Roth path: pay tax now, grows tax-free
    const rothFutureValue = conversionAmount * Math.pow(1 + r, yearsToRetirement);
    // Net out-of-pocket cost today
    const conversionTaxCostFinal = conversionTaxCost;

    // Traditional path: no tax now, grows tax-deferred, taxed at withdrawal
    const traditionalFutureValue = conversionAmount * Math.pow(1 + r, yearsToRetirement);
    const taxAtRetirement = traditionalFutureValue * (expectedRetirementRate / 100);
    const traditionalAfterTax = traditionalFutureValue - taxAtRetirement;

    const rothAdvantage = rothFutureValue - traditionalAfterTax;
    const breakEvenYears = conversionTaxCost > 0 && rothAdvantage > 0
      ? Math.log(1 + conversionTaxCost / (conversionAmount * (expectedRetirementRate / 100 - effectiveRateOnConversion))) / Math.log(1 + r)
      : null;

    // Chart: year by year comparison
    const chartData = [];
    let rothBal = conversionAmount;
    let tradBal = conversionAmount;
    for (let yr = 0; yr <= yearsToRetirement; yr++) {
      const tradAfterTax = tradBal * (1 - expectedRetirementRate / 100);
      chartData.push({
        year: yr,
        age: currentAge + yr,
        roth: Math.round(rothBal),
        traditional: Math.round(tradAfterTax),
        advantage: Math.round(rothBal - tradAfterTax),
      });
      rothBal *= (1 + r);
      tradBal *= (1 + r);
    }

    return {
      rothFutureValue,
      traditionalFutureValue,
      traditionalAfterTax,
      taxAtRetirement,
      rothAdvantage,
      breakEvenYears,
      chartData,
      convertWorthIt: rothAdvantage > 0,
    };
  }, [currentAge, retirementAge, traditionalBalance, conversionAmount, currentGrowthRate, expectedRetirementRate, filingStatus, otherIncome]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <RefreshCw className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Roth Conversion Analyzer</h1>
          <p className="text-muted-foreground text-sm">Should you convert your Traditional IRA to Roth? See the break-even analysis.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversion Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Age</Label>
                  <Input type="number" value={currentAge} onChange={e => setCurrentAge(+e.target.value)} className="h-9 mt-1" data-testid="roth-current-age" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Retirement Age</Label>
                  <Input type="number" value={retirementAge} onChange={e => setRetirementAge(+e.target.value)} className="h-9 mt-1" data-testid="roth-retirement-age" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Traditional IRA/401k Balance ($)</Label>
                <Input type="number" value={traditionalBalance} onChange={e => setTraditionalBalance(+e.target.value)} className="h-9 mt-1" data-testid="roth-trad-balance" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Conversion Amount This Year ($)</Label>
                <Input type="number" value={conversionAmount} onChange={e => setConversionAmount(+e.target.value)} className="h-9 mt-1" data-testid="roth-conversion-amount" />
                <p className="text-xs text-muted-foreground mt-1">Consider converting up to top of your current bracket</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Other Income This Year ($)</Label>
                <Input type="number" value={otherIncome} onChange={e => setOtherIncome(+e.target.value)} className="h-9 mt-1" />
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Annual Growth Rate</Label>
                  <span className="text-xs font-medium text-primary">{currentGrowthRate}%</span>
                </div>
                <Slider value={[currentGrowthRate]} onValueChange={([v]) => setCurrentGrowthRate(v)} min={3} max={12} step={0.5} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Expected Tax Rate in Retirement</Label>
                  <span className="text-xs font-medium text-amber-500">{expectedRetirementRate}%</span>
                </div>
                <Slider value={[expectedRetirementRate]} onValueChange={([v]) => setExpectedRetirementRate(v)} min={10} max={37} step={1} data-testid="roth-future-rate" />
                <p className="text-xs text-muted-foreground mt-1">Higher future rate → Roth conversion makes more sense</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Decision Banner */}
          <Card className={results.convertWorthIt ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}>
            <CardContent className="p-4 flex items-center gap-3">
              {results.convertWorthIt ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {results.convertWorthIt
                    ? `Roth conversion looks favorable — ${fmt(Math.abs(results.rothAdvantage))} ahead at retirement`
                    : `Roth conversion may not be optimal at your expected future tax rate`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Current marginal rate: {(marginalRateNow * 100).toFixed(0)}% · Future expected: {expectedRetirementRate}%
                  {results.breakEvenYears !== null && ` · Break-even: ~${Math.round(results.breakEvenYears)} years`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tax Cost Now', value: fmt(conversionTaxCost), color: 'red', sub: `${(effectiveRateOnConversion * 100).toFixed(1)}% effective on conversion` },
              { label: 'Roth at Retirement', value: fmt(results.rothFutureValue), color: 'emerald', sub: 'Tax-free' },
              { label: 'Trad (after-tax)', value: fmt(results.traditionalAfterTax), color: 'blue', sub: `After ${expectedRetirementRate}% withdrawal tax` },
              { label: 'Roth Advantage', value: fmt(results.rothAdvantage), color: results.rothAdvantage > 0 ? 'emerald' : 'amber', sub: 'At retirement' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold text-${item.color}-500`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Roth vs Traditional (After-Tax) Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="age" tickFormatter={a => `Age ${a}`} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v)]} labelFormatter={l => `Age ${l}`} />
                  <Legend />
                  <Area type="monotone" dataKey="roth" name="Roth (tax-free)" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
                  <Area type="monotone" dataKey="traditional" name="Traditional (after-tax)" stroke="#6366f1" fill="#6366f120" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Strategy Tips */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-foreground mb-2">Optimal Conversion Strategy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The best time to convert is during low-income years (gap years, early retirement) when your marginal rate is lower than your expected retirement rate.
                  Consider converting up to the top of your current bracket each year rather than all at once.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-foreground mb-2">RMD Reduction Benefit</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Roth IRAs have no required minimum distributions (RMDs). Converting before age 73 reduces your future RMD burden,
                  potentially keeping you in a lower bracket and reducing Social Security taxation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
