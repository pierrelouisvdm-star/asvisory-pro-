import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, Wand2, X, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Attaches to a receipt that's been uploaded.
 * User describes the receipt by voice → both image + voice sent to GPT-4o Vision.
 * Much more accurate OCR with dual context.
 */
export default function VoiceReceiptAnalyzer({ receiptFile, onAnalyzed, jurisdiction = 'us', token }) {
  const [status, setStatus] = useState('idle'); // idle | recording | processing | done
  const [seconds, setSeconds] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [amplitude, setAmplitude] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Waveform
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      src.connect(analyser);

      const drawWave = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setAmplitude(Array.from(data.slice(0, 8)));
        animFrameRef.current = requestAnimationFrame(drawWave);
      };
      drawWave();

      let mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current);
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await processWithDualContext(blob, mimeType);
      };

      mediaRecorder.start(100);
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s >= 29) { stopRecording(); return s; }
        return s + 1;
      }), 1000);
    } catch (err) {
      toast.error('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
    }
  };

  const processWithDualContext = async (audioBlob, mimeType) => {
    if (!receiptFile) {
      toast.error('No receipt attached');
      return;
    }
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('image', receiptFile, receiptFile.name);
    formData.append('audio', audioBlob, `description.${ext}`);
    formData.append('jurisdiction', jurisdiction);

    try {
      const res = await fetch(`${API_URL}/api/voice/analyze-receipt-with-voice`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Analysis failed');
      }
      const data = await res.json();
      setTranscription(data.transcription || '');
      setStatus('done');
      if (onAnalyzed) onAnalyzed(data);
      toast.success(data.dual_context
        ? 'Receipt analyzed with voice + image context!'
        : 'Receipt analyzed from image');
    } catch (err) {
      setStatus('idle');
      toast.error(err.message || 'Could not analyze. Please try again.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setTranscription('');
    setSeconds(0);
    setAmplitude([]);
  };

  const fmtSec = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── IDLE ──
  if (status === 'idle') {
    return (
      <div className="mt-3 pt-3 border-t border-navy-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Describe for smarter AI extraction
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Say what's on the receipt to help AI parse it</p>
          </div>
          <button
            onClick={startRecording}
            data-testid="voice-receipt-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-medium transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Mic className="h-3.5 w-3.5" />
            Describe receipt
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">e.g. "Whole Foods groceries, $47.50" or "Gas station receipt"</p>
      </div>
    );
  }

  // ── RECORDING ──
  if (status === 'recording') {
    return (
      <div className="mt-3 pt-3 border-t border-navy-600" data-testid="voice-receipt-recording">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-6 w-6 items-center justify-center flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Listening... {fmtSec(seconds)}</p>
              <p className="text-[10px] text-slate-500">Describe what's on this receipt</p>
            </div>
          </div>
          <button onClick={stopRecording} data-testid="voice-receipt-stop"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium">
            <MicOff className="h-3 w-3" /> Stop
          </button>
        </div>
        {/* Mini waveform */}
        <div className="flex items-end gap-0.5 h-6 justify-center">
          {(amplitude.length > 0 ? amplitude : Array(8).fill(15)).map((v, i) => (
            <div key={i} className="w-1 rounded-full bg-violet-400 transition-all duration-75"
              style={{ height: `${Math.max(3, (v / 255) * 24)}px` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── PROCESSING ──
  if (status === 'processing') {
    return (
      <div className="mt-3 pt-3 border-t border-navy-600" data-testid="voice-receipt-processing">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-violet-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">Analyzing with voice + image...</p>
            <p className="text-[10px] text-slate-500">GPT-4o Vision using dual context</p>
          </div>
        </div>
      </div>
    );
  }

  // ── DONE ──
  if (status === 'done') {
    return (
      <div className="mt-3 pt-3 border-t border-navy-600" data-testid="voice-receipt-done">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-emerald-400">Enhanced analysis complete</p>
              {transcription && (
                <p className="text-[10px] text-slate-500 italic">"{transcription}"</p>
              )}
            </div>
          </div>
          <button onClick={handleReset} className="text-slate-500 hover:text-slate-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
