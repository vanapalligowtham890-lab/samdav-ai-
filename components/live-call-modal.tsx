"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Mic,
  Volume2,
  Bot,
  User,
  Send,
  CheckCircle2,
  X,
  Radio,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Smartphone,
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
  | "dialer" // Dialpad / options
  | "incoming_ring" // Simulated incoming call ringing on device
  | "connecting" // Outgoing ringing
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
  const [callMode, setCallMode] = useState<"incoming" | "outgoing">("incoming");
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [sessionId, setSessionId] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [statusText, setStatusText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textInputFallback, setTextInputFallback] = useState("");
  const [savedCallId, setSavedCallId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

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
      setCallMode("incoming");
      setPhoneNumber(defaultPhone);
      setTurns([]);
      setCallDuration(0);
      setErrorMessage(null);
      setSavedCallId(null);
      setAudioBlocked(false);
      setCurrentAudioUrl(null);
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

  // Play realistic phone ringtone using Web Audio API
  const playRingtone = (isIncoming: boolean = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Incoming ring: dual tones 440Hz + 480Hz
      osc1.frequency.value = isIncoming ? 440 : 400;
      osc2.frequency.value = isIncoming ? 480 : 450;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.4);
      osc2.stop(ctx.currentTime + 1.4);

      // Trigger mobile device vibration if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([400, 200, 400]);
      }
    } catch {}
  };

  // Pre-prime audio element synchronously on click
  const primeAudioElement = () => {
    if (!agentAudioRef.current) {
      const audio = new Audio();
      agentAudioRef.current = audio;
    }
  };

  // 1. INCOMING CALL TRIGGER: Agent rings the user's phone screen
  const handleTriggerIncomingCall = () => {
    primeAudioElement();
    setErrorMessage(null);
    setPhase("incoming_ring");
    setStatusText("Incoming Call from AI Sales Agent...");

    playRingtone(true);
    ringtoneTimerRef.current = setInterval(() => playRingtone(true), 2400);
  };

  // 2. ANSWER INCOMING CALL (User clicks big green Answer button)
  const handleAnswerIncomingCall = async () => {
    if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);
    primeAudioElement();
    setPhase("greeting");
    setStatusText(`Connected! ${agentVoiceName} is speaking...`);

    // Fetch live call start
    try {
      const res = await fetch("/api/live-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", phoneNumber }),
      });

      if (!res.ok) throw new Error(`Call start failed (${res.status})`);
      const data = await res.json();

      setSessionId(data.sessionId || `live_call_${Date.now()}`);
      const greetingTurn: Turn = {
        speaker: "agent",
        text: data.greeting || `నమస్కారం! నేను ${companyName} నుండి మాట్లాడుతున్నాను.`,
      };
      setTurns([greetingTurn]);

      // Start duration counter
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Play audio
      playAgentAudio(data.audioUrl, () => {
        startListening();
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Could not connect to live agent.");
      setPhase("dialer");
    }
  };

  // 3. OUTGOING CALL (User calls Agent)
  const handleStartOutgoingCall = async () => {
    primeAudioElement();
    setErrorMessage(null);
    setPhase("connecting");
    setStatusText(`Calling ${agentVoiceName} at ${companyName}...`);

    playRingtone(false);
    ringtoneTimerRef.current = setInterval(() => playRingtone(false), 2600);

    try {
      const res = await fetch("/api/live-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", phoneNumber }),
      });

      if (!res.ok) throw new Error(`Failed to initiate live call (${res.status})`);
      const data = await res.json();
      if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);

      setSessionId(data.sessionId || `live_call_${Date.now()}`);
      setPhase("greeting");
      setStatusText(`${data.agentVoice || agentVoiceName} is speaking...`);

      const greetingTurn: Turn = {
        speaker: "agent",
        text: data.greeting || `నమస్కారం! నేను ${companyName} నుండి మాట్లాడుతున్నాను.`,
      };
      setTurns([greetingTurn]);

      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      playAgentAudio(data.audioUrl, () => {
        startListening();
      });
    } catch (err: any) {
      if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);
      setErrorMessage(err.message || "Failed to connect to AI agent.");
      setPhase("dialer");
    }
  };

  // Play Agent Audio & handle playback smoothly
  const playAgentAudio = (url: string, onEnded?: () => void) => {
    if (!url) {
      if (onEnded) onEnded();
      return;
    }

    setCurrentAudioUrl(url);
    setAudioBlocked(false);

    let audio = agentAudioRef.current;
    if (!audio) {
      audio = new Audio();
      agentAudioRef.current = audio;
    }

    audio.src = url;
    audio.onended = () => {
      if (onEnded) onEnded();
    };

    audio.onerror = () => {
      console.warn("Audio playback error, falling back to static voice:", url);
      // Fallback to static voice preview
      audio.src = `/audio/voice_${agentVoiceName.toLowerCase()}.wav`;
      audio.play().catch(() => {});
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Autoplay block detected:", err);
        setAudioBlocked(true);
        setStatusText("Click 'Tap to Listen' below to hear the voice.");
        // Do NOT automatically skip to listening if user hasn't heard agent!
      });
    }
  };

  // Manually unlock and replay agent audio
  const handleManualPlayAudio = () => {
    if (agentAudioRef.current && currentAudioUrl) {
      agentAudioRef.current.src = currentAudioUrl;
      agentAudioRef.current.play().then(() => {
        setAudioBlocked(false);
        setStatusText(`${agentVoiceName} is speaking...`);
      }).catch(() => {});
    }
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
      console.warn("Microphone access unavailable:", err);
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
        const textBlob = new Blob([textInputFallback], { type: "text/plain" });
        formData.append("audio", textBlob, "mic_input.webm");
      }

      setStatusText("Gemini is analyzing & Gnani Timbre is synthesizing speech...");

      const res = await fetch("/api/live-call", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Turn failed with status ${res.status}`);

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

      playAgentAudio(data.audioUrl, () => {
        startListening();
      });
    } catch (turnErr: any) {
      console.error("Turn error:", turnErr);
      setStatusText("Could not process speech. Please speak again.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md sm:max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border flex items-center justify-between bg-paper/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-semibold text-ink">
                  AI Live Phone Call
                </h3>
                <span className="text-[10px] bg-secondary/15 text-secondary border border-secondary/30 px-1.5 py-0.2 rounded font-medium">
                  Free Demo
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Gnani Prisma STT + Gemini 2.5 + Gnani Timbre TTS
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
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* PHASE 1: DIALER / CALL TRIGGER */}
          {phase === "dialer" && (
            <div className="space-y-4">
              {/* Call Direction Tabs: "Call My Phone (Incoming)" vs "I Call Agent (Outgoing)" */}
              <div className="flex rounded-xl bg-paper p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setCallMode("incoming")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    callMode === "incoming"
                      ? "bg-secondary text-surface shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <PhoneIncoming className="w-3.5 h-3.5" />
                  <span>Call My Phone (Incoming)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCallMode("outgoing")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    callMode === "outgoing"
                      ? "bg-accent text-surface shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Dial Out to Agent</span>
                </button>
              </div>

              {/* Phone Number Display */}
              <div className="text-center space-y-1">
                <span className="text-xs text-muted">
                  {callMode === "incoming" ? "Your Mobile Phone Number" : "Agent Dialing Number"}
                </span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-center font-mono text-xl sm:text-2xl font-bold bg-paper border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent text-ink"
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
                    className="h-11 rounded-xl bg-paper border border-border hover:border-accent text-ink font-semibold text-lg flex items-center justify-center hover:bg-paper/80 transition-all active:scale-95"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Business & Voice Banner */}
              <div className="bg-paper border border-border rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span>AI Executive:</span>
                  <strong className="text-ink">{agentVoiceName}</strong>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Business Represented:</span>
                  <strong className="text-ink">{companyName}</strong>
                </div>
                <div className="text-[11px] text-muted pt-1 border-t border-border">
                  {callMode === "incoming" ? (
                    <span>💡 Rings your device with simulated incoming call &amp; vibration. Tap <strong>Accept</strong> to answer!</span>
                  ) : (
                    <span>💡 Connects instantly via your microphone and speaks with Gnani Timbre voice.</span>
                  )}
                </div>
              </div>

              {/* Main Call Action Button */}
              {callMode === "incoming" ? (
                <button
                  onClick={handleTriggerIncomingCall}
                  className="w-full py-3.5 bg-secondary text-surface font-semibold text-sm rounded-xl hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 group"
                >
                  <PhoneIncoming className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Ring My Phone Now (Incoming Call)</span>
                </button>
              ) : (
                <button
                  onClick={handleStartOutgoingCall}
                  className="w-full py-3.5 bg-accent text-surface font-semibold text-sm rounded-xl hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 group"
                >
                  <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Call AI Agent Now</span>
                </button>
              )}
            </div>
          )}

          {/* PHASE 2: INCOMING CALL RINGING SCREEN (Realistic Smartphone Look) */}
          {phase === "incoming_ring" && (
            <div className="py-6 sm:py-8 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
              <div className="relative">
                {/* Pulsing incoming call waves */}
                <span className="absolute -inset-4 rounded-full bg-secondary/20 animate-ping" />
                <span className="absolute -inset-8 rounded-full bg-secondary/10 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-secondary/15 border-2 border-secondary/40 flex items-center justify-center text-secondary shadow-lg">
                  <PhoneIncoming className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-secondary font-bold animate-pulse">
                  INCOMING CALL...
                </span>
                <h4 className="font-heading text-2xl font-bold text-ink">
                  {companyName}
                </h4>
                <p className="text-xs text-muted font-medium">
                  {agentVoiceName} · AI Sales Executive
                </p>
                <p className="font-mono text-sm text-ink font-semibold pt-1">
                  {phoneNumber}
                </p>
              </div>

              {/* Accept & Decline Buttons */}
              <div className="flex items-center justify-center gap-8 pt-4 w-full">
                {/* Decline Button */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);
                      setPhase("dialer");
                    }}
                    className="w-14 h-14 rounded-full bg-destructive text-surface flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <span className="text-[11px] text-muted font-medium">Decline</span>
                </div>

                {/* Accept Button */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={handleAnswerIncomingCall}
                    className="w-16 h-16 rounded-full bg-secondary text-surface flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform animate-pulse border-2 border-surface"
                  >
                    <Phone className="w-7 h-7" />
                  </button>
                  <span className="text-xs text-secondary font-bold">Answer / Accept</span>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 3, 4, 5, 6: ACTIVE CALL (GREETING, LISTENING, SPEAKING) */}
          {(phase === "connecting" ||
            phase === "greeting" ||
            phase === "listening" ||
            phase === "processing" ||
            phase === "speaking") && (
            <div className="space-y-4">
              {/* Call Header Status Card */}
              <div className="bg-paper border border-border rounded-xl p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                  <span className="font-mono text-sm font-semibold text-secondary">
                    {phase === "connecting" ? "CONNECTING..." : formatDuration(callDuration)}
                  </span>
                </div>

                <div className="font-heading text-lg font-bold text-ink">{companyName}</div>
                <div className="text-xs text-muted font-mono">{phoneNumber}</div>

                {/* Animated Voice Equalizer */}
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

                {/* Unmute / Replay Banner if Autoplay Was Blocked */}
                {audioBlocked && (
                  <button
                    onClick={handleManualPlayAudio}
                    className="mt-2 w-full py-2 bg-accent text-surface text-xs font-semibold rounded-lg flex items-center justify-center gap-2 animate-bounce shadow-md"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Tap Here to Listen / Unmute Agent Voice</span>
                  </button>
                )}
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

          {/* PHASE 7: CALL ENDED & SAVED */}
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
