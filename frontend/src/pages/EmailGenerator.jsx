import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail, MessageCircle, FileText, Loader2, Copy, Trash2, Clock,
  Sparkles, Send, Plus, X, CheckCircle2, Phone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const TEMPLATE_LABELS = {
  review_email: { label: 'Portfolio Review Email', icon: Mail, channel: 'email' },
  follow_up: { label: 'Meeting Follow-up', icon: Mail, channel: 'email' },
  meeting_summary: { label: 'Meeting Summary / File Note', icon: FileText, channel: 'note' },
  whatsapp_brief: { label: 'WhatsApp Brief', icon: MessageCircle, channel: 'whatsapp' },
  onboarding: { label: 'New Client Onboarding', icon: Mail, channel: 'email' },
  annual_review_reminder: { label: 'Annual Review Reminder', icon: Mail, channel: 'email' },
  market_update: { label: 'Market Update Email', icon: Mail, channel: 'email' },
  custom: { label: 'Custom / Free-form', icon: Sparkles, channel: 'email' },
};

const TONE_LABELS = {
  professional: 'Professional',
  simple: 'Simple / Plain',
  hnw: 'High Net Worth',
  beginner: 'Beginner Investor',
};

export const EmailGenerator = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get('client_id');

  const [clients, setClients] = useState([]);
  const [emails, setEmails] = useState([]);

  const [templateType, setTemplateType] = useState('review_email');
  const [tone, setTone] = useState('professional');
  const [clientId, setClientId] = useState(prefilledClientId || 'none');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [bullets, setBullets] = useState(['']);

  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [c, e] = await Promise.all([
          axios.get(`${API_URL}/api/clients`, authHeaders),
          axios.get(`${API_URL}/api/emails`, authHeaders),
        ]);
        setClients(c.data || []);
        setEmails(e.data.emails || []);
      } catch (err) {
        console.error('Load failed', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const generate = async () => {
    const cleanedBullets = bullets.map((b) => b.trim()).filter(Boolean);
    if (clientId === 'none' && !recipientName.trim() && !notes.trim() && cleanedBullets.length === 0) {
      toast.error('Add at least a recipient, notes, or bullet points');
      return;
    }
    setGenerating(true);
    setCurrent(null);
    try {
      const res = await axios.post(
        `${API_URL}/api/emails/generate`,
        {
          template_type: templateType,
          tone,
          client_id: clientId === 'none' ? null : clientId,
          recipient_name: recipientName || null,
          advisor_notes: notes || null,
          bullet_points: cleanedBullets.length ? cleanedBullets : null,
        },
        authHeaders
      );
      if (res.data.success) {
        toast.success('Communication ready');
        setCurrent(res.data.email);
        setEmails((prev) => [res.data.email, ...prev]);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text, label = 'Text') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Copy failed');
    }
  };

  const sendToWhatsApp = (text) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const sendToMail = (subject, body) => {
    const url = `mailto:?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
    window.location.href = url;
  };

  const deleteEmail = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/emails/${id}`, authHeaders);
      setEmails((prev) => prev.filter((e) => e.id !== id));
      if (current?.id === id) setCurrent(null);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const updateBullet = (i, val) => {
    setBullets((prev) => prev.map((b, idx) => (idx === i ? val : b)));
  };
  const addBullet = () => setBullets((prev) => [...prev, '']);
  const removeBullet = (i) => setBullets((prev) => prev.filter((_, idx) => idx !== i));

  const channel = TEMPLATE_LABELS[templateType]?.channel;

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="email-generator">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Mail className="h-7 w-7 text-emerald-400" />
            AI Email & Communication Generator
          </h1>
          <p className="text-slate-400">
            Draft client emails, WhatsApp briefs, follow-ups and review reminders in seconds.
          </p>
        </div>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="bg-navy-900 border border-navy-700">
            <TabsTrigger value="compose" data-testid="tab-compose">Compose</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History ({emails.length})</TabsTrigger>
          </TabsList>

          {/* COMPOSE */}
          <TabsContent value="compose" className="space-y-6 mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">1. Pick template & tone</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-slate-300">Communication type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger data-testid="select-template" className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEMPLATE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
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
                      {Object.entries(TONE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Client (optional)</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger data-testid="select-client" className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue placeholder="None — pick a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Recipient name (if no client)</Label>
                  <Input
                    data-testid="input-recipient"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">2. Points to cover</CardTitle>
                <p className="text-sm text-slate-400">Specific items the AI should weave in (optional).</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {bullets.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      data-testid={`bullet-${i}`}
                      value={b}
                      onChange={(e) => updateBullet(i, e.target.value)}
                      placeholder="e.g. RA contribution should be maxed by Feb"
                      className="bg-navy-800 border-navy-600 text-white"
                    />
                    {bullets.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeBullet(i)} className="text-red-400">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addBullet} data-testid="add-bullet">
                  <Plus className="h-4 w-4 mr-1" /> Add point
                </Button>

                <div className="pt-3">
                  <Label className="text-slate-300">Advisor notes (free-form context)</Label>
                  <textarea
                    data-testid="input-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Anything else the AI should know — meeting outcome, market context, action items..."
                    className="mt-1 w-full rounded-md bg-navy-800 border border-navy-600 text-white p-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                data-testid="generate-email-btn"
                onClick={generate}
                disabled={generating}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
              >
                {generating ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating with GPT-4o…</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" />Generate</>
                )}
              </Button>
            </div>

            {/* OUTPUT */}
            {current && <EmailOutput email={current} copyToClipboard={copyToClipboard} sendToWhatsApp={sendToWhatsApp} sendToMail={sendToMail} />}
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" />
                  Recent communications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <p className="text-sm text-slate-400">Nothing yet. Generate one from the Compose tab.</p>
                ) : (
                  <div className="space-y-2">
                    {emails.map((e) => {
                      const meta = TEMPLATE_LABELS[e.template_type] || TEMPLATE_LABELS.custom;
                      const Icon = meta.icon;
                      return (
                        <div
                          key={e.id}
                          data-testid={`history-row-${e.id}`}
                          className="flex items-center justify-between p-3 rounded-md bg-navy-800/40 border border-navy-700 hover:border-emerald-500/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {e.content?.subject || meta.label}
                              </p>
                              <p className="text-xs text-slate-500">
                                {e.recipient_name ? `${e.recipient_name} · ` : ''}
                                {meta.label} · {TONE_LABELS[e.tone] || e.tone} · {new Date(e.created_at).toLocaleString('en-ZA')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => setCurrent(e)}
                              data-testid={`history-open-${e.id}`}
                            >
                              Open
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteEmail(e.id)}
                              data-testid={`history-delete-${e.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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


const EmailOutput = ({ email, copyToClipboard, sendToWhatsApp, sendToMail }) => {
  const c = email.content || {};
  const isWhatsApp = c.channel === 'whatsapp' || email.template_type === 'whatsapp_brief';
  const text = isWhatsApp ? (c.whatsapp_text || c.body_plain || '') : (c.body_plain || '');

  return (
    <Card className="bg-navy-900/60 border-emerald-500/30" data-testid="email-output">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          Ready to send
          <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            {isWhatsApp ? 'WhatsApp' : c.channel === 'note' ? 'Note' : 'Email'}
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          {isWhatsApp ? (
            <Button
              size="sm"
              onClick={() => sendToWhatsApp(text)}
              className="bg-[#25D366] hover:bg-[#1da856] text-white"
              data-testid="send-whatsapp-btn"
            >
              <MessageCircle className="h-4 w-4 mr-2" /> Open in WhatsApp
            </Button>
          ) : c.channel !== 'note' ? (
            <Button
              size="sm"
              onClick={() => sendToMail(c.subject, c.body_plain)}
              className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
              data-testid="send-mail-btn"
            >
              <Send className="h-4 w-4 mr-2" /> Open in mail app
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(text, 'Message')}
            className="border-slate-600 text-slate-200"
            data-testid="copy-btn"
          >
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isWhatsApp && c.subject && (
          <div className="p-3 rounded-md bg-navy-800/60 border border-navy-700">
            <div className="text-xs text-slate-500 mb-1">Subject</div>
            <div className="text-white font-medium" data-testid="email-subject">{c.subject}</div>
          </div>
        )}
        <div className="p-4 rounded-md bg-navy-800/40 border border-navy-700 max-h-[500px] overflow-auto">
          <pre
            data-testid="email-body"
            className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed"
          >
            {text}
          </pre>
        </div>
        {isWhatsApp && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> Click "Open in WhatsApp" then paste or pick a contact.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailGenerator;
