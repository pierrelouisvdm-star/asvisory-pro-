import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Upload, Trash2, Download, Loader2, ArrowLeft, ShieldCheck, AlertCircle, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const fmtR = (v) => (v == null || v === '' ? '—' : `R ${Number(v).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`);

export const IRP5Vault = () => {
  const { token, user } = useAuth();
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState(null);

  const headers = { headers: { Authorization: `Bearer ${token}` } };
  const backHref = user?.role === 'advisor' ? '/dashboard' : '/my-money';
  const backLabel = user?.role === 'advisor' ? 'Back to Dashboard' : 'Back to My Money';

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/me/irp5/list`, headers);
      setDocs(res.data.documents || []);
    } catch (e) {
      toast.error('Failed to load IRP5s');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File too large (max 15MB)');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`${API_URL}/api/me/irp5/upload`, form, {
        headers: { ...headers.headers, 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Uploaded ${res.data.document.original_filename}`);
      setOpenId(res.data.document.id);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this IRP5? You can re-upload it any time.')) return;
    try {
      await axios.delete(`${API_URL}/api/me/irp5/${id}`, headers);
      toast.success('Deleted');
      if (openId === id) setOpenId(null);
      await load();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const download = (doc) => {
    const url = `${API_URL}/api/me/irp5/${doc.id}/download?auth=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  };

  const open = docs.find((d) => d.id === openId);

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="irp5-vault-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link to={backHref} className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 mb-2">
              <ArrowLeft className="h-3 w-3" /> {backLabel}
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
              IRP5 Vault
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Store your IRP5 tax certificates securely. We parse the SARS source codes (3601, 4001, 4102 …) so tax season is one less worry.
            </p>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={onUpload}
              data-testid="irp5-file-input"
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
              data-testid="irp5-upload-btn"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading & parsing…' : 'Upload IRP5'}
            </Button>
          </div>
        </div>

        {/* Privacy note */}
        <Card className="bg-emerald-500/5 border-emerald-500/30">
          <CardContent className="p-4 flex items-start gap-3 text-sm text-emerald-100">
            <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Private by default.</strong> Only you can see your IRP5s. Files are stored encrypted and scoped to your account — never shared with advisors unless you explicitly link them.
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Your IRP5s ({docs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
            ) : docs.length === 0 ? (
              <div className="text-center py-10 text-slate-400" data-testid="irp5-empty">
                <FileText className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No IRP5s uploaded yet.</p>
                <p className="text-xs mt-1">Upload your latest IRP5 to extract the source codes automatically.</p>
              </div>
            ) : (
              <div className="space-y-2" data-testid="irp5-list">
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer ${
                      openId === d.id
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-navy-800/40 border-navy-700 hover:border-emerald-500/30'
                    }`}
                    onClick={() => setOpenId(d.id)}
                    data-testid={`irp5-row-${d.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium truncate">{d.original_filename}</span>
                        {d.tax_year && <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-300">TY {d.tax_year}</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(d.created_at).toLocaleDateString()} · {Math.round((d.size || 0) / 1024)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => download(d)} className="h-8 w-8 text-slate-400 hover:text-emerald-400" data-testid={`irp5-download-${d.id}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(d.id)} className="h-8 w-8 text-slate-400 hover:text-red-400" data-testid={`irp5-delete-${d.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parsed detail */}
        {open && (
          <Card className="bg-navy-900/60 border-emerald-500/30" data-testid="irp5-detail">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Parsed details — {open.original_filename}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {open.parsed?.error ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-start gap-2 text-amber-200">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Could not auto-parse this file ({open.parsed.error}). The file is safely stored — you can still download it.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatTile label="Tax year" value={open.parsed?.tax_year || '—'} />
                    <StatTile label="Employer" value={open.parsed?.employer_name || '—'} />
                    <StatTile label="PAYE ref" value={open.parsed?.employer_paye_ref || '—'} />
                    <StatTile label="Gross remuneration" value={fmtR(open.parsed?.gross_remuneration)} />
                  </div>

                  <DetailGroup
                    title="Income (source codes)"
                    rows={open.parsed?.income_received}
                    labels={{
                      '3601_income': '3601 – Income',
                      '3605_annual_payment': '3605 – Annual payment',
                      '3697_gross_retirement_funding_income': '3697 – Retirement-funding income',
                      '3698_gross_non_retirement_funding_income': '3698 – Non-retirement-funding income',
                    }}
                  />
                  <DetailGroup
                    title="Deductions"
                    rows={open.parsed?.deductions}
                    labels={{
                      '4001_pension_fund': '4001 – Pension fund',
                      '4002_arrears_pension': '4002 – Arrears pension',
                      '4003_provident_fund': '4003 – Provident fund',
                      '4006_retirement_annuity': '4006 – Retirement annuity',
                      '4005_medical_aid': '4005 – Medical aid',
                      '4474_employer_medical_contribution': '4474 – Employer medical',
                    }}
                  />
                  <DetailGroup
                    title="Tax paid"
                    rows={open.parsed?.tax_paid}
                    labels={{
                      '4101_site': '4101 – SITE',
                      '4102_paye': '4102 – PAYE',
                      '4103_total_tax': '4103 – Total tax',
                      '4141_uif': '4141 – UIF',
                      '4142_sdl': '4142 – SDL',
                    }}
                  />
                  {open.parsed?.key_observations && (
                    <div className="p-3 rounded-md bg-navy-800/60 border border-navy-700 text-slate-300">
                      <span className="text-xs uppercase tracking-wide text-emerald-400">Observation</span>
                      <p className="mt-1">{open.parsed.key_observations}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const StatTile = ({ label, value }) => (
  <div className="p-3 rounded-md bg-navy-800/60 border border-navy-700">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-white text-sm font-semibold mt-1 truncate">{value}</div>
  </div>
);

const DetailGroup = ({ title, rows, labels }) => {
  const entries = Object.entries(labels)
    .map(([k, label]) => [label, rows?.[k]])
    .filter(([, v]) => v != null && v !== 0);
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">{title}</div>
      <div className="rounded-md border border-navy-700 divide-y divide-navy-700 overflow-hidden">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-3 py-2 bg-navy-800/40">
            <span className="text-slate-300">{label}</span>
            <span className="text-white font-medium">{fmtR(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IRP5Vault;
