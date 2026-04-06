import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, CheckCircle2, X, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function VoiceTransactionRecorder({ onParsed, jurisdiction = 'us', currencySymbol = '$', token }) {
  const [status, setStatus] = useState('idle'); // idle | recording | processing | done | error
  const [seconds, setSeconds] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [amplitude, setAmplitude] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Audio analyser for waveform visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const drawWave = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setAmplitude(Array.from(data.slice(0, 12)));
        animFrameRef.current = requestAnimationFrame(drawWave);
      };
      drawWave();

      // MediaRecorder, try webm first, fallback to mp4
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current);
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await processAudio(blob, mimeType);
      };

      mediaRecorder.start(100); // collect data every 100ms
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s >= 59) { stopRecording(); return s; } // Auto-stop at 60s
        return s + 1;
      }), 1000);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        toast.error('Could not start recording. Please check your microphone.');
      }
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
    }
  };

  const processAudio = async (blob, mimeType) => {
    const formData = new FormData();
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', blob, `recording.${ext}`);
    formData.append('jurisdiction', jurisdiction);

    try {
      const res = await fetch(`${API_URL}/api/voice/parse-transaction`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Processing failed');
      }

      const data = await res.json();
      setTranscription(data.transcription);
      setParsedData(data);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      toast.error(err.message || 'Could not process your voice. Please try again.');
    }
  };

  const handleApply = () => {
    if (parsedData && onParsed) {
      onParsed(parsedData);
      handleReset();
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setTranscription('');
    setParsedData(null);
    setSeconds(0);
    setAmplitude([]);
  };

  const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── IDLE state ──
  if (status === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={startRecording}
          data-testid="voice-record-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          <Mic className="h-4 w-4" />
          Speak Transaction
        </button>
        <span className="text-xs text-muted-foreground">e.g. "Spent $45 on groceries today"</span>
      </div>
    );
  }

  // ── RECORDING state ──
  if (status === 'recording') {
    return (
      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3" data-testid="voice-recording-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Recording... {fmtSec(seconds)}</p>
              <p className="text-xs text-muted-foreground">Click stop when done speaking</p>
            </div>
          </div>
          <button onClick={stopRecording} data-testid="voice-stop-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors">
            <MicOff className="h-3.5 w-3.5" /> Stop
          </button>
        </div>
        {/* Waveform visualization */}
        <div className="flex items-end justify-center gap-0.5 h-8">
          {(amplitude.length > 0 ? amplitude : Array(12).fill(20)).map((v, i) => (
            <div key={i} className="w-1.5 rounded-full bg-red-400 transition-all duration-100"
              style={{ height: `${Math.max(4, (v / 255) * 32)}px` }} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Try: "I spent $150 on groceries", "Got paid $3,000 salary", "Paid $1,200 rent"
        </p>
      </div>
    );
  }

  // ── PROCESSING state ──
  if (status === 'processing') {
    return (
      <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 flex items-center gap-3" data-testid="voice-processing">
        <Loader2 className="h-5 w-5 text-violet-500 animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Transcribing & parsing...</p>
          <p className="text-xs text-muted-foreground">AI is extracting transaction details</p>
        </div>
      </div>
    );
  }

  // ── DONE state ──
  if (status === 'done' && parsedData) {
    return (
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3" data-testid="voice-result-panel">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-medium text-foreground">Transaction detected</p>
          </div>
          <button onClick={handleReset} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transcription */}
        <div className="px-3 py-2 rounded-lg bg-background/60 border border-border">
          <p className="text-xs text-muted-foreground mb-0.5">You said:</p>
          <p className="text-sm text-foreground italic">"{transcription}"</p>
        </div>

        {/* Parsed fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Type', value: parsedData.type, color: parsedData.type === 'income' ? 'emerald' : 'red' },
            { label: 'Amount', value: `${currencySymbol}${parsedData.amount.toFixed(2)}`, color: 'blue' },
            { label: 'Category', value: parsedData.category.replace(/_/g, ' '), color: 'purple' },
            { label: 'Description', value: parsedData.description || ',', color: 'amber' },
          ].map((item, i) => (
            <div key={i} className={`p-2 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/20`}>
              <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
              <p className={`text-xs font-semibold text-${item.color}-400 capitalize truncate`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" data-testid="voice-apply-btn">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Apply to Form
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} className="border-border" data-testid="voice-retry-btn">
            <Mic className="h-3.5 w-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── ERROR state ──
  if (status === 'error') {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3">
        <p className="text-sm text-amber-400">Could not process audio. Try speaking more clearly.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={startRecording} className="border-amber-500/30 text-amber-400">
            <Mic className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
