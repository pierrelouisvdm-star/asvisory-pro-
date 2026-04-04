import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, AlertCircle, Clock, DollarSign, Info } from 'lucide-react';

const CURRENT_YEAR = 2025;
const NEXT_YEAR = 2026;

const DEADLINES = [
  // 2025 dates
  { date: '2025-01-15', label: 'Q4 2024 Estimated Tax', type: 'estimated', description: '4th quarter estimated tax payment due for 2024 income. If you underpaid, file Form 1040-ES.', urgency: 'past', amount: null },
  { date: '2025-01-31', label: 'W-2 & 1099 Distribution', type: 'document', description: 'Employers must send W-2s; financial institutions send 1099-DIV, 1099-INT, 1099-B.', urgency: 'past', amount: null },
  { date: '2025-03-17', label: 'S-Corp & Partnership Returns (Form 1120-S / 1065)', type: 'filing', description: 'Entity returns due. File Form 7004 for a 6-month extension.', urgency: 'past', amount: null },
  { date: '2025-04-15', label: 'Federal Tax Filing Deadline (2024)', type: 'filing', description: 'File Form 1040 or request a 6-month extension (Form 4868). Note: Extension to file ≠ extension to pay.', urgency: 'upcoming', amount: null },
  { date: '2025-04-15', label: 'Q1 2025 Estimated Tax', type: 'estimated', description: '1st quarter 2025 estimated tax due. Pay if you expect to owe $1,000+ at filing.', urgency: 'upcoming', amount: null },
  { date: '2025-04-15', label: 'IRA Contribution Deadline (2024)', type: 'contribution', description: 'Last day to make a 2024 IRA contribution. Traditional IRA: $7,000 ($8,000 if 50+). Also HSA deadline!', urgency: 'upcoming', amount: '$7,000 / $8,000 (50+)' },
  { date: '2025-04-15', label: 'HSA Contribution Deadline (2024)', type: 'contribution', description: 'Last day to make 2024 HSA contributions. Individual: $4,150. Family: $8,300. (+$1,000 catch-up if 55+)', urgency: 'upcoming', amount: '$4,150 / $8,300' },
  { date: '2025-06-16', label: 'Q2 2025 Estimated Tax', type: 'estimated', description: '2nd quarter estimated tax due. Covers income from April 1 – May 31.', urgency: 'upcoming', amount: null },
  { date: '2025-09-15', label: 'Q3 2025 Estimated Tax', type: 'estimated', description: '3rd quarter estimated tax due. Covers income from June 1 – August 31.', urgency: 'upcoming', amount: null },
  { date: '2025-10-15', label: 'Extended Return Deadline', type: 'filing', description: 'If you filed Form 4868, your extended federal return is due today. No further extensions available.', urgency: 'upcoming', amount: null },
  { date: '2025-12-01', label: 'RMD Deadline Reminder', type: 'contribution', description: 'Required Minimum Distributions for ages 73+ must be taken by Dec 31. Start early to avoid penalties.', urgency: 'upcoming', amount: null },
  { date: '2025-12-31', label: 'Tax-Year End — Action Required', type: 'year_end', description: 'Last day for: Tax-loss harvesting, RMDs, charitable donations (for current-year deduction), FSA spend-down, 401(k) contributions.', urgency: 'upcoming', amount: null },
  // 2026 dates
  { date: '2026-01-15', label: 'Q4 2025 Estimated Tax', type: 'estimated', description: '4th quarter estimated tax payment for 2025 income.', urgency: 'future', amount: null },
  { date: '2026-01-31', label: 'W-2 & 1099 Distribution (2025)', type: 'document', description: 'Tax documents for 2025 tax year must be mailed/delivered.', urgency: 'future', amount: null },
  { date: '2026-04-15', label: 'Federal Tax Filing (2025)', type: 'filing', description: '2025 tax year returns due, plus Q1 2026 estimated taxes and 2025 IRA/HSA contribution deadline.', urgency: 'future', amount: null },
  { date: '2026-04-15', label: 'IRA/HSA Deadline (2025 tax year)', type: 'contribution', description: 'Contribute to 2025 IRA and HSA by this date.', urgency: 'future', amount: null },
  { date: '2026-06-15', label: 'Q2 2026 Estimated Tax', type: 'estimated', description: '2nd quarter 2026 estimated tax due.', urgency: 'future', amount: null },
  { date: '2026-09-15', label: 'Q3 2026 Estimated Tax', type: 'estimated', description: '3rd quarter 2026 estimated tax due.', urgency: 'future', amount: null },
  { date: '2026-10-15', label: 'Extended Return (2025)', type: 'filing', description: 'Extended 2025 federal returns due.', urgency: 'future', amount: null },
  { date: '2026-12-31', label: 'Tax Year-End 2026', type: 'year_end', description: 'Last day for 2026 tax actions: RMDs, 401(k) contributions, tax-loss harvesting, charitable donations.', urgency: 'future', amount: null },
];

