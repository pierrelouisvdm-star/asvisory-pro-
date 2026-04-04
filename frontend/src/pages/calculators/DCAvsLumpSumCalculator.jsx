import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, BarChart3, CheckCircle2, Info, Clock } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export default function DCAvsLumpSumCalculator() {
  const [totalAmount, setTotalAmount] = useState(60000);
  const [dcaMonths, setDcaMonths] = useState(12);
  const [annualReturn, setAnnualReturn] = useState(10);
  const [annualVolatility, setAnnualVolatility] = useState(15);
  const [investmentPeriodYears, setInvestmentPeriodYears] = useState(20);

  const results = useMemo(() => {
    const monthlyReturn = annualReturn / 100 / 12;
    const monthlyVolatility = annualVolatility / 100 / Math.sqrt(12);
    const monthlyDCA = totalAmount / dcaMonths;
    const totalMonths = investmentPeriodYears * 12;

    // Lump sum: invested today
    const lumpSumFinal = totalAmount * Math.pow(1 + annualReturn / 100, investmentPeriodYears);

    // DCA: invest monthly over dcaMonths, then let it grow for remaining years
    let dcaFinalDeterministic = 0;
    for (let m = 0; m < dcaMonths; m++) {
      const monthsRemaining = totalMonths - m;
      dcaFinalDeterministic += monthlyDCA * Math.pow(1 + monthlyReturn, monthsRemaining);
    }
    // Cash drag: uninvested amount earns 0 while being held (or a savings rate)
    const cashDragLoss = lumpSumFinal - dcaFinalDeterministic;
    const cashDragPct = lumpSumFinal > 0 ? cashDragLoss / lumpSumFinal : 0;

    // Build year-by-year chart data
    const chartData = [];
    for (let yr = 0; yr <= investmentPeriodYears; yr++) {
      const lumpSum = totalAmount * Math.pow(1 + annualReturn / 100, yr);
      let dca = 0;
      const months = yr * 12;
      for (let m = 0; m < Math.min(dcaMonths, months); m++) {
        const monthsHeld = months - m;
        dca += monthlyDCA * Math.pow(1 + monthlyReturn, monthsHeld);
      }
      chartData.push({ year: yr, lumpSum: Math.round(lumpSum), dca: Math.round(dca) });
    }

    // Historical context: DCA wins in down markets, lump sum wins 2/3 of time (per Vanguard research)
    // Risk analysis: DCA reduces variance
    const dcaVarianceReduction = (1 - 1 / dcaMonths) * annualVolatility;
    const lumpSumStdDev = totalAmount * annualVolatility / 100 * Math.sqrt(investmentPeriodYears);
    const dcaStdDev = lumpSumStdDev * (1 - dcaVarianceReduction / 100);

    return {
      lumpSumFinal, dcaFinalDeterministic, cashDragLoss, cashDragPct,
      chartData, lumpSumStdDev, dcaStdDev,
      lumpSumWins: lumpSumFinal > dcaFinalDeterministic,
    };
  }, [totalAmount, dcaMonths, annualReturn, annualVolatility, investmentPeriodYears]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
          <BarChart3 className="h-6 w-6 text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">DCA vs. Lump Sum Calculator</h1>
          <p className="text-muted-foreground text-sm">Dollar-Cost Averaging vs. Investing All At Once — the numbers behind the debate</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Investment Parameters</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Total Amount to Invest ($)</Label>
                <Input type="number" value={totalAmount} onChange={e => setTotalAmount(+e.target.value)} className="h-9 mt-1" data-testid="dca-total-amount" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">DCA Period (months)</Label>
                  <span className="text-xs font-medium text-cyan-500">{dcaMonths} months</span>
                </div>
                <Slider value={[dcaMonths]} onValueChange={([v]) => setDcaMonths(v)} min={1} max={24} step={1} data-testid="dca-period" />
                <p className="text-xs text-muted-foreground mt-1">{fmt(totalAmount / dcaMonths)}/month</p>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Expected Annual Return</Label>
                  <span className="text-xs font-medium text-primary">{annualReturn}%</span>
                </div>
                <Slider value={[annualReturn]} onValueChange={([v]) => setAnnualReturn(v)} min={3} max={15} step={0.5} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Annual Volatility (Std Dev)</Label>
                  <span className="text-xs font-medium text-amber-500">{annualVolatility}%</span>
                </div>
                <Slider value={[annualVolatility]} onValueChange={([v]) => setAnnualVolatility(v)} min={5} max={40} step={1} />
                <p className="text-xs text-muted-foreground mt-1">S&amp;P 500 historical: ~15-20%</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Investment Period (years)</Label>
                <Input type="number" value={investmentPeriodYears} onChange={e => setInvestmentPeriodYears(+e.target.value)} className="h-9 mt-1" min={1} max={50} />
              </div>
            </CardContent>
          </Card>

          <Card className={results.lumpSumWins ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-blue-500/5 border-blue-500/30'}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground mb-2">
                {results.lumpSumWins ? 'Lump Sum wins in this scenario' : 'DCA is more efficient here'}
              </p>
              <p className="text-xs text-muted-foreground">
                {results.lumpSumWins
                  ? `Lump sum outperforms by ${fmt(results.cashDragLoss)} over ${investmentPeriodYears} years. Each month of DCA delays full market exposure.`
                  : 'In declining or volatile markets, DCA reduces the risk of investing at a peak.'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Lump Sum Final', value: fmt(results.lumpSumFinal), color: 'emerald' },
              { label: `DCA Final (${dcaMonths}mo)`, value: fmt(results.dcaFinalDeterministic), color: 'blue' },
              { label: 'DCA Cash Drag', value: fmt(results.cashDragLoss), color: 'amber' },
              { label: 'Drag %', value: `${(results.cashDragPct * 100).toFixed(1)}%`, color: 'red' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-base font-bold text-${item.color}-500`}>{item.value}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Portfolio Growth Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="year" tickFormatter={y => `Yr ${y}`} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v)]} labelFormatter={l => `Year ${l}`} />
                  <Legend />
                  <Area type="monotone" dataKey="lumpSum" name="Lump Sum" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
                  <Area type="monotone" dataKey="dca" name={`DCA (${dcaMonths} months)`} stroke="#6366f1" fill="#6366f120" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-foreground mb-2">When Lump Sum Wins</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  In ~66% of historical periods, investing all at once beats DCA because markets trend upward over time.
                  The opportunity cost of holding cash is real — every month uninvested is a month missing returns.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-foreground mb-2">When DCA Wins</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  In volatile or declining markets, DCA lowers your average cost. It also reduces psychological risk —
                  you won't regret timing a market top. DCA is often the right choice for behavioral reasons.
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
