import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Layers, FileText, Loader2, Trash2, Clock, Sparkles, CheckCircle2,
  AlertTriangle, TrendingUp, PieChart as PieIcon, Wallet, Target, Shield,
  ScrollText, Lightbulb
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const ASSET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export const PortfolioReview = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get('client_id');

  const [clients, setClients] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [clientId, setClientId] = useState(prefilledClientId || 'none');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [advisorNotes, setAdvisorNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [c, a, r] = await Promise.all([
          axios.get(`${API_URL}/api/clients`, authHeaders),
          axios.get(`${API_URL}/api/documents/analyses`, authHeaders),
          axios.get(`${API_URL}/api/portfolio-review`, authHeaders),
        ]);
        setClients(c.data || []);
        setAnalyses(a.data.analyses || []);
        setReviews(r.data.reviews || []);
      } catch (err) {
        console.error('Load failed', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleDoc = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const generate = async () => {
    if (selectedDocIds.length === 0) {
      toast.error('Pick at least one document');
      return;
    }
    setGenerating(true);
    setCurrent(null);
    try {
      const res = await axios.post(
        `${API_URL}/api/portfolio-review/generate`,
        {
          document_analysis_ids: selectedDocIds,
          client_id: clientId === 'none' ? null : clientId,
          advisor_notes: advisorNotes || null,
        },
        authHeaders
      );
      if (res.data.success) {
        toast.success('Consolidated review generated');
        setCurrent(res.data.review);
        setReviews((prev) => [res.data.review, ...prev]);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const deleteReview = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/portfolio-review/${id}`, authHeaders);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (current?.id === id) setCurrent(null);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="portfolio-review-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Layers className="h-7 w-7 text-emerald-400" />
            Multi-Document Portfolio Review
          </h1>
          <p className="text-slate-400">
            Aggregate 3+ documents (RA, TFSA, endowment, unit trusts, life cover…) into one consolidated AI view —
            fees, diversification, outdated products and recommendations across the entire book.
          </p>
        </div>

        <Tabs defaultValue="build" className="w-full">
          <TabsList className="bg-navy-900 border border-navy-700">
            <TabsTrigger value="build" data-testid="tab-build">Build Review</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="space-y-6 mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">1. Pick client (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger data-testid="select-client" className="bg-navy-800 border-navy-600 text-white">
                    <SelectValue placeholder="None — anonymous review" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — anonymous review</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">
                  2. Pick documents to aggregate ({selectedDocIds.length} selected)
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Recommended: 3+ documents covering different product types (RA, TFSA, endowment, etc.). Upload more via the AI Document Reader.
                </p>
              </CardHeader>
              <CardContent>
                {analyses.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No document analyses yet. Go to <strong>AI Document Reader</strong> first to analyse statements.
                  </p>
                ) : (
                  <div className="grid gap-2 max-h-72 overflow-y-auto pr-2">
                    {analyses.map((a) => (
                      <label
                        key={a.id}
                        data-testid={`doc-row-${a.id}`}
                        className="flex items-center gap-3 p-3 rounded-md bg-navy-800/50 border border-navy-700 hover:border-emerald-500/40 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedDocIds.includes(a.id)}
                          onCheckedChange={() => toggleDoc(a.id)}
                          data-testid={`doc-check-${a.id}`}
                        />
                        <FileText className="h-4 w-4 text-emerald-400" />
                        <div className="flex-1">
                          <p className="text-sm text-white">{a.document_type || 'Document'} — {a.file_name}</p>
                          <p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString('en-ZA')}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">3. Advisor context (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-slate-300">Anything else the AI should know</Label>
                <textarea
                  value={advisorNotes}
                  onChange={(e) => setAdvisorNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Client wants to retire at 58, has a R3M paid-off home not in these docs, prefers low-fee passive products..."
                  data-testid="input-advisor-notes"
                  className="mt-1 w-full rounded-md bg-navy-800 border border-navy-600 text-white p-2 text-sm"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={generate}
                disabled={generating}
                size="lg"
                data-testid="generate-review-btn"
                className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
              >
                {generating ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Aggregating with GPT-4o…</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" />Generate Consolidated Review</>
                )}
              </Button>
            </div>

            {current && <ReviewOutput review={current} />}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" /> Recent reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-400">No reviews yet.</p>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        data-testid={`history-row-${r.id}`}
                        className="flex items-center justify-between p-3 rounded-md bg-navy-800/40 border border-navy-700 hover:border-emerald-500/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {r.content?.title || 'Portfolio Review'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {r.client_name ? `${r.client_name} · ` : ''}
                              {r.document_count} docs · {new Date(r.created_at).toLocaleString('en-ZA')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10" onClick={() => setCurrent(r)} data-testid={`history-open-${r.id}`}>Open</Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => deleteReview(r.id)} data-testid={`history-delete-${r.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};


// ---------- Output renderer ----------

const Section = ({ title, icon: Icon, children, accent = 'emerald' }) => (
  <Card className="bg-navy-900/60 border-navy-700">
    <CardHeader className="pb-3">
      <CardTitle className="text-white flex items-center gap-2 text-base">
        {Icon && <Icon className={`h-5 w-5 text-${accent}-400`} />}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-slate-300 space-y-2">{children}</CardContent>
  </Card>
);

const parsePercent = (s) => {
  if (s == null) return 0;
  const m = String(s).match(/(-?\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
};

const ReviewOutput = ({ review }) => {
  const c = review.content || {};

  if (c._parse_error) {
    return (
      <Card className="bg-navy-900/60 border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-white">Raw output (JSON parse failed)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{c.raw_text}</pre>
        </CardContent>
      </Card>
    );
  }

  const m = c.aggregate_metrics || {};
  const allocData = m.asset_allocation
    ? Object.entries(m.asset_allocation)
        .map(([k, v]) => ({ name: k, value: parsePercent(v) }))
        .filter((d) => d.value > 0)
    : [];

  const productData = Array.isArray(c.product_breakdown)
    ? c.product_breakdown
        .filter((p) => p.value)
        .map((p) => ({ name: p.product?.slice(0, 18) || 'Product', value: Number(p.value) }))
    : [];

  const verdictColor = {
    Keep: 'bg-emerald-500/20 text-emerald-300',
    Review: 'bg-amber-500/20 text-amber-300',
    Switch: 'bg-orange-500/20 text-orange-300',
    Exit: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="space-y-4" data-testid="review-output">
      {/* Header */}
      <Card className="bg-gradient-to-br from-emerald-950/40 to-navy-900 border-emerald-500/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              {c.title || 'Portfolio Review'}
            </h2>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {review.document_count} docs aggregated
            </Badge>
          </div>
          {c.executive_summary && (
            <p className="text-slate-200 leading-relaxed" data-testid="exec-summary">{c.executive_summary}</p>
          )}
        </CardContent>
      </Card>

      {/* Aggregate Metrics */}
      <div className="grid md:grid-cols-4 gap-3">
        <MetricTile label="Total Value" value={m.total_value != null ? `R ${Number(m.total_value).toLocaleString('en-ZA')}` : '—'} icon={Wallet} />
        <MetricTile label="Products" value={m.number_of_products || '—'} icon={Layers} />
        <MetricTile label="Weighted EAC" value={m.weighted_eac_estimate || '—'} icon={TrendingUp} />
        <MetricTile label="Annual Fees" value={m.annual_fees_estimate != null ? `R ${Number(m.annual_fees_estimate).toLocaleString('en-ZA')}` : '—'} icon={AlertTriangle} />
      </div>

      {/* Asset allocation chart */}
      {allocData.length > 0 && (
        <Section title="Asset Allocation" icon={PieIcon}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocData} dataKey="value" nameKey="name" outerRadius={90} label={(d) => `${d.name} ${d.value}%`}>
                    {allocData.map((_, i) => <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {Array.isArray(m.tax_wrappers_used) && m.tax_wrappers_used.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tax wrappers in use</div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.tax_wrappers_used.map((w, i) => (
                      <Badge key={i} className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{w}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Product breakdown */}
      {Array.isArray(c.product_breakdown) && c.product_breakdown.length > 0 && (
        <Section title="Product Breakdown" icon={ScrollText}>
          {productData.length > 0 && (
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-navy-700">
                <th className="text-left py-2">Product</th>
                <th className="text-right py-2">Value</th>
                <th className="text-right py-2">Weight</th>
                <th className="text-right py-2">TER/EAC</th>
                <th className="text-center py-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {c.product_breakdown.map((p, i) => (
                <tr key={i} className="border-b border-navy-700/50">
                  <td className="py-2">
                    <div className="font-medium text-slate-200">{p.product}</div>
                    {p.verdict_reason && <div className="text-[10px] text-slate-500 mt-0.5">{p.verdict_reason}</div>}
                  </td>
                  <td className="py-2 text-right">{p.value != null ? `R ${Number(p.value).toLocaleString('en-ZA')}` : '—'}</td>
                  <td className="py-2 text-right">{p.weight || '—'}</td>
                  <td className="py-2 text-right">{p.ter_eac || '—'}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${verdictColor[p.verdict] || 'bg-slate-700/40 text-slate-400'}`}>
                      {p.verdict || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Fee Audit */}
      {c.fee_audit && (
        <Section title="Fee Audit" icon={AlertTriangle} accent="amber">
          {c.fee_audit.commentary && <p>{c.fee_audit.commentary}</p>}
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {c.fee_audit.estimated_annual_fee_drag_rand != null && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30">
                <div className="text-xs text-amber-300">Estimated annual fee drag</div>
                <div className="text-lg font-bold text-white">R {Number(c.fee_audit.estimated_annual_fee_drag_rand).toLocaleString('en-ZA')}</div>
              </div>
            )}
            {c.fee_audit['10yr_fee_cost_estimate'] != null && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30">
                <div className="text-xs text-amber-300">10-year fee cost estimate</div>
                <div className="text-lg font-bold text-white">R {Number(c.fee_audit['10yr_fee_cost_estimate']).toLocaleString('en-ZA')}</div>
              </div>
            )}
          </div>
          {Array.isArray(c.fee_audit.concerns) && c.fee_audit.concerns.length > 0 && (
            <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-200">
              {c.fee_audit.concerns.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          )}
        </Section>
      )}

      {/* Diversification */}
      {c.diversification_analysis && (
        <Section title="Diversification" icon={Shield}>
          {c.diversification_analysis.score && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{c.diversification_analysis.score}</Badge>
          )}
          {c.diversification_analysis.asset_class_commentary && <p className="mt-2">{c.diversification_analysis.asset_class_commentary}</p>}
          {c.diversification_analysis.geographic_commentary && (
            <p><strong className="text-slate-200">Geography:</strong> {c.diversification_analysis.geographic_commentary}</p>
          )}
          {Array.isArray(c.diversification_analysis.concentration_risks) && c.diversification_analysis.concentration_risks.length > 0 && (
            <div className="mt-2">
              <div className="text-xs uppercase text-slate-500 mb-1">Concentration risks</div>
              <ul className="list-disc pl-5 space-y-1">{c.diversification_analysis.concentration_risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
        </Section>
      )}

      {/* Outdated Product Warnings */}
      {Array.isArray(c.outdated_product_warnings) && c.outdated_product_warnings.length > 0 && (
        <Section title="Outdated / Expensive Products" icon={AlertTriangle} accent="red">
          <div className="space-y-2">
            {c.outdated_product_warnings.map((w, i) => (
              <div key={i} className="p-3 rounded bg-red-500/10 border border-red-500/30">
                <div className="font-medium text-red-200">{w.product}</div>
                <div className="text-xs text-slate-300 mt-1"><strong>Issue:</strong> {w.issue}</div>
                <div className="text-xs text-emerald-300 mt-1"><strong>Action:</strong> {w.recommended_action}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Retirement Readiness */}
      {c.retirement_readiness && (
        <Section title="Retirement Readiness" icon={Target}>
          {c.retirement_readiness.score && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{c.retirement_readiness.score}</Badge>
          )}
          {c.retirement_readiness.commentary && <p className="mt-2">{c.retirement_readiness.commentary}</p>}
          {c.retirement_readiness.estimated_replacement_ratio && (
            <p><strong className="text-slate-200">Income replacement:</strong> {c.retirement_readiness.estimated_replacement_ratio}</p>
          )}
        </Section>
      )}

      {/* Tax Efficiency */}
      {c.tax_efficiency && (
        <Section title="Tax Efficiency" icon={Wallet}>
          {c.tax_efficiency.tfsa_utilisation && <p><strong className="text-slate-200">TFSA:</strong> {c.tax_efficiency.tfsa_utilisation}</p>}
          {c.tax_efficiency.ra_deduction_optimised && <p><strong className="text-slate-200">RA deduction:</strong> {c.tax_efficiency.ra_deduction_optimised}</p>}
          {c.tax_efficiency.cgt_position && <p><strong className="text-slate-200">CGT:</strong> {c.tax_efficiency.cgt_position}</p>}
          {c.tax_efficiency.estate_planning_notes && <p><strong className="text-slate-200">Estate:</strong> {c.tax_efficiency.estate_planning_notes}</p>}
        </Section>
      )}

      {/* Recommendations */}
      {Array.isArray(c.recommendations) && c.recommendations.length > 0 && (
        <Section title="Prioritised Recommendations" icon={Lightbulb}>
          <div className="space-y-2">
            {c.recommendations.map((rec, i) => (
              <div key={i} className="p-3 rounded bg-navy-800/60 border-l-4" style={{ borderLeftColor: rec.priority === 'High' ? '#ef4444' : rec.priority === 'Medium' ? '#f59e0b' : '#10b981' }}>
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-white">{rec.title}</strong>
                  <Badge className={rec.priority === 'High' ? 'bg-red-500/20 text-red-300' : rec.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-xs">{rec.rationale}</p>
                {rec.estimated_impact && <p className="text-[10px] text-emerald-300 mt-1"><strong>Impact:</strong> {rec.estimated_impact}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Client-friendly summary */}
      {c.client_friendly_summary && (
        <Section title="Client-Friendly Summary (plain language)">
          <p className="italic text-slate-200 leading-relaxed">{c.client_friendly_summary}</p>
        </Section>
      )}
    </div>
  );
};

const MetricTile = ({ label, value, icon: Icon }) => (
  <Card className="bg-navy-900/60 border-navy-700">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-emerald-400" />}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </CardContent>
  </Card>
);

export default PortfolioReview;