const TYPE_CONFIG = {
  estimated: { label: 'Estimated Tax', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' },
  filing: { label: 'Tax Filing', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500' },
  contribution: { label: 'Contribution', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
  document: { label: 'Documents', color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500' },
  year_end: { label: 'Year-End', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-500' },
};

const LIMITS_2025 = [
  { name: '401(k) / 403(b)', limit: '$23,500', catchup: '$31,000 (50+)', note: '+$7,500 catch-up 50–59 and 64+; $11,250 for 60–63' },
  { name: 'IRA (Traditional / Roth)', limit: '$7,000', catchup: '$8,000 (50+)', note: 'Contribution deadline: April 15, 2026' },
  { name: 'HSA (Self-only)', limit: '$4,300', catchup: '$5,300 (55+)', note: '+$1,000 catch-up at 55' },
  { name: 'HSA (Family)', limit: '$8,550', catchup: '$9,550 (55+)', note: 'HDHP required' },
  { name: '529 Annual Gift Limit', limit: '$19,000', catchup: 'N/A', note: 'Per beneficiary, per donor. 5-year superfund: $95,000' },
  { name: 'FSA Healthcare', limit: '$3,300', catchup: 'N/A', note: 'Use-it-or-lose-it (some plans allow $660 rollover)' },
  { name: 'SEP-IRA', limit: '25% net income', catchup: '$70,000 max', note: 'Deadline: tax return + extensions' },
  { name: 'SIMPLE IRA', limit: '$16,500', catchup: '$20,000 (50+)', note: '' },
  { name: 'Gift Tax Annual Exclusion', limit: '$19,000', catchup: 'N/A', note: 'Per recipient — no gift tax return needed below this' },
  { name: 'Social Security Wage Base', limit: '$176,100', catchup: 'N/A', note: 'FICA stops above this for SS portion' },
];

export default function USTaxCalendar() {
  const [filter, setFilter] = useState('all');
  const today = new Date();

  const filteredDeadlines = DEADLINES.filter(d => {
    if (filter === 'all') return true;
    return d.type === filter;
  });

  const getUrgencyIcon = (d) => {
    const deadlineDate = new Date(d.date);
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'Past' };
    if (daysUntil <= 30) return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: `${daysUntil}d` };
    if (daysUntil <= 90) return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: `${daysUntil}d` };
    return { icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-500/10', label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  };

  const FILTER_OPTS = [
    { value: 'all', label: 'All Dates' },
    { value: 'filing', label: 'Tax Filing' },
    { value: 'estimated', label: 'Estimated Tax' },
    { value: 'contribution', label: 'Contributions' },
    { value: 'document', label: 'Documents' },
    { value: 'year_end', label: 'Year-End' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
          <CalendarDays className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">US Tax Calendar 2025–2026</h1>
          <p className="text-muted-foreground text-sm">Never miss a deadline — estimated taxes, contribution limits, and year-end actions</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredDeadlines.map((d, i) => {
            const cfg = TYPE_CONFIG[d.type] || TYPE_CONFIG.filing;
            const urgency = getUrgencyIcon(d);
            const Icon = urgency.icon;
            const isPast = new Date(d.date) < today;
            return (
              <div key={i} className={`p-4 rounded-xl border ${isPast ? 'border-border/40 opacity-60' : `border-border hover:${cfg.border}`} bg-card transition-all`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${urgency.bg}`}>
                    <Icon className={`h-4 w-4 ${urgency.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground text-sm">{d.label}</p>
                      <Badge className={`text-[10px] ${cfg.bg} ${cfg.text} border-0`}>{cfg.label}</Badge>
                      {d.amount && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-0">{d.amount}</Badge>}
                    </div>
                    <p className={`text-xs font-medium mb-1 ${urgency.color}`}>
                      {new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {!isPast && ` · ${urgency.label}`}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> 2025 Contribution Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {LIMITS_2025.map((item, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-foreground">{item.name}</span>
                    <span className="text-xs font-bold text-primary">{item.limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">{item.catchup !== 'N/A' ? item.catchup : ''}</span>
                  </div>
                  {item.note && <p className="text-xs text-muted-foreground/70">{item.note}</p>}
                  {i < LIMITS_2025.length - 1 && <div className="border-b border-border/30 pt-2" />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex gap-2">
              <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Safe Harbor Rules</p>
                <p className="text-xs text-muted-foreground">
                  Avoid underpayment penalties by paying the lesser of:
                  (1) 100% of prior year tax liability, or
                  (2) 90% of current year tax.
                  High earners (+$150k AGI): use 110% of prior year.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
