import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calculator, AlertCircle, CheckCircle2, Info, DollarSign } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

// 2024 AMT
const AMT_EXEMPTION = { single: 85700, mfj: 133300, mfs: 66650 };
const AMT_PHASEOUT = { single: 609350, mfj: 1218700, mfs: 609350 };
const AMT_RATE_LOW = 0.26;
const AMT_RATE_HIGH = 0.28;
const AMT_BRACKET = 220700; // 26% up to here, 28% above

// Regular tax brackets 2024
const REG_BRACKETS = {
  single: [
    { max: 11600, rate: 0.10 }, { max: 47150, rate: 0.12 }, { max: 100525, rate: 0.22 },
    { max: 191950, rate: 0.24 }, { max: 243725, rate: 0.32 }, { max: 609350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { max: 23200, rate: 0.10 }, { max: 94300, rate: 0.12 }, { max: 201050, rate: 0.22 },
    { max: 383900, rate: 0.24 }, { max: 487450, rate: 0.32 }, { max: 731200, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
};
const STD_DED = { single: 14600, mfj: 29200, mfs: 14600 };

const calcRegTax = (taxableIncome, brackets) => {
  if (taxableIncome <= 0) return 0;
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, b.max) - prev) * b.rate;
    prev = b.max;
  }
  return tax;
};

