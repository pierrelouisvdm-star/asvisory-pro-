import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Wallet, PiggyBank, TrendingUp, Target, Loader2, Plus, X, Save,
  ArrowRight, Sparkles, Home, Briefcase, Coins, Heart, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const CATEGORY_OPTIONS = [
  { value: 'cash', label: 'Cash & Savings', icon: Wallet },
  { value: 'property', label: 'Property', icon: Home },
  { value: 'equity', label: 'Equity / Shares', icon: TrendingUp },
  { value: 'retirement', label: 'Retirement (RA/TFSA)', icon: PiggyBank },
  { value: 'other', label: 'Other', icon: Briefcase },
];
const CATEGORY_COLORS = { cash: '#10b981', property: '#3b82f6', equity: '#f59e0b', retirement: '#8b5cf6', other: '#94a3b8' };

const READINESS_COLOR = {
  'On Track': 'emerald',
  'Almost There': 'sky',
  'Catching Up': 'amber',
  'Behind': 'red',
  'Insufficient data': 'slate',
};

const fmtR = (v) => v == null ? '—' : `R ${Number(v).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

export const MyMoney = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dash, setDash] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, histRes] = await Promise.all([
        axios.get(`${API_URL}/api/me/financial/dashboard`, authHeaders),
        axios.get(`${API_URL}/api/me/financial/history`, authHeaders).catch(() => ({ data: { history: [] } })),
      ]);
      setDash(dashRes.data);
      setProfile({
        ...dashRes.data.profile,
        assets: dashRes.data.profile.assets || [],
        liabilities: dashRes.data.profile.liabilities || [],
      });
      setHistory(histRes.data.history || []);
    } catch (e) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/me/financial/profile`, profile, authHeaders);
      toast.success('Saved');
      await load();
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, val) => setProfile((p) => ({ ...p, [key]: val }));

  const numField = (val) => val === '' ? 0 : Number(val);

  const addAsset = () => setProfile((p) => ({ ...p, assets: [...p.assets, { name: '', value: 0, category: 'other' }] }));
  const updateAsset = (i, key, val) => setProfile((p) => ({ ...p, assets: p.assets.map((a, idx) => idx === i ? { ...a, [key]: val } : a) }));
  const removeAsset = (i) => setProfile((p) => ({ ...p, assets: p.assets.filter((_, idx) => idx !== i) }));

  const addLiability = () => setProfile((p) => ({ ...p, liabilities: [...p.liabilities, { name: '', balance: 0 }] }));
  const updateLiability = (i, key, val) => setProfile((p) => ({ ...p, liabilities: p.liabilities.map((a, idx) => idx === i ? { ...a, [key]: val } : a) }));
  const removeLiability = (i) => setProfile((p) => ({ ...p, liabilities: p.liabilities.filter((_, idx) => idx !== i) }));

  if (loading || !dash || !profile) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const allocData = Object.entries(dash.net_worth.allocation || {})
    .map(([k, v]) => ({ name: CATEGORY_OPTIONS.find((c) => c.value === k)?.label || k, value: v, key: k }))
    .filter((d) => d.value > 0);

  const readinessColor = READINESS_COLOR[dash.retirement_readiness.label] || 'slate';

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="my-money-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Heart className="h-7 w-7 text-emerald-400" />
            My Money
          </h1>
          <p className="text-slate-400">
            Hi {user?.full_name?.split(' ')[0] || 'there'} — your TFSA, RA, net worth and retirement progress at a glance.
          </p>
        </div>

        {/* Retirement Readiness Hero */}
        <Card className={`bg-gradient-to-br from-${readinessColor}-950/40 to-navy-900 border-${readinessColor}-500/30`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Retirement Readiness</div>
                <div className="text-3xl font-bold text-white flex items-center gap-2" data-testid="readiness-label">
                  <Target className={`h-7 w-7 text-${readinessColor}-400`} />
                  {dash.retirement_readiness.label}
                </div>
                {dash.retirement_readiness.years_remaining != null && (
                  <div className="text-sm text-slate-300 mt-1">
                    {dash.retirement_readiness.years_remaining} years to retirement
                  </div>
                )}
              </div>
              {dash.retirement_readiness.pct != null && (
                <div className="text-right">
                  <div className="text-5xl font-bold text-white" data-testid="readiness-pct">{dash.retirement_readiness.pct}%</div>
                  <div className="text-xs text-slate-400 mt-1">of expected progress</div>
                </div>
              )}
            </div>
            {dash.retirement_readiness.label === 'Insufficient data' && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-start gap-2 text-sm text-amber-200">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Fill in your age, retirement age and monthly expenses below to get a readiness score.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top metrics row */}
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard label="Net Worth" value={fmtR(dash.net_worth.net_worth)} icon={Wallet} testid="metric-net-worth" />
          <MetricCard label="Total Assets" value={fmtR(dash.net_worth.total_assets)} icon={TrendingUp} testid="metric-assets" sub={`vs Liab. ${fmtR(dash.net_worth.total_liabilities)}`} />
          <MetricCard label="Annual Income" value={fmtR(profile.annual_income)} icon={Coins} testid="metric-income" />
        </div>

        {/* TFSA + RA cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-navy-900/60 border-navy-700" data-testid="tfsa-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-emerald-400" /> TFSA Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">This tax year</span>
                  <span className="text-emerald-400 font-medium">{fmtR(dash.tfsa.annual_used)} / {fmtR(dash.tfsa.annual_limit)}</span>
                </div>
                <Progress value={Math.min(dash.tfsa.annual_pct, 100)} className="h-2" />
                <div className="text-xs text-slate-500 mt-1">{fmtR(dash.tfsa.annual_remaining)} remaining</div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">Lifetime cap</span>
                  <span className="text-emerald-400 font-medium">{fmtR(dash.tfsa.lifetime_used)} / {fmtR(dash.tfsa.lifetime_limit)}</span>
                </div>
                <Progress value={Math.min(dash.tfsa.lifetime_pct, 100)} className="h-2" />
                <div className="text-xs text-slate-500 mt-1">{fmtR(dash.tfsa.lifetime_remaining)} remaining</div>
              </div>
              <Link to="/tfsa-calculator">
                <Button variant="outline" size="sm" className="w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">
                  Project growth →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-navy-900/60 border-navy-700" data-testid="ra-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <PiggyBank className="h-5 w-5 text-indigo-400" /> Retirement Annuity (RA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">Tax-deductible cap (27.5%)</span>
                  <span className="text-indigo-300 font-medium">{fmtR(dash.ra.contributed_this_year)} / {fmtR(dash.ra.personal_cap)}</span>
                </div>
                <Progress value={Math.min(dash.ra.used_pct, 100)} className="h-2" />
                <div className="text-xs text-slate-500 mt-1">
                  {dash.ra.remaining_to_cap > 0 ? `${fmtR(dash.ra.remaining_to_cap)} can still be deducted this year` : 'Cap reached — well done!'}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Capped at the lower of 27.5% of income or R350,000 per SARS rules.
              </p>
              <Link to="/retirement-tax-calculator">
                <Button variant="outline" size="sm" className="w-full border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10">
                  Tax savings calculator →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Net worth allocation */}
        {allocData.length > 0 && (
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Net Worth Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocData} dataKey="value" nameKey="name" outerRadius={90} label={(d) => `${d.name}`}>
                        {allocData.map((entry, i) => <Cell key={i} fill={CATEGORY_COLORS[entry.key] || '#94a3b8'} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                        formatter={(val) => fmtR(val)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {allocData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-navy-800/40">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[d.key] || '#94a3b8' }} />
                        <span className="text-sm text-slate-300">{d.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{fmtR(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wealth Growth over Time */}
        {history.length >= 2 && (
          <Card className="bg-navy-900/60 border-navy-700" data-testid="wealth-history-card">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" /> Wealth Growth ({history.length} months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                      formatter={(val) => fmtR(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="net_worth" stroke="#10b981" strokeWidth={2.5} name="Net Worth" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="total_assets" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" name="Assets" dot={false} />
                    <Line type="monotone" dataKey="total_liabilities" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" name="Liabilities" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Snapshots are captured automatically each month when you save your profile.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Editable profile */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-emerald-400" /> Your details
            </CardTitle>
            <p className="text-sm text-slate-400">Fill these in to see your real progress. Saved to your account.</p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field label="Age">
              <Input type="number" value={profile.age || ''} onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : null)} data-testid="input-age" className="bg-navy-800 border-navy-600 text-white" />
            </Field>
            <Field label="Retirement age">
              <Input type="number" value={profile.retirement_age || ''} onChange={(e) => updateField('retirement_age', e.target.value ? parseInt(e.target.value) : null)} data-testid="input-retirement-age" className="bg-navy-800 border-navy-600 text-white" />
            </Field>
            <Field label="Risk profile">
              <select
                value={profile.risk_profile || ''}
                onChange={(e) => updateField('risk_profile', e.target.value || null)}
                data-testid="input-risk-profile"
                className="w-full h-10 px-3 rounded-md bg-navy-800 border border-navy-600 text-white text-sm"
              >
                <option value="">—</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </Field>
            <Field label="Annual income (R)">
              <Input type="number" value={profile.annual_income || ''} onChange={(e) => updateField('annual_income', numField(e.target.value))} data-testid="input-income" className="bg-navy-800 border-navy-600 text-white" />
            </Field>
            <Field label="Monthly expenses (R)">
              <Input type="number" value={profile.monthly_expenses || ''} onChange={(e) => updateField('monthly_expenses', numField(e.target.value))} data-testid="input-expenses" className="bg-navy-800 border-navy-600 text-white" />
            </Field>
            <Field label="TFSA this year (R)">
              <Input type="number" value={profile.tfsa_contributed_this_year || ''} onChange={(e) => updateField('tfsa_contributed_this_year', numField(e.target.value))} data-testid="input-tfsa-year" className="bg-navy-800 border-navy-600 text-white" />
            </Field>
            <Field label="TFSA lifetime total (R)">
              <Input type="number" value={profile.tfsa_contributed_lifetime || ''} onChange={(e) => updateField('tfsa_contributed_lifetime', numField(e.target.value))} data-testid="input-tfsa-lifetime" className="bg-navy-800 border-navy-600 text-white" />
            </Field>
            <Field label="RA this year (R)">
              <Input type="number" value={profile.ra_contributed_this_year || ''} onChange={(e) => updateField('ra_contributed_this_year', numField(e.target.value))} data-testid="input-ra-year" className="bg-navy-800 border-navy-600 text-white" />
            </Field>
          </CardContent>
        </Card>

        {/* Assets */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base">Your Assets</CardTitle>
            <Button variant="outline" size="sm" onClick={addAsset} data-testid="add-asset">
              <Plus className="h-3 w-3 mr-1" /> Add asset
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.assets.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No assets yet. Click "Add asset" to start.</p>
            ) : (
              profile.assets.map((a, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center" data-testid={`asset-row-${i}`}>
                  <Input placeholder="Name (e.g. Allan Gray TFSA)" value={a.name} onChange={(e) => updateAsset(i, 'name', e.target.value)} className="col-span-5 bg-navy-800 border-navy-600 text-white" />
                  <select
                    value={a.category || 'other'}
                    onChange={(e) => updateAsset(i, 'category', e.target.value)}
                    className="col-span-3 h-10 px-2 rounded-md bg-navy-800 border border-navy-600 text-white text-sm"
                  >
                    {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <Input type="number" placeholder="Value" value={a.value || ''} onChange={(e) => updateAsset(i, 'value', numField(e.target.value))} className="col-span-3 bg-navy-800 border-navy-600 text-white" />
                  <Button variant="ghost" size="icon" onClick={() => removeAsset(i)} className="text-red-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base">Your Liabilities</CardTitle>
            <Button variant="outline" size="sm" onClick={addLiability} data-testid="add-liability">
              <Plus className="h-3 w-3 mr-1" /> Add liability
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.liabilities.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No liabilities yet.</p>
            ) : (
              profile.liabilities.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center" data-testid={`liability-row-${i}`}>
                  <Input placeholder="Name (e.g. Home loan)" value={l.name} onChange={(e) => updateLiability(i, 'name', e.target.value)} className="col-span-5 bg-navy-800 border-navy-600 text-white" />
                  <Input type="number" placeholder="Balance" value={l.balance || ''} onChange={(e) => updateLiability(i, 'balance', numField(e.target.value))} className="col-span-3 bg-navy-800 border-navy-600 text-white" />
                  <Input type="number" placeholder="Monthly payment (optional)" value={l.monthly_payment || ''} onChange={(e) => updateLiability(i, 'monthly_payment', numField(e.target.value))} className="col-span-3 bg-navy-800 border-navy-600 text-white" />
                  <Button variant="ghost" size="icon" onClick={() => removeLiability(i)} className="text-red-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end sticky bottom-4 z-10">
          <Button onClick={save} disabled={saving} size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 shadow-xl" data-testid="save-profile-btn">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save & Refresh
          </Button>
        </div>

        {/* Quick links */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Tools you might want next</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickLink to="/tfsa-calculator" label="TFSA Growth" />
            <QuickLink to="/tax-planning" label="Tax Planning Hub" />
            <QuickLink to="/living-annuity-calculator" label="Retirement Income" />
            <QuickLink to="/document-reader" label="AI Document Reader" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


const Field = ({ label, children }) => (
  <div>
    <Label className="text-slate-300 text-xs uppercase tracking-wide mb-1 block">{label}</Label>
    {children}
  </div>
);

const MetricCard = ({ label, value, sub, icon: Icon, testid }) => (
  <Card className="bg-navy-900/60 border-navy-700" data-testid={testid}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-emerald-400" />}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </CardContent>
  </Card>
);

const QuickLink = ({ to, label }) => (
  <Link to={to} className="block p-3 rounded-md bg-navy-800/40 border border-navy-700 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all">
    <div className="flex items-center justify-between">
      <span className="text-sm text-white">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-500" />
    </div>
  </Link>
);

export default MyMoney;
