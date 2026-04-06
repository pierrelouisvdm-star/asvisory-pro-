import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HeartPulse, AlertCircle, CheckCircle2, Info, DollarSign } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

// 2025 IRMAA Brackets (based on 2023 MAGI — Medicare uses income from 2 years prior)
const IRMAA_BRACKETS = {
  single: [
    { maxMAGI: 106000, partBSurcharge: 0, partDSurcharge: 0, tier: 0 },
    { maxMAGI: 133000, partBSurcharge: 74.00, partDSurcharge: 13.70, tier: 1 },
    { maxMAGI: 167000, partBSurcharge: 185.00, partDSurcharge: 35.30, tier: 2 },
    { maxMAGI: 200000, partBSurcharge: 295.90, partDSurcharge: 57.00, tier: 3 },
    { maxMAGI: 500000, partBSurcharge: 406.90, partDSurcharge: 78.60, tier: 4 },
    { maxMAGI: Infinity, partBSurcharge: 443.90, partDSurcharge: 85.80, tier: 5 },
  ],
  mfj: [
    { maxMAGI: 212000, partBSurcharge: 0, partDSurcharge: 0, tier: 0 },
    { maxMAGI: 266000, partBSurcharge: 74.00, partDSurcharge: 13.70, tier: 1 },
    { maxMAGI: 334000, partBSurcharge: 185.00, partDSurcharge: 35.30, tier: 2 },
    { maxMAGI: 400000, partBSurcharge: 295.90, partDSurcharge: 57.00, tier: 3 },
    { maxMAGI: 750000, partBSurcharge: 406.90, partDSurcharge: 78.60, tier: 4 },
    { maxMAGI: Infinity, partBSurcharge: 443.90, partDSurcharge: 85.80, tier: 5 },
  ],
};