export default function AMTCalculator() {
  const [filingStatus, setFilingStatus] = useState('single');
  const [regularIncome, setRegularIncome] = useState(200000);
  const [isoSpread, setISOSpread] = useState(100000); // ISO exercise spread (AMT preference)
  const [acceleratedDepreciation, setAcceleratedDepreciation] = useState(0);
  const [saltDeduction, setSaltDeduction] = useState(0); // Added back under AMT (if was itemized)
  const [miscDeductions, setMiscDeductions] = useState(0); // 2% misc deductions (disallowed under AMT)
  const [standardOrItemized, setStandardOrItemized] = useState('standard');

  const results = useMemo(() => {
    const brackets = REG_BRACKETS[filingStatus] || REG_BRACKETS.single;
    const stdDed = STD_DED[filingStatus] || STD_DED.single;

    // Regular Tax
    const regularDeduction = standardOrItemized === 'standard' ? stdDed : saltDeduction + miscDeductions;
    const regularTaxableIncome = Math.max(0, regularIncome - regularDeduction);
    const regularTax = calcRegTax(regularTaxableIncome, brackets);

    // AMT
    // AMTI adjustments: add back ISO spread, excess depreciation, disallowed deductions
    // Under AMT, standard deduction and most itemized deductions are not allowed (except charitable, mortgage)
    const amtiAdjustments = isoSpread + acceleratedDepreciation + (standardOrItemized === 'standard' ? 0 : Math.min(saltDeduction, 10000));
    const amti = regularIncome + amtiAdjustments; // Simplified: no itemized deductions allowed

    // Phase out exemption
    const baseExemption = AMT_EXEMPTION[filingStatus] || AMT_EXEMPTION.single;
    const phaseoutStart = AMT_PHASEOUT[filingStatus] || AMT_PHASEOUT.single;
    const phaseoutAmount = Math.max(0, amti - phaseoutStart);
    const reducedExemption = Math.max(0, baseExemption - phaseoutAmount * 0.25);
    const amtBase = Math.max(0, amti - reducedExemption);

    // AMT Tax
    const amtTaxLow = Math.min(amtBase, AMT_BRACKET) * AMT_RATE_LOW;
    const amtTaxHigh = Math.max(0, amtBase - AMT_BRACKET) * AMT_RATE_HIGH;
    const amtTax = amtTaxLow + amtTaxHigh;

    // AMT liability = excess of AMT over regular tax
    const amtLiability = Math.max(0, amtTax - regularTax);
    const totalTax = regularTax + amtLiability;
    const amtApplies = amtLiability > 0;

    const chartData = [
      { name: 'Regular Tax', value: Math.round(regularTax), color: '#6366f1' },
      ...(amtLiability > 0 ? [{ name: 'AMT Surcharge', value: Math.round(amtLiability), color: '#ef4444' }] : []),
    ];

    // AMT Credit: can carry forward AMT paid on "timing" items (like ISO) to future years
    const potentialAmtCredit = isoSpread > 0 ? amtLiability : 0;

    return {
      regularTaxableIncome, regularTax, amti, reducedExemption,
      amtBase, amtTax, amtLiability, totalTax, amtApplies,
      chartData, potentialAmtCredit, baseExemption, amtiAdjustments,
    };
  }, [filingStatus, regularIncome, isoSpread, acceleratedDepreciation, saltDeduction, miscDeductions, standardOrItemized]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
          <Calculator className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">AMT Calculator</h1>
          <p className="text-muted-foreground text-sm">Alternative Minimum Tax — check if you owe more than the regular tax, especially with ISO stock options</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Tax Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1" data-testid="amt-filing-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                    <SelectItem value="mfs">Married Filing Separately</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Regular Taxable Income ($)</Label>
                <Input type="number" value={regularIncome} onChange={e => setRegularIncome(+e.target.value)} className="h-9 mt-1" data-testid="amt-regular-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Deduction Method</Label>
                <Select value={standardOrItemized} onValueChange={setStandardOrItemized}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Deduction</SelectItem>
                    <SelectItem value="itemized">Itemized Deductions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {standardOrItemized === 'itemized' && (
                <div>
                  <Label className="text-xs text-muted-foreground">SALT Deductions ($)</Label>
                  <Input type="number" value={saltDeduction} onChange={e => setSaltDeduction(+e.target.value)} className="h-9 mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Disallowed under AMT</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">AMT Preferences / Adjustments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">ISO Exercise Spread ($)</Label>
                <Input type="number" value={isoSpread} onChange={e => setISOSpread(+e.target.value)} className="h-9 mt-1" data-testid="amt-iso-spread" />
                <p className="text-xs text-muted-foreground mt-1">FMV at exercise minus strike price × shares</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Accelerated Depreciation ($)</Label>
                <Input type="number" value={acceleratedDepreciation} onChange={e => setAcceleratedDepreciation(+e.target.value)} className="h-9 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Business property, real estate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className={results.amtApplies ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {results.amtApplies
                  ? <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  : <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                }
                <div>
                  <p className="font-bold text-foreground">
                    {results.amtApplies
                      ? `AMT Applies — you owe ${fmt(results.amtLiability)} extra`
                      : 'No AMT due — regular tax exceeds your AMT liability'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AMT base: {fmt(results.amtBase)} · AMT exemption: {fmt(results.reducedExemption)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Regular Tax', value: fmt(results.regularTax), color: 'indigo' },
                  { label: 'AMT Calculated', value: fmt(results.amtTax), color: 'red' },
                  { label: 'AMT Surcharge', value: fmt(results.amtLiability), color: results.amtApplies ? 'red' : 'emerald' },
                  { label: 'Total Tax Owed', value: fmt(results.totalTax), color: 'foreground' },
                ].map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border bg-${item.color === 'foreground' ? 'muted/30' : `${item.color}-500/5`} border-${item.color === 'foreground' ? 'border' : `${item.color}-500/20`}`}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`text-base font-bold ${item.color === 'foreground' ? 'text-foreground' : `text-${item.color}-500`}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Tax Calculation Walkthrough</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: 'Regular income', value: fmt(regularIncome) },
                { label: 'AMT adjustments (ISO spread, etc.)', value: `+ ${fmt(results.amtiAdjustments)}` },
                { label: 'Alternative Minimum Taxable Income (AMTI)', value: fmt(results.amti), bold: true },
                { label: 'AMT Exemption', value: `– ${fmt(results.reducedExemption)}` },
                { label: 'AMT Base', value: fmt(results.amtBase), bold: true },
                { label: 'AMT (26% / 28%)', value: fmt(results.amtTax) },
                { label: 'Regular Tax', value: fmt(results.regularTax) },
                { label: 'AMT Liability (excess)', value: fmt(results.amtLiability), bold: true, color: results.amtApplies ? 'text-red-500' : 'text-emerald-500' },
              ].map(({ label, value, bold, color }, i) => (
                <div key={i} className={`flex justify-between ${bold ? 'pt-1 border-t border-border' : ''}`}>
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`${bold ? 'font-semibold text-foreground' : ''} ${color || ''}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {results.potentialAmtCredit > 0 && (
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground mb-1">AMT Credit Available Next Year</p>
                  <p className="text-xs text-muted-foreground">
                    You may be able to claim a Minimum Tax Credit of approximately <span className="font-medium text-blue-500">{fmt(results.potentialAmtCredit)}</span> in future years
                    when your regular tax exceeds your AMT. This is because ISO spread is a "timing" preference item (not permanent). Use Form 8801.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
