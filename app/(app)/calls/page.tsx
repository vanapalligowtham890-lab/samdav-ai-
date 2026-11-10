"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  UploadCloud, 
  FileAudio, 
  Volume2, 
  Play, 
  Pause, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock,
  Loader2,
  Mic,
  Square 
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { SYNTHETIC_CALLS } from "@/lib/synthetic-data";

interface CallItem {
  id: string;
  original_name: string;
  duration_seconds: number;
  created_at: string;
  status: string;
  transcript: string | null;
  key_quote: string | null;
  customer_name: string | null;
  need: string | null;
  budget: string | null;
  urgency: string | null;
  lead_id: string | null;
  filename: string;
  audio_url?: string | null;
  language_code?: string | null;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentProcessingTranscript, setCurrentProcessingTranscript] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `live_voice_call_${Date.now()}.webm`, { type: "audio/webm" });
        await handleFileUpload(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      alert("Microphone permission required to test live voice call recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
  };

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calls");
      const data = await res.json();
      if (data.calls) {
        setCalls(data.calls);
      }
    } catch (err) {
      console.error("Failed to fetch calls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setCurrentProcessingTranscript(null);

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("language_code", "te-IN");

      // 1. Transcribe via Gnani Prisma
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        const errJson = await transcribeRes.json();
        throw new Error(errJson.error || "Transcription failed");
      }

      const transcribeData = await transcribeRes.json();
      setCurrentProcessingTranscript(transcribeData.transcript);

      // 2. Extract Lead via LLM
      await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcribeData.transcript,
          callId: transcribeData.callId,
        }),
      });

      // Refresh calls
      await fetchCalls();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handlePickSample = async (sample: typeof SYNTHETIC_CALLS[0]) => {
    try {
      setUploading(true);
      setCurrentProcessingTranscript(sample.transcript);

      // Trigger synthetic call seeding or use the sample text directly
      await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: sample.transcript,
          callId: sample.id,
        }),
      });

      await fetchCalls();
    } catch (err: any) {
      console.error("Error processing sample:", err);
    } finally {
      setUploading(false);
    }
  };

  const togglePlayAudio = async (call: CallItem) => {
    // If clicking on currently playing call, stop and reset cleanly
    if (playingId === call.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
        audioPlayerRef.current.onended = null;
        audioPlayerRef.current.onerror = null;
        audioPlayerRef.current = null;
      }
      setPlayingId(null);
      setLoadingAudioId(null);
      return;
    }

    // Always completely tear down any previous audio instance
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
      audioPlayerRef.current.onended = null;
      audioPlayerRef.current.onerror = null;
      audioPlayerRef.current = null;
    }
    setPlayingId(null);

    const targetUrl = call.audio_url || (call.filename ? `/audio/${call.filename}` : `/api/call-audio?prospectId=${encodeURIComponent(call.id)}`);
    setLoadingAudioId(call.id);

    const audio = new Audio(targetUrl);
    audioPlayerRef.current = audio;

    audio.onended = () => {
      setPlayingId(null);
      setLoadingAudioId(null);
      audioPlayerRef.current = null;
    };

    audio.onerror = () => {
      console.warn("Audio playback error for call:", call.id);
      setPlayingId(null);
      setLoadingAudioId(null);
      audioPlayerRef.current = null;
    };

    try {
      await audio.play();
      setPlayingId(call.id);
    } catch (e) {
      console.warn("Audio play prevented or interrupted:", e);
      setPlayingId(null);
    } finally {
      setLoadingAudioId(null);
    }
  };

  /**
   * Highlights the key quote inside the transcript text
   */
  const renderHighlightedTranscript = (transcript: string, keyQuote: string | null) => {
    if (!keyQuote || !transcript.includes(keyQuote)) {
      return <span>{transcript}</span>;
    }

    const parts = transcript.split(keyQuote);
    return (
      <span>
        {parts[0]}
        <mark className="bg-accent/15 text-accent font-medium px-1.5 py-0.5 rounded border-b border-accent">
          {keyQuote}
        </mark>
        {parts.slice(1).join(keyQuote)}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <BlurFade delay={0.05}>
        <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted font-medium block mb-1">
              Aditya University · Admissions &amp; Parent Desk
            </span>
            <h1 className="text-3xl font-heading text-ink">Parent Calls &amp; Transcripts</h1>
          </div>
          <span className="text-xs text-muted">
            Transcribed using Gnani Prisma v3.0 (Telugu + Hinglish)
          </span>
        </div>
      </BlurFade>

      {/* Drag & Drop Upload Zone */}
      <BlurFade delay={0.1}>
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/60 bg-surface paper-shadow"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept="audio/*,.wav,.mp3,.m4a,.ogg"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-paper border border-border flex items-center justify-center mx-auto text-accent">
              <UploadCloud className="w-6 h-6" strokeWidth={1.5} />
            </div>

            <div>
              <p className="font-heading text-lg text-ink">
                Drop recorded parent counseling call here
              </p>
              <p className="text-xs text-muted mt-1">
                Supports WAV, MP3, M4A up to 30 seconds (longer calls auto-chunked by ffmpeg).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isRecording}
                className="bg-accent text-surface px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {uploading ? "Processing audio..." : "Select audio file"}
              </button>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={uploading}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs ${
                  isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-paper border border-border text-ink hover:border-accent"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Stop &amp; Transcribe Live Call
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                    Test Live Admissions Call (Mic)
                  </>
                )}
              </button>
            </div>

            {/* Quick sample pickers */}
            <div className="pt-4 border-t border-border/80">
              <span className="text-[11px] text-muted block mb-2 font-medium">
                Or select a parent counseling call to verify:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {SYNTHETIC_CALLS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handlePickSample(sample)}
                    disabled={uploading}
                    className="text-[11px] bg-paper border border-border hover:border-accent px-2.5 py-1 rounded text-ink transition-colors"
                  >
                    {sample.customerName.split(" ")[0]} ({sample.lead.need.slice(0, 28)}...)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </BlurFade>

      {/* Live typing animation feedback if currently processing */}
      {uploading && currentProcessingTranscript && (
        <div className="bg-surface border border-accent/40 rounded-lg p-5 paper-shadow space-y-2 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <Clock className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            Gnani Prisma STT receiving transcription...
          </div>
          <p className="telugu-text text-sm text-ink leading-[1.75] bg-paper p-3 rounded border border-border">
            <TypingAnimation text={currentProcessingTranscript} duration={15} />
          </p>
        </div>
      )}

      {/* Calls List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-ink">All recorded calls</h2>
          <span className="text-xs text-muted">
            {calls.length} {calls.length === 1 ? "call" : "calls"} stored
          </span>
        </div>

        {calls.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-8 text-center space-y-2 paper-shadow">
            <p className="text-sm text-ink font-medium">No sales calls recorded yet.</p>
            <p className="text-xs text-muted">
              Drop an audio recording above or load demo calls from the top bar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => {
              const isPlaying = playingId === call.id;
              return (
                <article
                  key={call.id}
                  className="bg-surface border border-border rounded-lg p-5 paper-shadow space-y-4"
                >
                  {/* Top metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePlayAudio(call)}
                        disabled={loadingAudioId === call.id}
                        aria-label={isPlaying ? "Pause call audio" : "Play call audio"}
                        className="w-8 h-8 rounded-full bg-paper border border-border hover:border-accent text-accent flex items-center justify-center shrink-0 transition-colors"
                      >
                        {loadingAudioId === call.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                        ) : isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" strokeWidth={1.5} />
                        )}
                      </button>

                      <div>
                        <h3 className="font-heading text-lg text-ink font-medium">
                          {call.original_name || call.filename}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span>{Math.round(call.duration_seconds || 35)}s duration</span>
                          <span>·</span>
                          <span className="uppercase">{call.language_code || "te-IN"}</span>
                          {call.audio_url && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium px-1.5 py-0.5 rounded border border-emerald-500/20">
                              Gnani Timbre Audio
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {call.lead_id && (
                      <Link
                        href={`/leads/${call.id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium self-start sm:self-auto"
                      >
                        View lead card ({call.customer_name || "Prospect"}) <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </Link>
                    )}
                  </div>

                  {/* Transcript with Highlighted Key Quote */}
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted font-medium block">
                      Prisma Transcript (Key Moment Highlighted)
                    </span>
                    <p className="telugu-text text-sm text-ink leading-[1.8] bg-paper/60 p-4 rounded-md border border-border/60 whitespace-pre-line">
                      {call.transcript
                        ? renderHighlightedTranscript(call.transcript, call.key_quote)
                        : "Transcript pending..."}
                    </p>
                  </div>

                  {/* Key quote banner */}
                  {call.key_quote && (
                    <div className="flex items-start gap-2 text-xs text-muted pt-1">
                      <Volume2 className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
                      <p className="telugu-quote text-xs text-ink/90 italic">
                        Highlighted key customer objection/intent: &ldquo;{call.key_quote}&rdquo;
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
