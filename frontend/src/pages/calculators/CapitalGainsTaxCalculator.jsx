import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line
} from 'recharts';
import { TrendingDown, DollarSign, Clock, AlertCircle, CheckCircle2, Plus, Trash2, Info } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';
import { US_STATE_TAX_DATA, getStateList } from '@/data/usTaxData';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtPct = (r) => `${(r * 100).toFixed(2)}%`;

// 2025 Long-Term Capital Gains Rates (Rev. Proc. 2024-40)
const LTCG_BRACKETS = {
  single: [
    { max: 48350, rate: 0.00 },
    { max: 533400, rate: 0.15 },
    { max: Infinity, rate: 0.20 },
  ],
  mfj: [
    { max: 96700, rate: 0.00 },
    { max: 600050, rate: 0.15 },
    { max: Infinity, rate: 0.20 },
  ],
  mfs: [
    { max: 48350, rate: 0.00 },
    { max: 300000, rate: 0.15 },
    { max: Infinity, rate: 0.20 },
  ],
  hoh: [
    { max: 64750, rate: 0.00 },
    { max: 566700, rate: 0.15 },
    { max: Infinity, rate: 0.20 },
  ],
};

// 2025 Ordinary Income Brackets for short-term gains
const STCG_BRACKETS = {
  single: [
    { max: 11925, rate: 0.10 }, { max: 48475, rate: 0.12 }, { max: 103350, rate: 0.22 },
    { max: 197300, rate: 0.24 }, { max: 250525, rate: 0.32 }, { max: 626350, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { max: 23850, rate: 0.10 }, { max: 96950, rate: 0.12 }, { max: 206700, rate: 0.22 },
    { max: 394600, rate: 0.24 }, { max: 501050, rate: 0.32 }, { max: 751600, rate: 0.35 }, { max: Infinity, rate: 0.37 },
  ],
};

const NIIT_THRESHOLDS = { single: 200000, mfj: 250000, mfs: 125000, hoh: 200000 };
const STANDARD_DEDUCTIONS_2024 = { single: 15750, mfj: 31500, mfs: 15750, hoh: 23625 };

const getLTCGRate = (taxableIncome, filingStatus) => {
  const brackets = LTCG_BRACKETS[filingStatus] || LTCG_BRACKETS.single;
  for (const b of brackets) {
    if (taxableIncome <= b.max) return b.rate;
  }
  return 0.20;
};

const getSTCGRate = (taxableIncome, filingStatus) => {
  const brackets = STCG_BRACKETS[filingStatus] || STCG_BRACKETS.single;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, b.max) - prev;
    tax += taxable * b.rate;
    prev = b.max;
  }
  return taxableIncome > 0 ? tax / taxableIncome : 0;
};

const getEffectiveStateRate = (state, income) => {
  const s = US_STATE_TAX_DATA?.[state];
  if (!s || !s.hasStateTax) return 0;
  if (s.type === 'flat') return s.rate || 0;
  if (s.type === 'progressive' && s.brackets) {
    let tax = 0; let prev = 0;
    for (const b of s.brackets) {
      if (income <= (prev || 0)) break;
      const taxable = Math.min(income, b.max || Infinity) - (prev || 0);
      tax += taxable * b.rate;
      prev = b.max || Infinity;
    }
    return income > 0 ? tax / income : 0;
  }
  return 0;
};

const DEFAULT_TRANSACTIONS = [
  { id: 1, description: 'AAPL Stock', salePrice: 25000, costBasis: 15000, isLongTerm: true, assetType: 'stock' },
];

