import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Zap, DollarSign, TrendingUp, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

const FED_BRACKETS_SINGLE = [
  { max: 11600, rate: 0.10 }, { max: 47150, rate: 0.12 }, { max: 100525, rate: 0.22 },
  { max: 191950, rate: 0.24 }, { max: 243725, rate: 0.32 }, { max: 609350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
];
const FED_BRACKETS_MFJ = [
  { max: 23200, rate: 0.10 }, { max: 94300, rate: 0.12 }, { max: 201050, rate: 0.22 },
  { max: 383900, rate: 0.24 }, { max: 487450, rate: 0.32 }, { max: 731200, rate: 0.35 }, { max: Infinity, rate: 0.37 },
];
const LTCG_BRACKETS_SINGLE = [
  { max: 47025, rate: 0.00 }, { max: 518900, rate: 0.15 }, { max: Infinity, rate: 0.20 },
];
const LTCG_BRACKETS_MFJ = [
  { max: 94050, rate: 0.00 }, { max: 583750, rate: 0.15 }, { max: Infinity, rate: 0.20 },
];
const STD_DED = { single: 14600, mfj: 29200 };

const calcProgressiveTax = (income, brackets) => {
  if (income <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (income <= prev) break;
    tax += (Math.min(income, b.max) - prev) * b.rate;
    prev = b.max;
  }
  return tax;
};

const getLTCGRate = (taxableIncome, filingStatus) => {
  const brackets = filingStatus === 'mfj' ? LTCG_BRACKETS_MFJ : LTCG_BRACKETS_SINGLE;
  for (const b of brackets) {
    if (taxableIncome <= b.max) return b.rate;
  }
  return 0.20;
};

export default function RSUCalculator() {
  const [rsuType, setRsuType] = useState('rsu'); // rsu | nso | iso
  const [sharesVesting, setSharesVesting] = useState(1000);
  const [grantPrice, setGrantPrice] = useState(50);
  const [vestPrice, setVestPrice] = useState(120);
  const [salePrice, setSalePrice] = useState(150);
  const [otherIncome, setOtherIncome] = useState(130000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [holdingPeriod, setHoldingPeriod] = useState('long'); // short | long
  const [stateRate, setStateRate] = useState(9.3);
  const [additionalVestYears, setAdditionalVestYears] = useState(4);
  const [sharesPerYear, setSharesPerYear] = useState(250);

  const results = useMemo(() => {
    const fedBrackets = filingStatus === 'mfj' ? FED_BRACKETS_MFJ : FED_BRACKETS_SINGLE;
    const stdDed = STD_DED[filingStatus] || STD_DED.single;

    let ordinaryIncomeAtVest = 0;
    let capitalGainAtSale = 0;
    let specialNote = '';

    if (rsuType === 'rsu') {
      // RSUs: FMV at vest = ordinary income
      ordinaryIncomeAtVest = sharesVesting * vestPrice;
      capitalGainAtSale = sharesVesting * (salePrice - vestPrice);
    } else if (rsuType === 'nso') {
      // NSOs: Spread at exercise = ordinary income
      ordinaryIncomeAtVest = sharesVesting * (vestPrice - grantPrice);
      capitalGainAtSale = sharesVesting * (salePrice - vestPrice);
    } else if (rsuType === 'iso') {
      // ISOs: No ordinary income at exercise (but AMT preference!)
      ordinaryIncomeAtVest = 0;
      capitalGainAtSale = sharesVesting * (salePrice - grantPrice);
      specialNote = 'ISOs: No ordinary income at exercise, but the spread may trigger AMT. All gain taxed as capital gain if holding period met.';
    }

    const totalIncome = otherIncome + ordinaryIncomeAtVest;
    const taxableOrdinary = Math.max(0, totalIncome - stdDed);
    const taxWithVest = calcProgressiveTax(taxableOrdinary, fedBrackets);
    const taxWithoutVest = calcProgressiveTax(Math.max(0, otherIncome - stdDed), fedBrackets);
    const federalOrdinaryTax = taxWithVest - taxWithoutVest;

    // Capital gains
    const cgIncome = totalIncome + Math.max(0, capitalGainAtSale);
    const ltcgRate = holdingPeriod === 'long' ? getLTCGRate(cgIncome - stdDed, filingStatus) : null;
    const federalCGTax = holdingPeriod === 'long'
      ? Math.max(0, capitalGainAtSale) * (ltcgRate || 0)
      : calcProgressiveTax(Math.max(0, cgIncome - stdDed), fedBrackets) - taxWithVest;

    // State
    const stateTaxOnOrdinary = ordinaryIncomeAtVest * (stateRate / 100);
    const stateTaxOnCG = Math.max(0, capitalGainAtSale) * (stateRate / 100);

    // NIIT 3.8% on cap gains if over threshold
    const niitThreshold = filingStatus === 'mfj' ? 250000 : 200000;
    const niit = cgIncome > niitThreshold ? Math.max(0, capitalGainAtSale) * 0.038 : 0;

    const totalTaxAtVest = federalOrdinaryTax + stateTaxOnOrdinary;
    const totalTaxAtSale = federalCGTax + stateTaxOnCG + niit;
    const totalTax = totalTaxAtVest + totalTaxAtSale;
    const grossProceeds = sharesVesting * salePrice;
    const netProceeds = grossProceeds - totalTax;
    const effectiveRate = grossProceeds > 0 ? totalTax / grossProceeds : 0;

    // Vesting schedule
    const vestingSchedule = [];
    for (let yr = 1; yr <= additionalVestYears; yr++) {
      const grossAtVest = sharesPerYear * vestPrice;
      const taxAtVest = grossAtVest * 0.35; // estimated
      vestingSchedule.push({ year: `Year ${yr}`, shares: sharesPerYear, gross: Math.round(grossAtVest), estimated_tax: Math.round(taxAtVest), net: Math.round(grossAtVest - taxAtVest) });
    }

    const pieData = [
      { name: 'Federal Ordinary Tax', value: Math.round(federalOrdinaryTax), color: '#6366f1' },
      { name: 'Federal Cap Gains Tax', value: Math.round(federalCGTax), color: '#f59e0b' },
      { name: 'State Tax', value: Math.round(stateTaxOnOrdinary + stateTaxOnCG), color: '#f97316' },
      { name: 'NIIT', value: Math.round(niit), color: '#ef4444' },
      { name: 'Net Proceeds', value: Math.round(netProceeds), color: '#10b981' },
    ].filter(d => d.value > 0);

    return {
      ordinaryIncomeAtVest, capitalGainAtSale, federalOrdinaryTax, federalCGTax,
      stateTaxOnOrdinary, stateTaxOnCG, niit, totalTaxAtVest, totalTaxAtSale, totalTax,
      grossProceeds, netProceeds, effectiveRate, ltcgRate, specialNote, pieData, vestingSchedule,
    };
  }, [rsuType, sharesVesting, grantPrice, vestPrice, salePrice, otherIncome, filingStatus, holdingPeriod, stateRate, additionalVestYears, sharesPerYear]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
          <Zap className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">RSU & Stock Options Tax Calculator</h1>
          <p className="text-muted-foreground text-sm">RSUs, NSOs, and ISOs — understand your true tax bill at vest and sale</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Grant Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Grant Type</Label>
                <Select value={rsuType} onValueChange={setRsuType}>
                  <SelectTrigger className="h-9 mt-1" data-testid="rsu-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsu">RSU (Restricted Stock Unit)</SelectItem>
                    <SelectItem value="nso">NSO (Non-Qualified Stock Option)</SelectItem>
                    <SelectItem value="iso">ISO (Incentive Stock Option)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Shares Vesting / Exercising</Label>
                <Input type="number" value={sharesVesting} onChange={e => setSharesVesting(+e.target.value)} className="h-9 mt-1" data-testid="rsu-shares" />
              </div>
              {rsuType !== 'rsu' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Grant / Strike Price ($)</Label>
                  <Input type="number" value={grantPrice} onChange={e => setGrantPrice(+e.target.value)} className="h-9 mt-1" />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">FMV at Vest / Exercise ($)</Label>
                <Input type="number" value={vestPrice} onChange={e => setVestPrice(+e.target.value)} className="h-9 mt-1" data-testid="rsu-vest-price" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sale Price ($)</Label>
                <Input type="number" value={salePrice} onChange={e => setSalePrice(+e.target.value)} className="h-9 mt-1" data-testid="rsu-sale-price" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Holding Period After Vest</Label>
                <Select value={holdingPeriod} onValueChange={setHoldingPeriod}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long-term (&gt;1 year) — LTCG rates</SelectItem>
                    <SelectItem value="short">Short-term (&lt;1 year) — Ordinary rates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Tax Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Other W-2 / Ordinary Income ($)</Label>
                <Input type="number" value={otherIncome} onChange={e => setOtherIncome(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State Income Tax Rate (%)</Label>
                <Input type="number" value={stateRate} onChange={e => setStateRate(+e.target.value)} className="h-9 mt-1" step={0.1} />
                <p className="text-xs text-muted-foreground mt-1">CA: 9.3%, NY: 8.8%, TX/FL: 0%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {results.specialNote && (
            <Card className="bg-amber-500/5 border-amber-500/30">
              <CardContent className="p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{results.specialNote}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Gross Proceeds', value: fmt(results.grossProceeds), color: 'foreground' },
              { label: 'Tax at Vest', value: fmt(results.totalTaxAtVest), color: 'red-500' },
              { label: 'Tax at Sale', value: fmt(results.totalTaxAtSale), color: 'amber-500' },
              { label: 'Total Tax', value: fmt(results.totalTax), color: 'red-500' },
              { label: 'Net Proceeds', value: fmt(results.netProceeds), color: 'emerald-500' },
              { label: 'Effective Rate', value: `${(results.effectiveRate * 100).toFixed(1)}%`, color: 'foreground' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl border bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-base font-bold text-${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Tax Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: 'Ordinary Income (vest)', value: fmt(results.ordinaryIncomeAtVest), style: 'text-foreground' },
                  { label: 'Federal Ordinary Tax', value: fmt(results.federalOrdinaryTax), style: 'text-red-400' },
                  { label: `Capital Gain (${holdingPeriod === 'long' ? 'LT' : 'ST'})`, value: fmt(results.capitalGainAtSale), style: 'text-foreground' },
                  { label: `Federal CGT (${holdingPeriod === 'long' ? `${((results.ltcgRate || 0) * 100).toFixed(0)}%` : 'Ordinary'})`, value: fmt(results.federalCGTax), style: 'text-amber-400' },
                  { label: 'State Tax (total)', value: fmt(results.stateTaxOnOrdinary + results.stateTaxOnCG), style: 'text-orange-400' },
                  { label: 'NIIT (3.8%)', value: fmt(results.niit), style: results.niit > 0 ? 'text-red-400' : 'text-muted-foreground' },
                ].map(({ label, value, style }, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={style}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border font-semibold">
                  <span className="text-foreground">Net to You</span>
                  <span className="text-emerald-500">{fmt(results.netProceeds)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Where Your Money Goes</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={results.pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                      {results.pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(v)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-1">
                  {results.pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}: {fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-foreground mb-1">Key Strategy: Hold RSUs for Long-Term Gains</p>
                <p className="text-xs text-muted-foreground">
                  If you sell immediately at vest, all gain is ordinary income. Holding for &gt;1 year qualifies the post-vest appreciation
                  for LTCG rates (0%, 15%, or 20%) — significantly lower than your marginal ordinary rate.
                  Only the FMV at vest is ordinary income regardless.
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
