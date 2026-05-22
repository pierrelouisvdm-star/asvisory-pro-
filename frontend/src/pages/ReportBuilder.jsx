import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText, Loader2, Download, Sparkles, Settings, Save,
  CheckCircle2, AlertTriangle, TrendingUp, Shield, PiggyBank,
  ChevronRight, Trash2, Clock, User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const REPORT_TYPES = [
  { value: 'portfolio_review', label: 'Portfolio Review' },
  { value: 'annual_review', label: 'Annual Review' },
  { value: 'retirement_readiness', label: 'Retirement Readiness' },
  { value: 'onboarding', label: 'New Client Onboarding' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'simple', label: 'Simple / Plain Language' },
  { value: 'hnw', label: 'High Net Worth' },
  { value: 'beginner', label: 'Beginner Investor' },
];

// ===== Branding panel (defined outside parent so inputs keep focus) =====
const BrandingPanel = ({ branding, setBranding, onSave, saving }) => (
  <Card className="bg-navy-900/60 border-navy-700" data-testid="branding-panel">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-white">
        <Settings className="h-5 w-5 text-emerald-400" />
        Report Branding
      </CardTitle>
      <p className="text-sm text-slate-400">These details appear on every report you generate.</p>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">
      <div>
        <Label className="text-slate-300">Firm Name</Label>
        <Input
          data-testid="branding-firm-name"
          value={branding.firm_name || ''}
          onChange={(e) => setBranding({ ...branding, firm_name: e.target.value })}
          placeholder="Acme Financial Advisors"
          className="bg-navy-800 border-navy-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">Advisor Name</Label>
        <Input
          data-testid="branding-advisor-name"
          value={branding.advisor_name || ''}
          onChange={(e) => setBranding({ ...branding, advisor_name: e.target.value })}
          className="bg-navy-800 border-navy-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">Advisor Email</Label>
        <Input
          data-testid="branding-advisor-email"
          value={branding.advisor_email || ''}
          onChange={(e) => setBranding({ ...branding, advisor_email: e.target.value })}
          className="bg-navy-800 border-navy-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">Advisor Phone</Label>
        <Input
          data-testid="branding-advisor-phone"
          value={branding.advisor_phone || ''}
          onChange={(e) => setBranding({ ...branding, advisor_phone: e.target.value })}
          className="bg-navy-800 border-navy-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">Logo URL (optional)</Label>
        <Input
          data-testid="branding-logo-url"
          value={branding.logo_url || ''}
          onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
          placeholder="https://yourfirm.co.za/logo.png"
          className="bg-navy-800 border-navy-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">FSP Number</Label>
        <Input
          data-testid="branding-fsp-number"
          value={branding.fsp_number || ''}
          onChange={(e) => setBranding({ ...branding, fsp_number: e.target.value })}
          placeholder="FSP 12345"
          className="bg-navy-800 border-navy-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">Primary Color</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            data-testid="branding-primary-color"
            value={branding.primary_color || '#10B981'}
            onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
            className="h-10 w-16 bg-navy-800 border-navy-600 p-1"
          />
          <Input
            value={branding.primary_color || '#10B981'}
            onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
            className="bg-navy-800 border-navy-600 text-white"
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <Label className="text-slate-300">Disclaimer (printed in footer)</Label>
        <textarea
          data-testid="branding-disclaimer"
          value={branding.disclaimer || ''}
          onChange={(e) => setBranding({ ...branding, disclaimer: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-md bg-navy-800 border border-navy-600 text-white p-2 text-sm"
        />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button
          data-testid="branding-save-btn"
          onClick={onSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Branding
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ===== Report preview (rendered for screen AND for PDF capture) =====
const ReportPreview = React.forwardRef(({ report, branding }, ref) => {
  if (!report) return null;
  const c = report.content || {};
  const primary = branding.primary_color || '#10B981';

  const Section = ({ title, icon: Icon, children }) => (
    <div style={{ marginTop: 20, pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `2px solid ${primary}`, paddingBottom: 6, marginBottom: 10 }}>
        {Icon && <Icon size={18} color={primary} />}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>{children}</div>
    </div>
  );

  return (
    <div
      ref={ref}
      data-testid="report-preview"
      style={{
        background: '#ffffff',
        color: '#0f172a',
        padding: '40px 48px',
        width: 794, // A4 width at 96dpi
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `3px solid ${primary}`, paddingBottom: 14 }}>
        <div>
          {branding.logo_url && (
            <img src={branding.logo_url} alt="logo" crossOrigin="anonymous" style={{ maxHeight: 50, marginBottom: 8 }} />
          )}
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{branding.firm_name || 'Your Firm'}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {branding.advisor_name}
            {branding.advisor_email ? ` · ${branding.advisor_email}` : ''}
            {branding.advisor_phone ? ` · ${branding.advisor_phone}` : ''}
          </div>
          {branding.fsp_number && (
            <div style={{ fontSize: 10, color: '#64748b' }}>{branding.fsp_number}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(report.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
            {report.report_type?.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 24, marginBottom: 8 }}>
        {c.title || 'Client Report'}
      </h1>
      {report.client_name && (
        <div style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>
          Prepared for: <strong>{report.client_name}</strong>
        </div>
      )}

      {/* Executive Summary */}
      {c.executive_summary && (
        <div style={{ background: '#f1f5f9', padding: 16, borderLeft: `4px solid ${primary}`, borderRadius: 4, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Executive Summary</div>
          <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.6 }}>{c.executive_summary}</div>
        </div>
      )}

      {/* Portfolio Breakdown */}
      {c.portfolio_breakdown && (
        <Section title="Portfolio Breakdown" icon={TrendingUp}>
          {c.portfolio_breakdown.total_value != null && (
            <div style={{ fontSize: 18, fontWeight: 700, color: primary, marginBottom: 8 }}>
              Total Value: R {Number(c.portfolio_breakdown.total_value).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
          )}
          {c.portfolio_breakdown.commentary && <p>{c.portfolio_breakdown.commentary}</p>}
          {Array.isArray(c.portfolio_breakdown.holdings) && c.portfolio_breakdown.holdings.length > 0 && (
            <table style={{ width: '100%', marginTop: 10, fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 6, textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Holding</th>
                  <th style={{ padding: 6, textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Value</th>
                  <th style={{ padding: 6, textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {c.portfolio_breakdown.holdings.map((h, i) => (
                  <tr key={i}>
                    <td style={{ padding: 6, borderBottom: '1px solid #e2e8f0' }}>{h.name}</td>
                    <td style={{ padding: 6, textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                      {h.value != null ? `R ${Number(h.value).toLocaleString('en-ZA')}` : '-'}
                    </td>
                    <td style={{ padding: 6, textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>{h.percentage != null ? `${h.percentage}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}

      {/* Fee Analysis */}
      {c.fee_analysis && (
        <Section title="Fee Analysis" icon={AlertTriangle}>
          {c.fee_analysis.commentary && <p>{c.fee_analysis.commentary}</p>}
          {Array.isArray(c.fee_analysis.concerns) && c.fee_analysis.concerns.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {c.fee_analysis.concerns.map((concern, i) => <li key={i} style={{ marginBottom: 4 }}>{concern}</li>)}
            </ul>
          )}
        </Section>
      )}

      {/* Risk */}
      {c.risk_analysis && (
        <Section title="Risk Analysis" icon={Shield}>
          {c.risk_analysis.risk_level && (
            <div style={{ display: 'inline-block', padding: '4px 10px', background: primary, color: 'white', borderRadius: 12, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
              {c.risk_analysis.risk_level}
            </div>
          )}
          {c.risk_analysis.commentary && <p>{c.risk_analysis.commentary}</p>}
        </Section>
      )}

      {/* Retirement Readiness */}
      {c.retirement_readiness && (
        <Section title="Retirement Readiness" icon={PiggyBank}>
          {c.retirement_readiness.score && (
            <div style={{ display: 'inline-block', padding: '4px 10px', background: '#f1f5f9', color: primary, borderRadius: 12, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
              {c.retirement_readiness.score}
            </div>
          )}
          {c.retirement_readiness.commentary && <p>{c.retirement_readiness.commentary}</p>}
        </Section>
      )}

      {/* Tax Efficiency */}
      {c.tax_efficiency?.commentary && (
        <Section title="Tax Efficiency">
          <p>{c.tax_efficiency.commentary}</p>
        </Section>
      )}

      {/* Recommendations */}
      {Array.isArray(c.recommendations) && c.recommendations.length > 0 && (
        <Section title="Recommendations" icon={CheckCircle2}>
          {c.recommendations.map((rec, i) => (
            <div key={i} style={{ marginBottom: 10, padding: 10, background: '#f8fafc', borderLeft: `3px solid ${primary}`, borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ fontSize: 13 }}>{rec.title}</strong>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: rec.priority === 'High' ? '#fee2e2' : rec.priority === 'Medium' ? '#fef3c7' : '#dcfce7', color: rec.priority === 'High' ? '#991b1b' : rec.priority === 'Medium' ? '#92400e' : '#166534' }}>
                  {rec.priority}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12 }}>{rec.rationale}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Outdated Products */}
      {Array.isArray(c.outdated_product_warnings) && c.outdated_product_warnings.length > 0 && (
        <Section title="Product Warnings" icon={AlertTriangle}>
          <ul style={{ paddingLeft: 18 }}>
            {c.outdated_product_warnings.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
          </ul>
        </Section>
      )}

      {/* Client-friendly explanation */}
      {c.client_friendly_explanation && (
        <Section title="In Plain Language">
          <p style={{ fontStyle: 'italic' }}>{c.client_friendly_explanation}</p>
        </Section>
      )}

      {/* Advisor notes - only shown if present */}
      {c.advisor_notes && (
        <Section title="Advisor Notes">
          <p style={{ fontSize: 11, color: '#64748b' }}>{c.advisor_notes}</p>
        </Section>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e2e8f0', fontSize: 9, color: '#94a3b8', lineHeight: 1.5 }}>
        {branding.disclaimer || 'This report is for informational purposes only and does not constitute financial advice.'}
      </div>
    </div>
  );
});
ReportPreview.displayName = 'ReportPreview';


// ===== Main page =====
export const ReportBuilder = () => {
  const { token } = useAuth();
  const previewRef = useRef(null);
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get('client_id');

  const [branding, setBranding] = useState({});
  const [savingBranding, setSavingBranding] = useState(false);

  const [clients, setClients] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [reports, setReports] = useState([]);

  const [selectedClient, setSelectedClient] = useState(prefilledClientId || 'none');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [reportType, setReportType] = useState('portfolio_review');
  const [tone, setTone] = useState('professional');
  const [customNotes, setCustomNotes] = useState('');

  const [generating, setGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Initial load
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [b, c, a, r] = await Promise.all([
          axios.get(`${API_URL}/api/reports/branding`, authHeaders),
          axios.get(`${API_URL}/api/clients`, authHeaders),
          axios.get(`${API_URL}/api/documents/analyses`, authHeaders),
          axios.get(`${API_URL}/api/reports`, authHeaders),
        ]);
        setBranding(b.data || {});
        setClients(c.data || []);
        setAnalyses(a.data.analyses || []);
        setReports(r.data.reports || []);
      } catch (e) {
        console.error('Load failed', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const saveBranding = async () => {
    setSavingBranding(true);
    try {
      const res = await axios.put(`${API_URL}/api/reports/branding`, branding, authHeaders);
      setBranding(res.data.branding);
      toast.success('Branding saved');
    } catch (e) {
      toast.error('Failed to save branding');
    } finally {
      setSavingBranding(false);
    }
  };

  const toggleDoc = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const generate = async () => {
    if (selectedDocIds.length === 0 && selectedClient === 'none' && !customNotes.trim()) {
      toast.error('Pick at least one document, a client, or add notes');
      return;
    }
    setGenerating(true);
    setCurrentReport(null);
    try {
      const res = await axios.post(
        `${API_URL}/api/reports/generate`,
        {
          client_id: selectedClient === 'none' ? null : selectedClient,
          document_analysis_ids: selectedDocIds,
          report_type: reportType,
          tone,
          custom_notes: customNotes || null,
        },
        authHeaders
      );
      if (res.data.success) {
        toast.success('Report generated!');
        setCurrentReport(res.data.report);
        setReports((prev) => [res.data.report, ...prev]);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const filename = `${(currentReport.client_name || 'Client').replace(/\s+/g, '_')}_${currentReport.report_type}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      toast.success('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast.error('PDF export failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const deleteReport = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/reports/${id}`, authHeaders);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (currentReport?.id === id) setCurrentReport(null);
      toast.success('Report deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="report-builder">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-emerald-400" />
            AI Client Report Builder
          </h1>
          <p className="text-slate-400">
            Generate professional, branded client reports in seconds. Powered by GPT-4o.
          </p>
        </div>

        <Tabs defaultValue="build" className="w-full">
          <TabsList className="bg-navy-900 border border-navy-700">
            <TabsTrigger value="build" data-testid="tab-build">Build Report</TabsTrigger>
            <TabsTrigger value="branding" data-testid="tab-branding">Branding</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History ({reports.length})</TabsTrigger>
          </TabsList>

          {/* BUILD TAB */}
          <TabsContent value="build" className="space-y-6 mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">1. Configure</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-slate-300">Client (optional)</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger data-testid="select-client" className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue placeholder="None — generic report" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None — generic report</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger data-testid="select-report-type" className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger data-testid="select-tone" className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-slate-300">Advisor Notes (optional)</Label>
                  <textarea
                    data-testid="input-custom-notes"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Client recently inherited R500k. Wants to maximise tax efficiency..."
                    className="mt-1 w-full rounded-md bg-navy-800 border border-navy-600 text-white p-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">
                  2. Pick Document Analyses ({selectedDocIds.length} selected)
                </CardTitle>
                <p className="text-sm text-slate-400">
                  These come from your AI Document Reader. Upload more from the Document Reader page first if needed.
                </p>
              </CardHeader>
              <CardContent>
                {analyses.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No document analyses yet. Go to <strong>AI Document Reader</strong> first to analyse some statements.
                  </p>
                ) : (
                  <div className="grid gap-2 max-h-72 overflow-y-auto pr-2">
                    {analyses.map((a) => (
                      <label
                        key={a.id}
                        className="flex items-center gap-3 p-3 rounded-md bg-navy-800/50 border border-navy-700 hover:border-emerald-500/40 cursor-pointer"
                        data-testid={`doc-row-${a.id}`}
                      >
                        <Checkbox
                          checked={selectedDocIds.includes(a.id)}
                          onCheckedChange={() => toggleDoc(a.id)}
                          data-testid={`doc-check-${a.id}`}
                        />
                        <FileText className="h-4 w-4 text-emerald-400" />
                        <div className="flex-1">
                          <p className="text-sm text-white">{a.document_type || 'Document'} — {a.file_name}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(a.created_at).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                data-testid="generate-report-btn"
                onClick={generate}
                disabled={generating}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
              >
                {generating ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating with GPT-4o…</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" />Generate AI Report</>
                )}
              </Button>
            </div>

            {/* Preview + Download */}
            {currentReport && (
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    Report Preview
                  </CardTitle>
                  <Button
                    data-testid="download-pdf-btn"
                    onClick={downloadPdf}
                    disabled={downloadingPdf}
                    className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
                  >
                    {downloadingPdf ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building PDF…</>
                    ) : (
                      <><Download className="h-4 w-4 mr-2" />Download PDF</>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto bg-slate-100 rounded-md p-4">
                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                      <ReportPreview ref={previewRef} report={currentReport} branding={branding} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* BRANDING TAB */}
          <TabsContent value="branding" className="mt-4">
            <BrandingPanel
              branding={branding}
              setBranding={setBranding}
              onSave={saveBranding}
              saving={savingBranding}
            />
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-sm text-slate-400">No reports yet. Generate one from the Build tab.</p>
                ) : (
                  <div className="space-y-2">
                    {reports.map((r) => (
                      <div
                        key={r.id}
                        data-testid={`history-row-${r.id}`}
                        className="flex items-center justify-between p-3 rounded-md bg-navy-800/40 border border-navy-700 hover:border-emerald-500/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {r.content?.title || r.report_type}
                            </p>
                            <p className="text-xs text-slate-500">
                              {r.client_name ? `${r.client_name} · ` : ''}
                              {new Date(r.created_at).toLocaleString('en-ZA')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => setCurrentReport(r)}
                            data-testid={`history-open-${r.id}`}
                          >
                            <ChevronRight className="h-4 w-4 mr-1" /> Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteReport(r.id)}
                            data-testid={`history-delete-${r.id}`}
                          >
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

export default ReportBuilder;