export default function CapitalGainsTaxCalculator() {
  const [transactions, setTransactions] = useState(DEFAULT_TRANSACTIONS);
  const [ordinaryIncome, setOrdinaryIncome] = useState(85000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [state, setState] = useState('CA');
  const [otherDeductions, setOtherDeductions] = useState(0);

  const addTransaction = () => setTransactions(prev => [...prev, {
    id: Date.now(), description: '', salePrice: 0, costBasis: 0, isLongTerm: true, assetType: 'stock'
  }]);

  const updateTransaction = (id, field, value) => setTransactions(prev =>
    prev.map(t => t.id === id ? { ...t, [field]: value } : t)
  );

  const removeTransaction = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  const results = useMemo(() => {
    const stdDed = STANDARD_DEDUCTIONS_2024[filingStatus] || STANDARD_DEDUCTIONS_2024.single;
    const totalDeductions = stdDed + otherDeductions;

    let totalSTCG = 0, totalLTCG = 0;
    const txResults = transactions.map(tx => {
      const gain = tx.salePrice - tx.costBasis;
      if (tx.isLongTerm) totalLTCG += gain;
      else totalSTCG += gain;
      return { ...tx, gain, gainPct: tx.costBasis > 0 ? gain / tx.costBasis : 0 };
    });

    const taxableOrdinary = Math.max(0, ordinaryIncome + Math.max(0, totalSTCG) - totalDeductions);
    const stcgTax = totalSTCG > 0 ? totalSTCG * getSTCGRate(taxableOrdinary, filingStatus) : 0;

    // LTCG: stacked on top of ordinary income
    const taxableIncomeForLTCG = taxableOrdinary + Math.max(0, totalLTCG);
    const ltcgRate = getLTCGRate(taxableIncomeForLTCG, filingStatus);
    const ltcgTax = totalLTCG > 0 ? totalLTCG * ltcgRate : 0;

    // NIIT: 3.8% on net investment income if AGI > threshold
    const agiForNIIT = ordinaryIncome + Math.max(0, totalLTCG) + Math.max(0, totalSTCG);
    const niitThreshold = NIIT_THRESHOLDS[filingStatus] || NIIT_THRESHOLDS.single;
    const netInvestmentIncome = Math.max(0, totalLTCG) + Math.max(0, totalSTCG);
    const niit = Math.max(0, Math.min(netInvestmentIncome, agiForNIIT - niitThreshold)) * 0.038;

    // State tax on gains
    const stateRate = getEffectiveStateRate(state, agiForNIIT);
    const stateTaxOnGains = (Math.max(0, totalLTCG) + Math.max(0, totalSTCG)) * stateRate;

    const totalGains = totalLTCG + totalSTCG;
    const totalTax = stcgTax + ltcgTax + niit + stateTaxOnGains;
    const netProceeds = transactions.reduce((sum, t) => sum + t.salePrice, 0) - totalTax;
    const effectiveRate = totalGains > 0 ? totalTax / totalGains : 0;

    return {
      txResults,
      totalSTCG, totalLTCG, totalGains,
      stcgTax, ltcgTax, niit, stateTaxOnGains,
      totalTax, netProceeds, effectiveRate,
      ltcgRate, stateRate,
    };
  }, [transactions, ordinaryIncome, filingStatus, state, otherDeductions]);

  const ASSET_TYPES = ['stock', 'etf', 'mutual_fund', 'crypto', 'real_estate', 'other'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
          <TrendingDown className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">US Capital Gains Tax Calculator</h1>
          <p className="text-muted-foreground text-sm">Short-term vs long-term rates, NIIT, and state taxes for all 50 states</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Income & Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Ordinary Income (W-2/1099) ($)</Label>
                <Input type="number" value={ordinaryIncome} onChange={e => setOrdinaryIncome(+e.target.value)} className="h-9 mt-1" data-testid="cg-ordinary-income" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1" data-testid="cg-filing-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                    <SelectItem value="mfs">Married Filing Separately</SelectItem>
                    <SelectItem value="hoh">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-9 mt-1" data-testid="cg-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {getStateList().map(s => (
                      <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Additional Deductions ($)</Label>
                <Input type="number" value={otherDeductions} onChange={e => setOtherDeductions(+e.target.value)} className="h-9 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Standard deduction auto-applied</p>
              </div>
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tax Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Long-Term CGT Rate', fmtPct(results.ltcgRate), 'text-emerald-500'],
                ['State CGT Rate', fmtPct(results.stateRate), 'text-blue-500'],
                ['NIIT (3.8%)', results.niit > 0 ? 'Applies' : 'Not applicable', results.niit > 0 ? 'text-amber-500' : 'text-muted-foreground'],
                ['Total Gains', fmt(results.totalGains), 'text-foreground'],
                ['Total Tax', fmt(results.totalTax), 'text-red-500'],
                ['Effective Rate', fmtPct(results.effectiveRate), 'text-foreground'],
              ].map(([label, value, color], i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${color}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Transactions & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Transactions */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Capital Gains Transactions</CardTitle>
              <Button size="sm" variant="outline" onClick={addTransaction} data-testid="cg-add-transaction">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Sale
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {transactions.map((tx, i) => (
                <div key={tx.id} className="p-3 rounded-lg border border-border space-y-2" data-testid={`cg-transaction-${i}`}>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Asset description (e.g. AAPL Stock)"
                      value={tx.description}
                      onChange={e => updateTransaction(tx.id, 'description', e.target.value)}
                      className="h-8 flex-1 text-sm"
                    />
                    <Select value={String(tx.isLongTerm)} onValueChange={v => updateTransaction(tx.id, 'isLongTerm', v === 'true')}>
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Long-Term (&ge;1yr)</SelectItem>
                        <SelectItem value="false">Short-Term (&lt;1yr)</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={() => removeTransaction(tx.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cost Basis ($)</Label>
                      <Input type="number" value={tx.costBasis} onChange={e => updateTransaction(tx.id, 'costBasis', +e.target.value)} className="h-8 mt-0.5 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sale Price ($)</Label>
                      <Input type="number" value={tx.salePrice} onChange={e => updateTransaction(tx.id, 'salePrice', +e.target.value)} className="h-8 mt-0.5 text-sm" />
                    </div>
                    <div className="flex items-end pb-0.5">
                      <div className={`w-full p-1.5 rounded text-center text-sm font-medium ${
                        results.txResults[i]?.gain > 0 ? 'bg-emerald-500/10 text-emerald-500' : results.txResults[i]?.gain < 0 ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {fmt(results.txResults[i]?.gain || 0)}
                        {tx.isLongTerm ? <Badge className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-400 border-0">LT</Badge> : <Badge className="ml-1 text-[10px] bg-amber-500/20 text-amber-400 border-0">ST</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Long-Term Gains', value: fmt(results.totalLTCG), color: 'emerald', icon: CheckCircle2 },
              { label: 'Short-Term Gains', value: fmt(results.totalSTCG), color: 'amber', icon: Clock },
              { label: 'Total Tax Owed', value: fmt(results.totalTax), color: 'red', icon: DollarSign },
              { label: 'Net After Tax', value: fmt(results.netProceeds), color: 'blue', icon: TrendingDown },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`p-3 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                  <Icon className={`h-3.5 w-3.5 text-${item.color}-500 mb-1`} />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-lg font-bold text-${item.color}-500`}>{item.value}</p>
                </div>
              );
            })}
          </div>

          {/* Tax Breakdown Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tax Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { name: 'Long-Term CGT', value: Math.round(results.ltcgTax), fill: '#10b981' },
                  { name: 'Short-Term CGT', value: Math.round(results.stcgTax), fill: '#f59e0b' },
                  { name: 'NIIT (3.8%)', value: Math.round(results.niit), fill: '#6366f1' },
                  { name: 'State Tax', value: Math.round(results.stateTaxOnGains), fill: '#f97316' },
                ].filter(d => d.value > 0)}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [fmt(v), 'Tax']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[{ fill: '#10b981' }, { fill: '#f59e0b' }, { fill: '#6366f1' }, { fill: '#f97316' }].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tax-Loss Harvesting Tip */}
          {results.totalLTCG > 0 && (
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground mb-1">Tax-Loss Harvesting Opportunity</p>
                  <p className="text-xs text-muted-foreground">
                    You have {fmt(results.totalLTCG)} in capital gains this year. If you have investments currently at a loss,
                    you could sell them to offset these gains and reduce your tax bill. Capital losses offset gains dollar-for-dollar.
                    Up to $3,000 of excess losses can offset ordinary income annually.
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
