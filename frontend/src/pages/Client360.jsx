import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User, FileText, Mail, ShieldCheck, Layers, Sparkles,
  Loader2, ChevronLeft, MessageCircle, ScrollText,
  ArrowRight, AlertCircle, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const KIND_META = {
  document: { label: 'Document', icon: FileText, color: 'sky' },
  report: { label: 'Client Report', icon: Sparkles, color: 'emerald' },
  email: { label: 'Email', icon: Mail, color: 'amber' },
  compliance: { label: 'Compliance', icon: ShieldCheck, color: 'rose' },
  portfolio_review: { label: 'Portfolio Review', icon: Layers, color: 'indigo' },
};

export const Client360 = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !clientId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/client-360/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.detail || 'Failed to load client');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <Card className="max-w-md bg-navy-900 border-red-500/30">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-white">{error || 'Client not found'}</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/clients')}>
              Back to clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { client, counts, timeline, documents, reports, emails, compliance, portfolio_reviews } = data;

  const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();

  // Smart actions navigate to the relevant tool, passing the client id via query string.
  const smartActions = [
    {
      label: 'Generate Portfolio Review',
      sublabel: 'Aggregate this client\'s documents',
      icon: Layers,
      color: 'indigo',
      path: `/portfolio-review?client_id=${clientId}`,
      disabled: counts.documents === 0,
      hint: counts.documents === 0 ? 'Upload documents first' : null,
    },
    {
      label: 'Draft Email',
      sublabel: 'Review, follow-up or reminder',
      icon: Mail,
      color: 'amber',
      path: `/email-generator?client_id=${clientId}`,
    },
    {
      label: 'New Compliance Record',
      sublabel: 'RoA, file note, risk profile',
      icon: ShieldCheck,
      color: 'rose',
      path: `/compliance-notes?client_id=${clientId}`,
    },
    {
      label: 'Build Client Report',
      sublabel: 'Branded PDF for this client',
      icon: Sparkles,
      color: 'emerald',
      path: `/report-builder?client_id=${clientId}`,
    },
  ];

  const navigateToTool = (path, disabled, hint) => {
    if (disabled) {
      toast.info(hint || 'Action unavailable');
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="client-360-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/clients" className="hover:text-white flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Clients
          </Link>
          <span>/</span>
          <span className="text-white">{fullName || 'Client'}</span>
        </div>

        {/* Header */}
        <Card className="bg-gradient-to-br from-emerald-950/40 to-navy-900 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl font-bold text-emerald-300">
                  {(client.first_name?.[0] || 'C').toUpperCase()}{(client.last_name?.[0] || '').toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white" data-testid="client-name">{fullName || 'Client'}</h1>
                  <div className="text-sm text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {client.email && <span>{client.email}</span>}
                    {client.phone && <span>{client.phone}</span>}
                    {client.age && <span>Age {client.age}</span>}
                    {client.risk_profile && <Badge variant="outline" className="text-emerald-300 border-emerald-500/30">{client.risk_profile}</Badge>}
                  </div>
                  {client.financial_goals && (
                    <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                      <strong className="text-emerald-400">Goals: </strong>{client.financial_goals}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate(`/clients/${clientId}`)}>
                Edit Client
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="client-360-stats">
          {Object.entries(KIND_META).map(([k, meta]) => {
            const Icon = meta.icon;
            const countKey = k === 'portfolio_review' ? 'portfolio_reviews' : k === 'document' ? 'documents' : k === 'report' ? 'reports' : k === 'email' ? 'emails' : 'compliance';
            return (
              <Card key={k} className="bg-navy-900/60 border-navy-700" data-testid={`stat-${k}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">{meta.label}</span>
                    <Icon className={`h-4 w-4 text-${meta.color}-400`} />
                  </div>
                  <div className="text-2xl font-bold text-white">{counts[countKey] || 0}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Smart Actions */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" /> Smart Actions
            </CardTitle>
            <p className="text-sm text-slate-400">One click to launch any AI tool pre-loaded with this client.</p>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {smartActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  data-testid={`smart-action-${a.label.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => navigateToTool(a.path, a.disabled, a.hint)}
                  className={`text-left p-4 rounded-xl border-2 border-${a.color}-500/30 bg-${a.color}-500/5 hover:bg-${a.color}-500/15 transition-all ${a.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 text-${a.color}-300`} />
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="text-sm font-semibold text-white">{a.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{a.hint || a.sublabel}</div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="bg-navy-900 border border-navy-700">
            <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports ({counts.reports})</TabsTrigger>
            <TabsTrigger value="portfolio_reviews" data-testid="tab-portfolio-reviews">Reviews ({counts.portfolio_reviews})</TabsTrigger>
            <TabsTrigger value="emails" data-testid="tab-emails">Emails ({counts.emails})</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance ({counts.compliance})</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents ({counts.documents})</TabsTrigger>
          </TabsList>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-400" /> Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Nothing recorded yet. Use a Smart Action above to create the first item for this client.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {timeline.map((item, i) => {
                      const meta = KIND_META[item.kind];
                      const Icon = meta?.icon || FileText;
                      return (
                        <div
                          key={`${item.kind}-${item.id}-${i}`}
                          data-testid={`timeline-row-${i}`}
                          className="flex items-center gap-3 p-3 rounded-md bg-navy-800/40 border border-navy-700"
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${meta.color}-500/10 text-${meta.color}-400`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.title}</p>
                            <p className="text-xs text-slate-500">
                              <Badge className={`bg-${meta.color}-500/10 text-${meta.color}-300 border-${meta.color}-500/30 mr-2`}>{meta.label}</Badge>
                              {item.subtitle && <span>{item.subtitle} · </span>}
                              {item.created_at && new Date(item.created_at).toLocaleString('en-ZA')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS */}
          <TabsContent value="reports" className="mt-4">
            <ItemList items={reports} emptyMsg="No reports yet for this client." renderTitle={(r) => r.content?.title || r.report_type} renderSubtitle={(r) => r.report_type} />
          </TabsContent>

          {/* PORTFOLIO REVIEWS */}
          <TabsContent value="portfolio_reviews" className="mt-4">
            <ItemList items={portfolio_reviews} emptyMsg="No portfolio reviews yet for this client." renderTitle={(r) => r.content?.title || 'Portfolio Review'} renderSubtitle={(r) => `${r.document_count} docs aggregated`} />
          </TabsContent>

          {/* EMAILS */}
          <TabsContent value="emails" className="mt-4">
            <ItemList items={emails} emptyMsg="No emails generated for this client yet." renderTitle={(e) => e.content?.subject || e.template_type} renderSubtitle={(e) => `${e.template_type} · ${e.tone}`} />
          </TabsContent>

          {/* COMPLIANCE */}
          <TabsContent value="compliance" className="mt-4">
            <ItemList items={compliance} emptyMsg="No compliance records yet for this client." renderTitle={(c) => c.content?.title || c.record_type} renderSubtitle={(c) => c.record_type} />
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="mt-4">
            <ItemList items={documents} emptyMsg="No documents linked to this client yet." renderTitle={(d) => d.file_name} renderSubtitle={(d) => d.document_type} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};


const ItemList = ({ items, emptyMsg, renderTitle, renderSubtitle }) => (
  <Card className="bg-navy-900/60 border-navy-700">
    <CardContent className="p-4">
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">{emptyMsg}</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-3 rounded-md bg-navy-800/40 border border-navy-700">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{renderTitle(it)}</p>
                <p className="text-xs text-slate-500">
                  {renderSubtitle(it)} · {it.created_at && new Date(it.created_at).toLocaleString('en-ZA')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default Client360;