const BASE_PART_B = 185.00; // 2025 standard Part B premium
const TIER_LABELS = ['Standard', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5 (Max)'];
const TIER_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#f97316', '#ef4444', '#dc2626'];

const getIRMAA = (magi, filingStatus) => {
  const brackets = IRMAA_BRACKETS[filingStatus] || IRMAA_BRACKETS.single;
  for (const b of brackets) {
    if (magi <= b.maxMAGI) return b;
  }
  return brackets[brackets.length - 1];
};

export default function MedicareIRMAA() {
  const [magi, setMagi] = useState(120000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [hasMedigap, setHasMedigap] = useState(false);
  const [medigapPremium, setMedigapPremium] = useState(200);
  const [hasPartD, setHasPartD] = useState(true);
  const [partDBase, setPartDBase] = useState(50);

  const result = useMemo(() => {
    const bracket = getIRMAA(magi, filingStatus);
    const monthlyPartB = BASE_PART_B + bracket.partBSurcharge;
    const monthlyPartD = hasPartD ? partDBase + bracket.partDSurcharge : 0;
    const monthlyMedigap = hasMedigap ? medigapPremium : 0;
    const monthlyTotal = monthlyPartB + monthlyPartD + monthlyMedigap;
    const annualTotal = monthlyTotal * 12;
    const annualSurcharge = (bracket.partBSurcharge + (hasPartD ? bracket.partDSurcharge : 0)) * 12;

    // Standard tier total for comparison
    const standardMonthly = BASE_PART_B + (hasPartD ? partDBase : 0) + monthlyMedigap;
    const extraVsStandard = monthlyTotal - standardMonthly;

    // All tiers for chart
    const brackets = IRMAA_BRACKETS[filingStatus] || IRMAA_BRACKETS.single;
    const chartData = brackets.map((b, i) => ({
      tier: TIER_LABELS[i],
      monthlyPartB: BASE_PART_B + b.partBSurcharge,
      surcharge: b.partBSurcharge,
      fill: TIER_COLORS[i],
    }));

    return { bracket, monthlyPartB, monthlyPartD, monthlyMedigap, monthlyTotal, annualTotal, annualSurcharge, extraVsStandard, chartData };
  }, [magi, filingStatus, hasMedigap, medigapPremium, hasPartD, partDBase]);

  const isIRMAA = result.bracket.tier > 0;
  const brackets = IRMAA_BRACKETS[filingStatus] || IRMAA_BRACKETS.single;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
          <HeartPulse className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Medicare IRMAA Calculator</h1>
          <p className="text-muted-foreground text-sm">Income-Related Monthly Adjustment Amount — 2024 Medicare premium surcharges</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">2022 MAGI (used for 2024 premiums) ($)</Label>
                <Input type="number" value={magi} onChange={e => setMagi(+e.target.value)} className="h-9 mt-1" data-testid="irmaa-magi" />
                <p className="text-xs text-muted-foreground mt-1">Medicare uses income from 2 years prior (2023 MAGI for 2025 premiums)</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger className="h-9 mt-1" data-testid="irmaa-filing-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-foreground mb-3">Optional: Full Cost Estimate</p>
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" id="has-part-d" checked={hasPartD} onChange={e => setHasPartD(e.target.checked)} className="rounded" />
                  <Label htmlFor="has-part-d" className="text-xs text-muted-foreground cursor-pointer">Include Part D (Drug Coverage)</Label>
                </div>
                {hasPartD && (
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground">Part D Base Premium ($/mo)</Label>
                    <Input type="number" value={partDBase} onChange={e => setPartDBase(+e.target.value)} className="h-9 mt-1" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="has-medigap" checked={hasMedigap} onChange={e => setHasMedigap(e.target.checked)} className="rounded" />
                  <Label htmlFor="has-medigap" className="text-xs text-muted-foreground cursor-pointer">Include Medigap/Supplement</Label>
                </div>
                {hasMedigap && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Medigap Premium ($/mo)</Label>
                    <Input type="number" value={medigapPremium} onChange={e => setMedigapPremium(+e.target.value)} className="h-9 mt-1" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {isIRMAA && (
            <Card className="bg-amber-500/5 border-amber-500/30">
              <CardContent className="p-4 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">IRMAA Applies</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're paying <span className="font-medium text-amber-500">{fmt(result.extraVsStandard)}/month extra</span> vs. the standard premium.
                    That's <span className="font-medium text-amber-500">{fmt(result.extraVsStandard * 12)}/year</span> more.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {!isIRMAA && (
            <Card className="bg-emerald-500/5 border-emerald-500/30">
              <CardContent className="p-4 flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">No IRMAA Surcharge</p>
                  <p className="text-xs text-muted-foreground mt-1">Your income is below the IRMAA threshold. You pay the standard Part B premium of {fmtD(BASE_PART_B)}/month (2025).</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Monthly Part B', value: fmtD(result.monthlyPartB), color: 'blue', sub: `${TIER_LABELS[result.bracket.tier]}` },
              { label: 'Monthly Part D', value: hasPartD ? fmtD(result.monthlyPartD) : 'N/A', color: 'purple', sub: 'Drug coverage' },
              { label: 'Total Monthly', value: fmtD(result.monthlyTotal), color: 'amber', sub: 'All premiums' },
              { label: 'Annual Total', value: fmt(result.annualTotal), color: 'red', sub: 'Yearly cost' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold text-${item.color}-500`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Part B Premium by IRMAA Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={result.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="tier" tick={{ fontSize: 9 }} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Monthly Part B']} />
                  <Bar dataKey="monthlyPartB" radius={[4, 4, 0, 0]}>
                    {result.chartData.map((entry, i) => (
                      <Cell key={i} fill={i === result.bracket.tier ? entry.fill : `${entry.fill}60`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2 text-center">Highlighted bar = your current tier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">2025 IRMAA Threshold Table ({filingStatus === 'mfj' ? 'Married Filing Jointly' : 'Single'})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['MAGI Range', 'Part B Premium', 'Surcharge', 'Part D Add-On'].map(h => (
                        <th key={h} className="text-left py-2 pr-3 text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {brackets.map((b, i) => {
                      const prevMax = i === 0 ? 0 : brackets[i - 1].maxMAGI;
                      const rangeStr = b.maxMAGI === Infinity ? `Over ${fmt(prevMax)}` : `${fmt(prevMax)} – ${fmt(b.maxMAGI)}`;
                      const isActive = b.tier === result.bracket.tier;
                      return (
                        <tr key={i} className={`border-b border-border/50 ${isActive ? 'bg-primary/5' : 'hover:bg-muted/20'}`}>
                          <td className="py-1.5 pr-3 text-foreground">
                            {rangeStr}
                            {isActive && <Badge className="ml-2 text-[10px] bg-primary/20 text-primary border-0">You</Badge>}
                          </td>
                          <td className="py-1.5 pr-3 text-foreground font-medium">{fmtD(BASE_PART_B + b.partBSurcharge)}/mo</td>
                          <td className={`py-1.5 pr-3 ${b.partBSurcharge > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                            {b.partBSurcharge > 0 ? `+${fmtD(b.partBSurcharge)}` : 'None'}
                          </td>
                          <td className={`py-1.5 pr-3 ${b.partDSurcharge > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            {b.partDSurcharge > 0 ? `+${fmtD(b.partDSurcharge)}` : 'None'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-foreground mb-1">IRMAA Appeal & Life Events</p>
                <p className="text-xs text-muted-foreground">
                  Had a major life change? Marriage, divorce, death of spouse, retirement, or significant income reduction in 2023?
                  You can request an IRMAA recalculation using SSA Form SSA-44, using more recent income data.
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
