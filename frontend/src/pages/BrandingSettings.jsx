import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings, Save, Loader2, Upload, Trash2, Palette, ArrowLeft, Image as ImageIcon, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const DEFAULT_BRANDING = {
  firm_name: '',
  advisor_name: '',
  advisor_email: '',
  advisor_phone: '',
  logo_url: '',
  primary_color: '#10B981',
  disclaimer: '',
  fsp_number: '',
};

const PRESET_COLORS = ['#10B981', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#1f2937'];

export const BrandingSettings = () => {
  const { token } = useAuth();
  const fileRef = useRef(null);
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/reports/branding`, headers);
      setBranding({ ...DEFAULT_BRANDING, ...(res.data || {}) });
    } catch (e) {
      toast.error('Failed to load branding');
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
      await axios.put(`${API_URL}/api/reports/branding`, branding, headers);
      toast.success('Branding saved — your next report and email will use it.');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Logo too large (max 500KB).');
      return;
    }
    setLogoBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`${API_URL}/api/reports/branding/logo`, form, {
        headers: { ...headers.headers, 'Content-Type': 'multipart/form-data' },
      });
      setBranding((b) => ({ ...b, logo_url: res.data.logo_url }));
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Logo upload failed');
    } finally {
      setLogoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeLogo = async () => {
    if (!window.confirm('Remove logo?')) return;
    setLogoBusy(true);
    try {
      await axios.delete(`${API_URL}/api/reports/branding/logo`, headers);
      setBranding((b) => ({ ...b, logo_url: '' }));
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setLogoBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const primary = branding.primary_color || '#10B981';

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="branding-settings-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <Link to="/dashboard" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Palette className="h-7 w-7 text-emerald-400" />
            Practice Branding
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Your logo, firm name and brand colour flow through every <strong className="text-white">AI-generated report</strong> and <strong className="text-white">client email signature</strong>.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo */}
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div
                    className="h-20 w-40 rounded-md border border-navy-600 bg-white flex items-center justify-center overflow-hidden"
                    data-testid="branding-logo-preview"
                  >
                    {branding.logo_url ? (
                      <img src={branding.logo_url} alt="Firm logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400">No logo</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      className="hidden"
                      onChange={onLogoSelect}
                      data-testid="branding-logo-file"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileRef.current?.click()}
                      disabled={logoBusy}
                      data-testid="branding-logo-upload-btn"
                    >
                      {logoBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {branding.logo_url ? 'Replace' : 'Upload logo'}
                    </Button>
                    {branding.logo_url && (
                      <Button
                        variant="ghost"
                        onClick={removeLogo}
                        disabled={logoBusy}
                        className="text-red-400 hover:text-red-300"
                        data-testid="branding-logo-remove-btn"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">PNG / JPG / SVG / WEBP up to 500KB. Embedded directly in PDF reports.</p>
              </CardContent>
            </Card>

            {/* Firm + advisor */}
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-400" />
                  Firm & Advisor
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Firm Name">
                  <Input
                    data-testid="branding-firm-name"
                    value={branding.firm_name || ''}
                    onChange={(e) => setBranding({ ...branding, firm_name: e.target.value })}
                    placeholder="Acme Financial Advisors"
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </Field>
                <Field label="FSP Number">
                  <Input
                    data-testid="branding-fsp-number"
                    value={branding.fsp_number || ''}
                    onChange={(e) => setBranding({ ...branding, fsp_number: e.target.value })}
                    placeholder="FSP 12345"
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </Field>
                <Field label="Advisor Name">
                  <Input
                    data-testid="branding-advisor-name"
                    value={branding.advisor_name || ''}
                    onChange={(e) => setBranding({ ...branding, advisor_name: e.target.value })}
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </Field>
                <Field label="Advisor Email">
                  <Input
                    data-testid="branding-advisor-email"
                    value={branding.advisor_email || ''}
                    onChange={(e) => setBranding({ ...branding, advisor_email: e.target.value })}
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </Field>
                <Field label="Advisor Phone">
                  <Input
                    data-testid="branding-advisor-phone"
                    value={branding.advisor_phone || ''}
                    onChange={(e) => setBranding({ ...branding, advisor_phone: e.target.value })}
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </Field>
              </CardContent>
            </Card>

            {/* Colour */}
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-emerald-400" />
                  Brand Colour
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Input
                    type="color"
                    data-testid="branding-primary-color"
                    value={primary}
                    onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                    className="h-10 w-16 bg-navy-800 border-navy-600 p-1 cursor-pointer"
                  />
                  <Input
                    value={primary}
                    onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                    className="bg-navy-800 border-navy-600 text-white w-32 uppercase"
                  />
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBranding({ ...branding, primary_color: c })}
                        className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          primary.toLowerCase() === c.toLowerCase() ? 'border-white ring-2 ring-emerald-400' : 'border-navy-600'
                        }`}
                        style={{ background: c }}
                        aria-label={`Use ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Used for headings, section dividers and accents in reports.</p>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white text-base">Footer Disclaimer</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  data-testid="branding-disclaimer"
                  value={branding.disclaimer || ''}
                  onChange={(e) => setBranding({ ...branding, disclaimer: e.target.value })}
                  rows={4}
                  placeholder="This report is for informational purposes only and does not constitute financial advice…"
                  className="w-full rounded-md bg-navy-800 border border-navy-600 text-white p-3 text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">Appears at the bottom of every PDF report.</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: live preview */}
          <div className="lg:col-span-1">
            <Card className="bg-navy-900/60 border-navy-700 sticky top-6" data-testid="branding-preview">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Report Header Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-white rounded-md p-4 text-slate-900"
                  style={{ borderTop: `4px solid ${primary}` }}
                >
                  {branding.logo_url && (
                    <img src={branding.logo_url} alt="Logo" className="max-h-10 mb-2" />
                  )}
                  <div className="text-base font-bold" style={{ color: '#0f172a' }}>
                    {branding.firm_name || 'Your Firm'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {branding.advisor_name || 'Your Name'}
                    {branding.advisor_email ? ` · ${branding.advisor_email}` : ''}
                  </div>
                  {branding.advisor_phone && (
                    <div className="text-[11px] text-slate-500">{branding.advisor_phone}</div>
                  )}
                  {branding.fsp_number && (
                    <div className="text-[10px] text-slate-500 mt-0.5">{branding.fsp_number}</div>
                  )}
                  <div className="mt-3 pt-2" style={{ borderTop: `2px solid ${primary}` }}>
                    <div className="text-xs font-semibold" style={{ color: primary }}>
                      EXECUTIVE SUMMARY
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Sample report section using your accent colour.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Generate any report via <Link to="/report-builder" className="text-emerald-400 hover:underline">Report Builder</Link> to see your branding live.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-4 flex justify-end z-10">
          <Button
            onClick={save}
            disabled={saving}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 shadow-xl"
            data-testid="branding-save-btn"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Branding
          </Button>
        </div>
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

export default BrandingSettings;
