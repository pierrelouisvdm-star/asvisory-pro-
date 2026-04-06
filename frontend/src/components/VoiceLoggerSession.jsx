import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mic, MicOff, Loader2, X, CheckCircle2, Trash2, Edit3,
  Upload, Image as ImageIcon, Wand2, Sparkles, Save, Plus,
  ArrowRight, TrendingUp, TrendingDown, Volume2
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_ICONS = {
  food: '🍔', housing: '🏠', transport: '🚗', utilities: '⚡',
  healthcare: '🏥', entertainment: '🎬', shopping: '🛍️', travel: '✈️',
  business: '💼', education: '🎓', salary: '💰', freelance: '💻',
  investment: '📈', other: '📌', communication: '📱',
  health_insurance: '🏥', retirement_401k: '🏦', hsa: '💊',
  social_security: '🏛️', retirement_dist: '💵', rental: '🏘️', bonus: '🎁',
};

function SessionItem({ item, index, onDelete, onEdit, categoryDisplay }) {
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [editDesc, setEditDesc] = useState(item.description);

  const saveEdit = () => {
    onEdit(item.id, { amount: parseFloat(editAmount) || item.amount, description: editDesc });
    setEditing(false);
  };

  const icon = CATEGORY_ICONS[item.category] || '📌';

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      item.status === 'saved' ? 'border-emerald-500/30 bg-emerald-500/5' :
      item.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
      'border-border bg-card/50'
    }`} data-testid={`session-item-${index}`}>
      {editing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={editAmount} onChange={e => setEditAmount(e.target.value)}
              className="h-7 text-sm w-24" placeholder="Amount" type="number" />
            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)}
              className="h-7 text-sm flex-1" placeholder="Description" />
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" onClick={saveEdit} className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs px-2">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-base flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
              </span>
              <Badge className="text-[9px] bg-muted text-muted-foreground border-0 px-1 py-0 capitalize">
                {item.category.replace(/_/g, ' ')}
              </Badge>
              {item.status === 'saved' && <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{item.description || '—'}</p>
            {item.voiceTranscription && (
              <p className="text-[10px] text-muted-foreground/60 italic truncate">"{item.voiceTranscription}"</p>
            )}
          </div>
          {item.status !== 'saved' && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(item.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VoiceLoggerSession({ onClose, onSessionSaved, jurisdiction = 'us', currencySymbol = '$', token }) {
  const [sessionItems, setSessionItems] = useState([]);
  const [currentReceipt, setCurrentReceipt] = useState(null); // { file, previewUrl, type }
  const [voiceStatus, setVoiceStatus] = useState('idle'); // idle|recording|processing|preview
  const [currentParsed, setCurrentParsed] = useState(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [amplitude, setAmplitude] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [savingAll, setSavingAll] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    sessionTimerRef.current = setInterval(() => setSessionTimer(s => s + 1), 1000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(sessionTimerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── RECEIPT ──
  const handleReceiptDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF'); return;
    }
    setCurrentReceipt({ file, previewUrl: URL.createObjectURL(file), type: file.type, name: file.name });
  };

  const clearReceipt = () => {
    if (currentReceipt?.previewUrl) URL.revokeObjectURL(currentReceipt.previewUrl);
    setCurrentReceipt(null);
  };

  // ── RECORDING ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      const drawWave = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setAmplitude(Array.from(data.slice(0, 16)));
        animFrameRef.current = requestAnimationFrame(drawWave);
      };
      drawWave();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current);
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await processCurrentItem(blob, mimeType);
      };

      mr.start(100);
      setVoiceStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s >= 29) { stopRecording(); return s; }
        return s + 1;
      }), 1000);
    } catch {
      toast.error('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setVoiceStatus('processing');
    }
  };

  const processCurrentItem = async (audioBlob, mimeType) => {
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('jurisdiction', jurisdiction);

    try {
      let data;
      if (currentReceipt?.file && currentReceipt.type.startsWith('image/')) {
        // Dual context: image + voice
        formData.append('image', currentReceipt.file, currentReceipt.name);
        formData.append('audio', audioBlob, `desc.${ext}`);
        const res = await fetch(`${API_URL}/api/voice/analyze-receipt-with-voice`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error('Analysis failed');
        data = await res.json();
        data.type = data.type || 'expense';
      } else {
        // Voice only
        formData.append('audio', audioBlob, `recording.${ext}`);
        const res = await fetch(`${API_URL}/api/voice/parse-transaction`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error('Parse failed');
        data = await res.json();
      }

      setVoiceTranscript(data.transcription || '');
      setCurrentParsed(data);
      setVoiceStatus('preview');
    } catch (err) {
      setVoiceStatus('idle');
      toast.error('Could not process audio. Please try again.');
    }
  };

  // ── SESSION QUEUE ──
  const addToSession = () => {
    if (!currentParsed) return;
    const item = {
      id: Date.now().toString(),
      type: currentParsed.type || 'expense',
      amount: currentParsed.amount || 0,
      category: currentParsed.category || 'other',
      description: currentParsed.description || currentParsed.merchant || '',
      date: currentParsed.date || new Date().toISOString().slice(0, 10),
      voiceTranscription: voiceTranscript,
      hasReceipt: !!currentReceipt,
      status: 'ready',
    };
    setSessionItems(prev => [item, ...prev]);
    setCurrentParsed(null);
    setVoiceTranscript('');
    setVoiceStatus('idle');
    clearReceipt();
    toast.success(`Added: ${item.type === 'income' ? '+' : '-'}$${item.amount.toFixed(2)} ${item.description}`);
  };

  const deleteItem = (id) => setSessionItems(prev => prev.filter(i => i.id !== id));
  const editItem = (id, changes) => setSessionItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));

  // ── SAVE ALL ──
  const saveAll = async () => {
    const readyItems = sessionItems.filter(i => i.status === 'ready');
    if (!readyItems.length) return;
    setSavingAll(true);

    try {
      const payload = readyItems.map(i => ({
        type: i.type,
        amount: i.amount,
        category: i.category,
        description: i.description,
        date: i.date,
        is_recurring: false,
        tax_deductible: false,
      }));

      const res = await fetch(`${API_URL}/api/transactions/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();

      setSessionItems(prev => prev.map(i =>
        readyItems.find(r => r.id === i.id) ? { ...i, status: 'saved' } : i
      ));
      toast.success(`${data.saved} transactions saved!`);
      setTimeout(() => {
        onSessionSaved?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      toast.error('Failed to save transactions. Please try again.');
    } finally {
      setSavingAll(false);
    }
  };

  const totalAmount = sessionItems.reduce((sum, i) => i.type === 'expense' ? sum - i.amount : sum + i.amount, 0);
  const readyCount = sessionItems.filter(i => i.status === 'ready').length;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col" data-testid="voice-logger-session">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
            <Mic className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">Voice Logging Session</h2>
            <p className="text-xs text-muted-foreground">{fmtTime(sessionTimer)} · {sessionItems.length} captured</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {readyCount > 0 && (
            <Button onClick={saveAll} disabled={savingAll} size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="session-save-all-btn">
              {savingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save All ({readyCount})
            </Button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="session-close-btn">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Current Item */}
        <div className="flex-1 flex flex-col p-6 border-r border-border overflow-y-auto min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-violet-500" /> Current Item
          </p>

          {/* Receipt Drop Zone */}
          <div
            className={`rounded-xl border-2 border-dashed mb-4 transition-all cursor-pointer ${
              currentReceipt ? 'border-violet-500/40 bg-violet-500/5 p-3' : 'border-border hover:border-violet-500/40 hover:bg-violet-500/5 p-6'
            }`}
            onDrop={handleReceiptDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !currentReceipt && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReceiptDrop} className="hidden" />
            {currentReceipt ? (
              <div className="flex items-center gap-3">
                {currentReceipt.type.startsWith('image/') ? (
                  <img src={currentReceipt.previewUrl} alt="Receipt" className="h-16 w-16 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{currentReceipt.name}</p>
                  <p className="text-xs text-violet-400">Receipt attached — describe it with voice</p>
                </div>
                <button onClick={e => { e.stopPropagation(); clearReceipt(); }} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Drop receipt photo <span className="text-muted-foreground/60">(optional)</span></p>
              </div>
            )}
          </div>

          {/* Voice Controls */}
          <div className="space-y-3">
            {voiceStatus === 'idle' && (
              <button
                onClick={startRecording}
                data-testid="session-voice-btn"
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border-2 border-violet-500/30 hover:border-violet-500/50 text-violet-400 font-medium transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                  <Mic className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {currentReceipt ? 'Describe this receipt' : 'Speak your transaction'}
                  </p>
                  <p className="text-xs text-violet-400/70">
                    {currentReceipt ? 'e.g. "grocery run, $47.50"' : 'e.g. "paid rent $1200" or "coffee $5.50"'}
                  </p>
                </div>
              </button>
            )}

            {voiceStatus === 'recording' && (
              <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 space-y-3" data-testid="session-recording">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-7 w-7 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{fmtTime(seconds)}</span>
                    <span className="text-xs text-muted-foreground">max 30s</span>
                  </div>
                  <button onClick={stopRecording} data-testid="session-stop-btn"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium">
                    <MicOff className="h-3.5 w-3.5" /> Done speaking
                  </button>
                </div>
                <div className="flex items-end gap-0.5 h-8 justify-center">
                  {(amplitude.length > 0 ? amplitude : Array(16).fill(10)).map((v, i) => (
                    <div key={i} className="w-1 rounded-full bg-red-400 transition-all duration-75"
                      style={{ height: `${Math.max(3, (v / 255) * 32)}px` }} />
                  ))}
                </div>
              </div>
            )}

            {voiceStatus === 'processing' && (
              <div className="p-4 rounded-xl bg-violet-500/10 border-2 border-violet-500/30 flex items-center gap-3" data-testid="session-processing">
                <Loader2 className="h-5 w-5 text-violet-500 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {currentReceipt ? 'Analyzing receipt + voice...' : 'Parsing your transaction...'}
                  </p>
                  <p className="text-xs text-muted-foreground">GPT-4o is extracting details</p>
                </div>
              </div>
            )}

            {voiceStatus === 'preview' && currentParsed && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-3" data-testid="session-preview">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-foreground">Transaction detected</p>
                  {currentParsed.dual_context && (
                    <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-0">dual context</Badge>
                  )}
                </div>
                {voiceTranscript && (
                  <p className="text-xs text-muted-foreground italic bg-background/50 rounded px-2 py-1">"{voiceTranscript}"</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'Type', v: currentParsed.type, c: currentParsed.type === 'income' ? 'emerald' : 'red' },
                    { l: 'Amount', v: `$${(currentParsed.amount || 0).toFixed(2)}`, c: 'blue' },
                    { l: 'Category', v: (currentParsed.category || 'other').replace(/_/g, ' '), c: 'purple' },
                    { l: 'Description', v: currentParsed.description || currentParsed.merchant || '—', c: 'amber' },
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded-lg bg-${item.c}-500/10 border border-${item.c}-500/20`}>
                      <p className="text-[10px] text-muted-foreground">{item.l}</p>
                      <p className={`text-xs font-semibold text-${item.c}-400 capitalize truncate`}>{item.v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addToSession} data-testid="session-add-item-btn"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add to Session
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setVoiceStatus('idle'); setCurrentParsed(null); }} className="h-9">
                    <Mic className="h-3.5 w-3.5 mr-1" /> Redo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Volume2 className="h-3 w-3 text-muted-foreground" /> Voice Tips
            </p>
            <ul className="space-y-0.5 text-[10px] text-muted-foreground">
              <li>"Spent $45 on groceries at Whole Foods"</li>
              <li>"Got paid $3000 salary from work"</li>
              <li>"Paid $1200 rent for this month"</li>
              <li>"Coffee at Starbucks $6.50"</li>
            </ul>
          </div>
        </div>

        {/* RIGHT — Session Queue */}
        <div className="w-80 flex flex-col p-4 overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Session Queue
            </p>
            <Badge className="bg-violet-500/20 text-violet-400 border-0 text-xs">{sessionItems.length} items</Badge>
          </div>

          {sessionItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Speak your first transaction</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Items appear here as you log them</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sessionItems.map((item, i) => (
                <SessionItem key={item.id} item={item} index={i}
                  onDelete={deleteItem} onEdit={editItem} />
              ))}
            </div>
          )}

          {sessionItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-muted-foreground">{readyCount} unsaved</span>
                <span className={`font-bold ${totalAmount >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                  {totalAmount >= 0 ? '+' : ''}${Math.abs(totalAmount).toFixed(2)} net
                </span>
              </div>
              <Button onClick={saveAll} disabled={savingAll || readyCount === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="session-save-all-btn-sidebar">
                {savingAll
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                  : <><Save className="h-4 w-4 mr-2" /> Save All {readyCount} Transactions</>
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
