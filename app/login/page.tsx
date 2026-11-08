"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Play, 
  Pause, 
  Volume2, 
  ShieldAlert
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { ALL_VOICES, VoiceDefinition } from "@/lib/voice-catalog";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const redirectUrl = searchParams.get("redirect") || "/today";

  const { user, loading: authLoading, login, isFirebaseConnected } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Preview Section States
  const [selectedVoice, setSelectedVoice] = useState<VoiceDefinition>(ALL_VOICES[0]);
  const [languageFilter, setLanguageFilter] = useState("all");
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // If already logged in, redirect to dashboard or intended page
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push(redirectUrl);
    } catch (err: any) {
      if (err.message === "USER_NOT_FOUND" || err.code === "auth/user-not-found") {
        setError("No account found with this email. Redirecting you to Sign up...");
        setTimeout(() => {
          router.push(`/signup?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectUrl)}`);
        }, 1200);
      } else if (err.message === "INVALID_PASSWORD" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password. Please try again or use the forgot password link.");
      } else {
        setError(err.message || "Failed to sign in. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVoicePreview = async (v: VoiceDefinition) => {
    if (isPlayingVoice && selectedVoice.id === v.id) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingVoice(false);
      return;
    }

    setSelectedVoice(v);
    setLoadingVoice(true);

    try {
      const res = await fetch("/api/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice: v.id,
          text: v.sampleText,
          language: v.language,
          model: v.model,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingVoice(false);
        audio.play().catch(() => setIsPlayingVoice(false));
        setIsPlayingVoice(true);
      }
    } catch (err) {
      console.error("Preview play failed:", err);
    } finally {
      setLoadingVoice(false);
    }
  };

  const filteredVoices = ALL_VOICES.filter((v) => {
    if (languageFilter === "telugu") return v.language === "te-IN";
    if (languageFilter === "hindi") return v.language === "hi-IN";
    if (languageFilter === "english") return v.language === "en-IN";
    if (languageFilter === "hinglish") return v.language === "hi-en";
    if (languageFilter === "tamil") return v.language === "ta-IN";
    if (languageFilter === "kannada") return v.language === "kn-IN";
    return true;
  });

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        <BlurFade delay={0.05}>
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-surface border border-border/80 p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Vaani Recap"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-heading text-2xl font-bold tracking-tight text-ink">
                Vaani Recap
              </span>
            </Link>
            <h1 className="text-3xl font-heading text-ink">Login to your sales portal</h1>
            <p className="text-xs text-muted">
              AI Outbound Cold Call Agent &amp; Conversational Recaps powered by Gnani Prisma &amp; Timbre
            </p>
          </div>
        </BlurFade>

        {/* Asymmetric Two-Column Grid: Form (Left) & Live Voice Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Login Form */}
          <div className="lg:col-span-5 bg-surface border border-border py-8 px-6 sm:px-8 rounded-lg paper-shadow space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="font-heading text-lg text-ink font-semibold">Account Sign In</h2>
              <p className="text-xs text-muted">Enter your registered email and password</p>
            </div>

            {/* Informational redirect alert if user was pushed here from protected dashboard */}
            {redirectUrl && redirectUrl !== "/" && (
              <div className="bg-accent/10 border border-accent/20 text-accent text-xs p-3 rounded-md flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>Please log in first to access the dashboard and call records.</span>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-3" strokeWidth={1.5} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@business.com"
                    className="w-full bg-paper border border-border rounded-md pl-9 pr-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                    Password
                  </label>
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(email)}`}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-3" strokeWidth={1.5} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-paper border border-border rounded-md pl-9 pr-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-surface py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs mt-2"
              >
                {loading ? "Signing in..." : "Log in to portal"}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </form>

            <div className="pt-4 border-t border-border text-center text-xs text-muted">
              Don&apos;t have an account?{" "}
              <Link 
                href={`/signup?redirect=${encodeURIComponent(redirectUrl)}`} 
                className="text-accent hover:underline font-medium"
              >
                Create new account
              </Link>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-muted inline-flex items-center gap-1.5 bg-paper px-2.5 py-1 rounded border border-border">
                <Sparkles className="w-3 h-3 text-secondary" strokeWidth={1.5} />
                {isFirebaseConnected ? "Connected to Firebase Realtime DB" : "Firebase Realtime DB Synced"}
              </span>
            </div>
          </div>

          {/* Right Column: PREVIEW SECTION (Voice Preview & Live Portal Preview) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Voice Preview Section */}
            <div className="bg-surface border border-border rounded-lg p-6 paper-shadow space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-accent" strokeWidth={1.5} />
                  <h3 className="font-heading text-base text-ink font-semibold">
                    Voice Preview Section (All Indian Languages)
                  </h3>
                </div>
                <span className="text-xs text-muted font-mono">Gnani Timbre v3.0 &amp; v2.5</span>
              </div>

              <p className="text-xs text-muted">
                Audition authentic voice personas across Telugu, Hindi, English, Hinglish, Tamil, and Kannada:
              </p>

              {/* Language Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "All Voices" },
                  { id: "telugu", label: "Telugu" },
                  { id: "hindi", label: "Hindi" },
                  { id: "english", label: "English" },
                  { id: "hinglish", label: "Hinglish" },
                  { id: "tamil", label: "Tamil" },
                  { id: "kannada", label: "Kannada" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLanguageFilter(f.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                      languageFilter === f.id
                        ? "bg-accent text-surface font-medium"
                        : "bg-paper text-muted hover:text-ink border border-border"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Voice Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {filteredVoices.map((v) => {
                  const isCurrent = selectedVoice.id === v.id;
                  const isCurrentPlaying = isCurrent && isPlayingVoice;

                  return (
                    <div
                      key={v.id}
                      className={`border rounded-lg p-3 space-y-2 transition-all ${
                        isCurrent
                          ? "border-accent bg-accent/5 paper-shadow ring-1 ring-accent"
                          : "border-border bg-paper/60 hover:bg-paper"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-heading font-semibold text-sm text-ink">{v.name}</span>
                          <span className="text-[10px] text-muted ml-2">({v.gender} · {v.languageLabel})</span>
                        </div>
                        <button
                          onClick={() => handlePlayVoicePreview(v)}
                          disabled={loadingVoice}
                          className="w-7 h-7 rounded-full bg-accent text-surface flex items-center justify-center hover:opacity-90 shrink-0 shadow-xs"
                          title={`Listen to ${v.name}`}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2">{v.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Sample Spoken Script */}
              <div className="bg-paper p-3 rounded-md border border-border space-y-1 text-xs">
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium block">
                  Selected Preview Line: {selectedVoice.name} ({selectedVoice.languageLabel})
                </span>
                <p className="telugu-quote text-xs text-ink italic leading-relaxed">
                  &ldquo;{selectedVoice.sampleText}&rdquo;
                </p>
              </div>
            </div>

            {/* 2. Portal Dashboard Live Preview Card */}
            <div className="bg-surface border border-border rounded-lg p-5 paper-shadow space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">
                  Portal Dashboard Metrics Preview
                </span>
                <span className="text-xs font-mono text-secondary font-medium">Live Snapshot</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-paper p-2 rounded border border-border">
                  <span className="text-[10px] text-muted block">Ongoing</span>
                  <span className="font-heading text-lg font-bold text-accent">1</span>
                </div>
                <div className="bg-paper p-2 rounded border border-border">
                  <span className="text-[10px] text-muted block">Answered</span>
                  <span className="font-heading text-lg font-bold text-ink">5</span>
                </div>
                <div className="bg-paper p-2 rounded border border-border">
                  <span className="text-[10px] text-muted block">Closed</span>
                  <span className="font-heading text-lg font-bold text-ink">5</span>
                </div>
                <div className="bg-secondary/10 p-2 rounded border border-secondary/20">
                  <span className="text-[10px] text-secondary font-semibold block">Won</span>
                  <span className="font-heading text-lg font-bold text-secondary">5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-xs text-muted">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
