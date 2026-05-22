import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck, FileText, Loader2, Copy, Trash2, Clock,
  Sparkles, Plus, X, CheckCircle2, ScrollText, Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

const RECORD_TYPE_LABELS = {
  meeting_notes: 'Meeting Notes / File Note',
  record_of_advice: 'Record of Advice (RoA)',
  risk_profile_summary: 'Risk Profile Summary',
  product_comparison: 'Product Comparison',
  advice_rationale: 'Advice Rationale',
  action_items: 'Client Action Items',
};

export const ComplianceNotes = () => {
  const { token } = useAuth();

  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);

  const [recordType, setRecordType] = useState('record_of_advice');
  const [clientId, setClientId] = useState('none');
  const [meetingDate, setMeetingDate] = useState('');
  const [attendees, setAttendees] = useState(['']);
  const [topics, setTopics] = useState('');
  const [decisions, setDecisions] = useState('');
  const [products, setProducts] = useState(['']);
  const [notes, setNotes] = useState('');

  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [c, r] = await Promise.all([
          axios.get(`${API_URL}/api/clients`, authHeaders),
          axios.get(`${API_URL}/api/compliance`, authHeaders),
        ]);
        setClients(c.data || []);
        setRecords(r.data.records || []);
      } catch (err) {
        console.error('Load failed', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const generate = async () => {
    const cleanAttendees = attendees.map((a) => a.trim()).filter(Boolean);
    const cleanProducts = products.map((p) => p.trim()).filter(Boolean);
    if (!topics.trim() && !decisions.trim() && !notes.trim() && cleanAttendees.length === 0) {
      toast.error('Add some context — topics, decisions, or notes');
      return;
    }
    setGenerating(true);
    setCurrent(null);
    try {
      const res = await axios.post(
        `${API_URL}/api/compliance/generate`,
        {
          record_type: recordType,
          client_id: clientId === 'none' ? null : clientId,
          meeting_date: meetingDate || null,
          attendees: cleanAttendees.length ? cleanAttendees : null,
          topics_discussed: topics || null,
          decisions: decisions || null,
          products_mentioned: cleanProducts.length ? cleanProducts : null,
          advisor_notes: notes || null,
        },
        authHeaders
      );
      if (res.data.success) {
        toast.success('Record generated');
        setCurrent(res.data.record);
        setRecords((prev) => [res.data.record, ...prev]);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const copyAsText = async (record) => {
    const text = formatAsText(record);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Record copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const deleteRecord = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/compliance/${id}`, authHeaders);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (current?.id === id) setCurrent(null);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const updateListItem = (list, setter, i, val) => {
    setter(list.map((x, idx) => (idx === i ? val : x)));
  };

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="compliance-notes">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
            AI Compliance & Advisor Notes
          </h1>
          <p className="text-slate-400">
            Generate FAIS-aligned meeting notes, Records of Advice, risk profiles, and product comparisons in seconds.
          </p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="bg-navy-900 border border-navy-700">
            <TabsTrigger value="generate" data-testid="tab-generate">Generate</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History ({records.length})</TabsTrigger>
          </TabsList>

          {/* GENERATE */}
          <TabsContent value="generate" className="space-y-6 mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">1. Record details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-slate-300">Record type</Label>
                  <Select value={recordType} onValueChange={setRecordType}>
                    <SelectTrigger data-testid="select-record-type" className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECORD_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Client (optional)</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger data-testid="select-client" className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue placeholder="None" />
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
                  <Label className="text-slate-300">Meeting date</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    data-testid="input-meeting-date"
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Attendees</Label>
                  <div className="space-y-2">
                    {attendees.map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={a}
                          onChange={(e) => updateListItem(attendees, setAttendees, i, e.target.value)}
                          placeholder="e.g. Jane Doe (Client)"
                          data-testid={`attendee-${i}`}
                          className="bg-navy-800 border-navy-600 text-white"
                        />
                        {attendees.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => setAttendees(attendees.filter((_, idx) => idx !== i))} className="text-red-400">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setAttendees([...attendees, ''])} data-testid="add-attendee">
                      <Plus className="h-3 w-3 mr-1" /> Add attendee
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white">2. What was discussed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Topics discussed</Label>
                  <textarea
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    rows={3}
                    placeholder="e.g. Reviewed RA allocation, discussed offshore exposure, TFSA top-up..."
                    data-testid="input-topics"
                    className="mt-1 w-full rounded-md bg-navy-800 border border-navy-600 text-white p-2 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Decisions made / advice given</Label>
                  <textarea
                    value={decisions}
                    onChange={(e) => setDecisions(e.target.value)}
                    rows={3}
                    placeholder="e.g. Increase Reg 28 equity weight to 65%, top up TFSA before end-Feb..."
                    data-testid="input-decisions"
                    className="mt-1 w-full rounded-md bg-navy-800 border border-navy-600 text-white p-2 text-sm"
                  />
                </div>
                {(recordType === 'product_comparison' || recordType === 'advice_rationale') && (
                  <div>
                    <Label className="text-slate-300">Products mentioned / compared</Label>
                    <div className="space-y-2">
                      {products.map((p, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={p}
                            onChange={(e) => updateListItem(products, setProducts, i, e.target.value)}
                            placeholder="e.g. Allan Gray Balanced (TER 1.55%)"
                            data-testid={`product-${i}`}
                            className="bg-navy-800 border-navy-600 text-white"
                          />
                          {products.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => setProducts(products.filter((_, idx) => idx !== i))} className="text-red-400">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setProducts([...products, ''])} data-testid="add-product">
                        <Plus className="h-3 w-3 mr-1" /> Add product
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-slate-300">Additional notes</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any extra context — disclosures made, fees discussed, conflicts noted..."
                    data-testid="input-notes"
                    className="mt-1 w-full rounded-md bg-navy-800 border border-navy-600 text-white p-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                data-testid="generate-record-btn"
                onClick={generate}
                disabled={generating}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
              >
                {generating ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating with GPT-4o…</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" />Generate Record</>
                )}
              </Button>
            </div>

            {current && <RecordOutput record={current} onCopy={() => copyAsText(current)} />}
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="mt-4">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" /> Recent records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {records.length === 0 ? (
                  <p className="text-sm text-slate-400">No records yet — generate one from the Generate tab.</p>
                ) : (
                  <div className="space-y-2">
                    {records.map((r) => (
                      <div
                        key={r.id}
                        data-testid={`history-row-${r.id}`}
                        className="flex items-center justify-between p-3 rounded-md bg-navy-800/40 border border-navy-700 hover:border-emerald-500/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                            <ScrollText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {r.content?.title || RECORD_TYPE_LABELS[r.record_type]}
                            </p>
                            <p className="text-xs text-slate-500">
                              {r.client_name ? `${r.client_name} · ` : ''}
                              {RECORD_TYPE_LABELS[r.record_type]} · {new Date(r.created_at).toLocaleString('en-ZA')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => setCurrent(r)}
                            data-testid={`history-open-${r.id}`}
                          >
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteRecord(r.id)}
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


// ---------- Output renderer ----------

const Section = ({ title, children }) => (
  <div className="p-4 rounded-md bg-navy-800/40 border border-navy-700">
    <div className="text-xs font-semibold tracking-wide text-emerald-400 uppercase mb-2">{title}</div>
    <div className="text-sm text-slate-200">{children}</div>
  </div>
);

const RecordOutput = ({ record, onCopy }) => {
  const c = record.content || {};
  const rt = record.record_type;

  return (
    <Card className="bg-navy-900/60 border-emerald-500/30" data-testid="record-output">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          {c.title || RECORD_TYPE_LABELS[rt] || 'Record'}
          <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            {RECORD_TYPE_LABELS[rt]}
          </Badge>
        </CardTitle>
        <Button size="sm" variant="outline" onClick={onCopy} data-testid="copy-record-btn" className="border-slate-600 text-slate-200">
          <Copy className="h-4 w-4 mr-2" /> Copy
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {c._parse_error ? (
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{c.raw_text}</pre>
        ) : (
          <>
            {c.summary && <Section title="Summary"><p>{c.summary}</p></Section>}
            {c.meeting_date && c.meeting_date !== 'Not recorded' && (
              <Section title="Meeting Date"><p>{c.meeting_date}</p></Section>
            )}
            {Array.isArray(c.attendees) && c.attendees.length > 0 && (
              <Section title="Attendees">
                <ul className="list-disc pl-5 space-y-1">{c.attendees.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </Section>
            )}

            {/* RoA / Meeting Notes specific */}
            {Array.isArray(c.needs_identified) && c.needs_identified.length > 0 && (
              <Section title="Needs Identified">
                <ul className="list-disc pl-5 space-y-1">{c.needs_identified.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </Section>
            )}
            {Array.isArray(c.advice_given) && c.advice_given.length > 0 && (
              <Section title="Advice Given">
                <ul className="list-disc pl-5 space-y-1">{c.advice_given.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </Section>
            )}
            {Array.isArray(c.alternatives_considered) && c.alternatives_considered.length > 0 && (
              <Section title="Alternatives Considered">
                <ul className="list-disc pl-5 space-y-1">{c.alternatives_considered.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </Section>
            )}
            {c.fees_disclosed && <Section title="Fees Disclosed"><p>{c.fees_disclosed}</p></Section>}
            {c.client_acknowledgement && <Section title="Client Acknowledgement"><p>{c.client_acknowledgement}</p></Section>}
            {Array.isArray(c.action_items) && c.action_items.length > 0 && (
              <Section title="Action Items">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-navy-700">
                      <th className="text-left py-1">Owner</th>
                      <th className="text-left py-1">Task</th>
                      <th className="text-left py-1">Due</th>
                      {c.action_items[0]?.priority && <th className="text-left py-1">Priority</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {c.action_items.map((a, i) => (
                      <tr key={i} className="border-b border-navy-700/50">
                        <td className="py-1">{a.owner}</td>
                        <td className="py-1">{a.task}</td>
                        <td className="py-1">{a.due_date}</td>
                        {a.priority && (
                          <td className="py-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${a.priority === 'High' ? 'bg-red-500/20 text-red-300' : a.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {a.priority}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}
            {c.next_review_date && c.next_review_date !== 'Not recorded' && (
              <Section title="Next Review Date"><p>{c.next_review_date}</p></Section>
            )}
            {c.compliance_notes && <Section title="Compliance Notes"><p>{c.compliance_notes}</p></Section>}

            {/* Risk profile specific */}
            {c.risk_level && (
              <Section title="Risk Level">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{c.risk_level}</Badge>
                {c.justification && <p className="mt-2">{c.justification}</p>}
              </Section>
            )}
            {c.investment_horizon && <Section title="Investment Horizon"><p>{c.investment_horizon}</p></Section>}
            {c.capacity_for_loss && <Section title="Capacity for Loss"><p>{c.capacity_for_loss}</p></Section>}
            {c.recommended_asset_allocation && (
              <Section title="Recommended Asset Allocation">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(c.recommended_asset_allocation).map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-navy-800/60">
                      <div className="text-xs text-slate-500 capitalize">{k}</div>
                      <div className="text-base font-semibold text-emerald-400">{v}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Product comparison */}
            {Array.isArray(c.products) && c.products.length > 0 && (
              <Section title="Products Compared">
                <div className="grid md:grid-cols-2 gap-3">
                  {c.products.map((p, i) => (
                    <div key={i} className="p-3 rounded bg-navy-800/60 border border-navy-700">
                      <div className="font-medium text-white">{p.name}</div>
                      <div className="text-xs text-slate-500 mb-2">{p.ter_eac}</div>
                      {Array.isArray(p.pros) && p.pros.length > 0 && (
                        <div className="text-xs text-emerald-300 mb-1">
                          <strong>Pros:</strong> {p.pros.join('; ')}
                        </div>
                      )}
                      {Array.isArray(p.cons) && p.cons.length > 0 && (
                        <div className="text-xs text-red-300 mb-1">
                          <strong>Cons:</strong> {p.cons.join('; ')}
                        </div>
                      )}
                      {p.best_for && (
                        <div className="text-xs text-slate-400">Best for: {p.best_for}</div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {c.recommendation && <Section title="Recommendation"><p>{c.recommendation}</p></Section>}
            {c.rationale && <Section title="Rationale"><p>{c.rationale}</p></Section>}

            {/* Advice rationale */}
            {Array.isArray(c.client_objectives) && c.client_objectives.length > 0 && (
              <Section title="Client Objectives">
                <ul className="list-disc pl-5 space-y-1">{c.client_objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </Section>
            )}
            {c.needs_analysis_summary && <Section title="Needs Analysis"><p>{c.needs_analysis_summary}</p></Section>}
            {c.suitability_check && <Section title="Suitability Check"><p>{c.suitability_check}</p></Section>}
            {c.tax_implications && <Section title="Tax Implications"><p>{c.tax_implications}</p></Section>}
            {c.estate_implications && <Section title="Estate Implications"><p>{c.estate_implications}</p></Section>}
            {Array.isArray(c.risk_considerations) && c.risk_considerations.length > 0 && (
              <Section title="Risk Considerations">
                <ul className="list-disc pl-5 space-y-1">{c.risk_considerations.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </Section>
            )}
            {c.fees_total_eac && <Section title="Total Fees (EAC)"><p>{c.fees_total_eac}</p></Section>}
            {Array.isArray(c.client_alternatives_offered) && c.client_alternatives_offered.length > 0 && (
              <Section title="Alternatives Offered to Client">
                <ul className="list-disc pl-5 space-y-1">{c.client_alternatives_offered.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </Section>
            )}

            {/* Action items only */}
            {Array.isArray(c.items) && c.items.length > 0 && (
              <Section title="Action Items">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-navy-700">
                      <th className="text-left py-1">Owner</th>
                      <th className="text-left py-1">Task</th>
                      <th className="text-left py-1">Due</th>
                      <th className="text-left py-1">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.items.map((a, i) => (
                      <tr key={i} className="border-b border-navy-700/50">
                        <td className="py-1">{a.owner}</td>
                        <td className="py-1">{a.task}</td>
                        <td className="py-1">{a.due_date}</td>
                        <td className="py-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${a.priority === 'High' ? 'bg-red-500/20 text-red-300' : a.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {a.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Key concerns (risk profile) */}
            {Array.isArray(c.key_concerns) && c.key_concerns.length > 0 && (
              <Section title="Key Concerns">
                <ul className="list-disc pl-5 space-y-1">{c.key_concerns.map((k, i) => <li key={i}>{k}</li>)}</ul>
              </Section>
            )}
          </>
        )}

        <p className="text-[10px] text-slate-500 italic">
          AI-generated. Review for accuracy before saving to your compliance file. This record is stored against your advisor account.
        </p>
      </CardContent>
    </Card>
  );
};

// Convert a record's content to plain text for clipboard
function formatAsText(record) {
  const c = record.content || {};
  const lines = [];
  lines.push(c.title || RECORD_TYPE_LABELS[record.record_type] || 'Record');
  lines.push('='.repeat(50));
  if (c.summary) lines.push(`\nSummary:\n${c.summary}`);
  if (c.meeting_date) lines.push(`\nMeeting Date: ${c.meeting_date}`);
  if (Array.isArray(c.attendees) && c.attendees.length) lines.push(`\nAttendees:\n- ${c.attendees.join('\n- ')}`);
  if (Array.isArray(c.needs_identified)) lines.push(`\nNeeds Identified:\n- ${c.needs_identified.join('\n- ')}`);
  if (Array.isArray(c.advice_given)) lines.push(`\nAdvice Given:\n- ${c.advice_given.join('\n- ')}`);
  if (Array.isArray(c.alternatives_considered)) lines.push(`\nAlternatives:\n- ${c.alternatives_considered.join('\n- ')}`);
  if (c.fees_disclosed) lines.push(`\nFees Disclosed: ${c.fees_disclosed}`);
  if (c.client_acknowledgement) lines.push(`\nClient Acknowledgement: ${c.client_acknowledgement}`);
  if (Array.isArray(c.action_items)) {
    lines.push('\nAction Items:');
    c.action_items.forEach((a) => lines.push(`- ${a.owner}: ${a.task} (Due: ${a.due_date}${a.priority ? `, ${a.priority}` : ''})`));
  }
  if (c.next_review_date) lines.push(`\nNext Review: ${c.next_review_date}`);
  if (c.compliance_notes) lines.push(`\nCompliance Notes: ${c.compliance_notes}`);
  if (c.risk_level) lines.push(`\nRisk Level: ${c.risk_level}\n${c.justification || ''}`);
  if (c.recommendation) lines.push(`\nRecommendation: ${c.recommendation}`);
  if (c.rationale) lines.push(`\nRationale: ${c.rationale}`);
  return lines.join('\n');
}

export default ComplianceNotes;
