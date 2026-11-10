"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  User,
  Bot,
  Send,
  CheckCircle2,
  X,
  Radio,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface LiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  agentVoiceName?: string;
  companyName?: string;
  onCallSaved?: (callId: string) => void;
}

type CallPhase =
  | "dialer" // Keypad / Enter number
  | "connecting" // Ringing / Establishing call
  | "greeting" // Agent speaking greeting
  | "listening" // Listening to user microphone
  | "processing" // Gnani STT + Gemini + Timbre TTS
  | "speaking" // Agent speaking response
  | "ended"; // Call ended & saved to CRM

interface Turn {
  speaker: "agent" | "customer";
  text: string;
}

export function LiveCallModal({
  isOpen,
  onClose,
  defaultPhone = "+91 98490 22334",
  agentVoiceName = "Shivani",
  companyName = "Smile Dental Care",
  onCallSaved,
}: LiveCallModalProps) {
  const [phase, setPhase] = useState<CallPhase>("dialer");
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [sessionId, setSessionId] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [statusText, setStatusText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [textInputFallback, setTextInputFallback] = useState("");
  const [savedCallId, setSavedCallId] = useState<string | null>(null);

  // Audio & Mic Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const agentAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setPhase("dialer");
      setPhoneNumber(defaultPhone);
      setTurns([]);
      setCallDuration(0);
      setErrorMessage(null);
      setSavedCallId(null);
    } else {
      cleanupCall();
    }
  }, [isOpen, defaultPhone]);

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [turns, phase]);

  // Clean up all resources
  const cleanupCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch {}
    }
    if (agentAudioRef.current) {
      agentAudioRef.current.pause();
      agentAudioRef.current.currentTime = 0;
    }
  };

  // Play realistic synthesized ringtone using Web Audio API
  const playRingtoneBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 400; // Indian/standard ringback
      osc2.frequency.value = 450;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {
      // AudioContext might be blocked until user gesture, ignore safely
    }
  };

  // Start Call Flow
  const handleStartCall = async () => {
    setErrorMessage(null);
    setPhase("connecting");
    setStatusText(`Connecting to ${agentVoiceName} at ${companyName}...`);

    // Ringing sound
    playRingtoneBeep();
    ringtoneTimerRef.current = setInterval(playRingtoneBeep, 2500);

    try {
      const res = await fetch("/api/live-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", phoneNumber }),
      });

      if (!res.ok) {
        throw new Error(`Failed to initiate live call (${res.status})`);
      }

      const data = await res.json();
      if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);

      setSessionId(data.sessionId || `live_call_${Date.now()}`);
      setPhase("greeting");
      setStatusText(`${data.agentVoice || agentVoiceName} is speaking...`);

      // Add agent greeting turn
      const greetingTurn: Turn = {
        speaker: "agent",
        text: data.greeting || `నమస్కారం! నేను ${companyName} నుండి మాట్లాడుతున్నాను.`,
      };
      setTurns([greetingTurn]);

      // Start call duration counter
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Play Greeting Audio
      playAgentAudio(data.audioUrl, () => {
        // Once greeting completes, transition to listening to user mic
        startListening();
      });
    } catch (err: any) {
      if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);
      setErrorMessage(err.message || "Failed to connect to AI agent.");
      setPhase("dialer");
    }
  };

  // Play Agent Audio & execute callback when finished
  const playAgentAudio = (url: string, onEnded?: () => void) => {
    if (!url) {
      if (onEnded) onEnded();
      return;
    }
    const audio = new Audio(url);
    agentAudioRef.current = audio;
    audio.play().catch((e) => {
      console.warn("Autoplay was blocked or audio failed:", e);
      if (onEnded) onEnded();
    });
    audio.onended = () => {
      if (onEnded) onEnded();
    };
  };

  // Start user microphone recording
  const startListening = async () => {
    setPhase("listening");
    setStatusText("Agent is listening... Speak into your microphone now");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : undefined,
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
    } catch (err: any) {
      console.warn("Microphone access unavailable, using keyboard fallback:", err);
      setStatusText("Microphone unavailable. You can type your response below.");
    }
  };

  // User finished speaking -> send audio to Gnani STT + Gemini + Gnani Timbre
  const handleDoneSpeaking = async () => {
    if (phase !== "listening") return;

    setPhase("processing");
    setStatusText("Transcribing your speech with Gnani Prisma STT...");

    const chunks = audioChunksRef.current;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch {}
    }

    try {
      const formData = new FormData();
      formData.append("history", JSON.stringify(turns));
      formData.append("phoneNumber", phoneNumber);

      if (chunks.length > 0) {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        formData.append("audio", audioBlob, "mic_input.webm");
      } else if (textInputFallback.trim()) {
        // Fallback if typed text
        const textBlob = new Blob([textInputFallback], { type: "text/plain" });
        formData.append("audio", textBlob, "mic_input.webm");
      }

      setStatusText("Gemini is analyzing & Gnani Timbre is synthesizing speech...");

      const res = await fetch("/api/live-call", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Turn failed with status ${res.status}`);
      }

      const data = await res.json();
      setTextInputFallback("");

      const userText = data.customerText || "(Customer Speech)";
      const agentReply = data.agentReply || "ధన్యవాదాలు అండి.";

      setTurns((prev) => [
        ...prev,
        { speaker: "customer", text: userText },
        { speaker: "agent", text: agentReply },
      ]);

      setPhase("speaking");
      setStatusText(`${agentVoiceName} is speaking...`);

      // Play Agent Spoken Reply
      playAgentAudio(data.audioUrl, () => {
        // Finished speaking -> listen again
        startListening();
      });
    } catch (turnErr: any) {
      console.error("Turn error:", turnErr);
      setStatusText("Could not process speech. Please try speaking again.");
      setTimeout(() => startListening(), 1500);
    }
  };

  // Submit fallback text response
  const handleSendTextFallback = () => {
    if (!textInputFallback.trim()) return;
    handleDoneSpeaking();
  };

  // End Call & Save full conversation into SQLite calls & leads
  const handleEndCall = async () => {
    cleanupCall();
    setPhase("ended");
    setStatusText("Saving call recording & generating CRM Lead Card...");

    try {
      const res = await fetch("/api/live-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          sessionId,
          turns,
          customerPhone: phoneNumber,
        }),
      });

      const data = await res.json();
      if (data.callId) {
        setSavedCallId(data.callId);
        if (onCallSaved) onCallSaved(data.callId);
      }
      setStatusText("Call successfully saved to recordings and leads database!");
    } catch (e) {
      console.error("End call save error:", e);
      setStatusText("Call ended.");
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-paper/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-semibold text-ink">
                  Live Interactive AI Phone Call
                </h3>
                <span className="text-[10px] bg-secondary/15 text-secondary border border-secondary/30 px-1.5 py-0.2 rounded font-medium">
                  Free Tier
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Gnani Prisma (STT) + Gemini 2.5 + Gnani Timbre (TTS)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanupCall();
              onClose();
            }}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-paper border border-transparent hover:border-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* PHASE 1: DIALER KEYPAD */}
          {phase === "dialer" && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs text-muted">Recipient Prospect Phone Number</span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-center font-mono text-xl sm:text-2xl font-bold bg-paper border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-ink"
                  placeholder="+91 98490 22334"
                />
              </div>

              {/* Number Keypad Grid */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPhoneNumber((prev) => prev + key)}
                    className="h-12 rounded-xl bg-paper border border-border hover:border-accent text-ink font-semibold text-lg flex items-center justify-center hover:bg-paper/80 transition-all active:scale-95"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Call Agent Details Banner */}
              <div className="bg-paper border border-border rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted">
                  <span>AI Sales Executive:</span>
                  <strong className="text-ink">{agentVoiceName}</strong>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Representing Business:</span>
                  <strong className="text-ink">{companyName}</strong>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Microphone:</span>
                  <span className="text-secondary font-medium">Browser Real-time Audio</span>
                </div>
              </div>

              {/* Green Call Action Button */}
              <button
                onClick={handleStartCall}
                className="w-full py-3.5 bg-secondary text-surface font-semibold text-sm rounded-xl hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Call AI Agent Now (Free Demo)</span>
              </button>
            </div>
          )}

          {/* PHASE 2, 3, 4, 5: LIVE CALL ACTIVE */}
          {(phase === "connecting" ||
            phase === "greeting" ||
            phase === "listening" ||
            phase === "processing" ||
            phase === "speaking") && (
            <div className="space-y-4">
              {/* Active Call Status Card */}
              <div className="bg-paper border border-border rounded-xl p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                  <span className="font-mono text-sm font-semibold text-secondary">
                    {phase === "connecting" ? "DIALING..." : formatDuration(callDuration)}
                  </span>
                </div>

                <div className="font-heading text-lg font-bold text-ink">{companyName}</div>
                <div className="text-xs text-muted font-mono">{phoneNumber}</div>

                {/* Animated Voice Indicator */}
                <div className="pt-2 flex items-center justify-center gap-1.5 h-8">
                  {phase === "speaking" || phase === "greeting" ? (
                    <>
                      <span className="w-1.5 h-6 bg-accent animate-pulse rounded-full" />
                      <span className="w-1.5 h-8 bg-accent animate-pulse delay-75 rounded-full" />
                      <span className="w-1.5 h-4 bg-accent animate-pulse delay-150 rounded-full" />
                      <span className="w-1.5 h-7 bg-accent animate-pulse delay-100 rounded-full" />
                      <span className="w-1.5 h-5 bg-accent animate-pulse delay-200 rounded-full" />
                    </>
                  ) : phase === "listening" ? (
                    <>
                      <span className="w-1.5 h-4 bg-secondary animate-bounce rounded-full" />
                      <span className="w-1.5 h-7 bg-secondary animate-bounce delay-100 rounded-full" />
                      <span className="w-1.5 h-5 bg-secondary animate-bounce delay-200 rounded-full" />
                      <span className="w-1.5 h-6 bg-secondary animate-bounce delay-75 rounded-full" />
                      <span className="w-1.5 h-3 bg-secondary animate-bounce delay-150 rounded-full" />
                    </>
                  ) : phase === "processing" ? (
                    <RefreshCw className="w-5 h-5 text-accent animate-spin" />
                  ) : (
                    <Radio className="w-5 h-5 text-muted animate-pulse" />
                  )}
                </div>

                <div className="text-xs font-medium text-ink bg-surface border border-border/80 px-3 py-1.5 rounded-lg inline-block shadow-xs">
                  {statusText}
                </div>
              </div>

              {/* Live Conversation Transcript */}
              <div
                ref={chatScrollRef}
                className="bg-paper/60 border border-border rounded-xl p-3 space-y-2.5 max-h-48 overflow-y-auto text-xs"
              >
                {turns.length === 0 ? (
                  <p className="text-muted text-center py-4">Waiting for call connection...</p>
                ) : (
                  turns.map((turn, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 ${
                        turn.speaker === "agent" ? "items-start" : "items-end flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          turn.speaker === "agent"
                            ? "bg-accent/15 text-accent border border-accent/20"
                            : "bg-secondary/15 text-secondary border border-secondary/20"
                        }`}
                      >
                        {turn.speaker === "agent" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div
                        className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${
                          turn.speaker === "agent"
                            ? "bg-surface border border-border text-ink"
                            : "bg-secondary text-surface"
                        }`}
                      >
                        <p className="text-[10px] font-semibold opacity-75 mb-0.5">
                          {turn.speaker === "agent" ? `${agentVoiceName} (AI Agent)` : "You (Customer)"}
                        </p>
                        <p>{turn.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* User Mic / Speaking Controls */}
              {phase === "listening" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleDoneSpeaking}
                      className="flex-1 py-3 bg-secondary text-surface font-semibold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Mic className="w-4 h-4 animate-pulse" />
                      <span>Done Speaking / Send to AI</span>
                    </button>
                  </div>
                  {/* Fallback keyboard input in case mic is muted or quiet environment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Or type what you want to say..."
                      value={textInputFallback}
                      onChange={(e) => setTextInputFallback(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendTextFallback()}
                      className="flex-1 text-xs bg-paper border border-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={handleSendTextFallback}
                      disabled={!textInputFallback.trim()}
                      className="px-3 py-2 bg-paper border border-border hover:border-accent text-ink rounded-lg text-xs disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Red Hang Up Button */}
              <button
                onClick={handleEndCall}
                className="w-full py-3 bg-destructive text-surface font-semibold text-xs rounded-xl hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call &amp; Save to CRM</span>
              </button>
            </div>
          )}

          {/* PHASE 6: CALL ENDED & SAVED */}
          {phase === "ended" && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary border border-secondary/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-base font-bold text-ink">
                  Call Saved Successfully!
                </h4>
                <p className="text-xs text-muted">
                  Total duration: <strong>{formatDuration(callDuration)}</strong> · Total turns:{" "}
                  <strong>{turns.length}</strong>
                </p>
              </div>

              <div className="bg-paper border border-border rounded-xl p-3 text-left space-y-2 text-xs">
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span>Call Summary &amp; Lead Extracted</span>
                </div>
                <p className="text-muted leading-relaxed">
                  The audio transcript, customer questions, and structured lead data have been saved
                  to your recordings table and CRM dashboard.
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/calls"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-surface border border-border hover:border-accent text-ink text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View in Recordings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => {
                    setPhase("dialer");
                    setTurns([]);
                    setCallDuration(0);
                  }}
                  className="flex-1 py-2.5 bg-accent text-surface text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Make Another Call
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
