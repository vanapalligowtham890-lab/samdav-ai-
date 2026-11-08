"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  LogOut,
  PhoneForwarded, 
  FileSpreadsheet, 
  Volume2, 
  Play, 
  Pause, 
  Sliders, 
  Database,
  Lock
} from "lucide-react";
import { ALL_VOICES, VoiceDefinition } from "@/lib/voice-catalog";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const { user, logout } = useAuth();

  const [selectedVoice, setSelectedVoice] = useState<VoiceDefinition>(ALL_VOICES[0]);
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const businesses = [
    "స్మైల్ డెంటల్ కేర్ (Smile Dental Care)",
    "విజేత ఐఐటీ అకాడమీ (Vijetha Academy)",
    "శ్రీ సాయి ప్రాపర్టీస్ (Sri Sai Properties)",
    "రమ్య డిజైనర్ బొటిక్ (Ramya Boutique)",
    "కేర్ పాలీక్లినిక్ (Care Polyclinic)",
    "శ్రీనివాస హోండా (Srinivasa Honda Motors)",
  ];

  const handlePlayVoice = async (v: VoiceDefinition) => {
    if (isPlaying && selectedVoice.id === v.id) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setSelectedVoice(v);
    setLoadingAudio(true);

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
        audio.onended = () => setIsPlaying(false);
        audio.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Preview play failed:", err);
    } finally {
      setLoadingAudio(false);
    }
  };

  const filteredVoices = ALL_VOICES.filter((v) => {
    if (voiceFilter === "telugu") return v.language === "te-IN";
    if (voiceFilter === "hindi") return v.language === "hi-IN";
    if (voiceFilter === "english") return v.language === "en-IN";
    if (voiceFilter === "hinglish") return v.language === "hi-en";
    if (voiceFilter === "tamil") return v.language === "ta-IN";
    if (voiceFilter === "kannada") return v.language === "kn-IN";
    return true;
  });

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent/20">
      {/* Top Header with High-Visibility Log in & Sign up Buttons */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border/80 p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="Vaani Recap"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="shrink-0 flex flex-col justify-center">
              <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-ink leading-tight whitespace-nowrap">
                Vaani Recap
              </span>
              <span className="text-[10px] text-muted font-medium tracking-wide whitespace-nowrap">
                Gnani Prisma &amp; Timbre
              </span>
            </div>
          </Link>

          {/* Quick links & Auth CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#voices"
              className="hidden lg:inline-flex items-center text-xs text-muted hover:text-ink font-medium px-2 py-1"
            >
              Voice Catalog
            </a>
            <a
              href="#features"
              className="hidden lg:inline-flex items-center text-xs text-muted hover:text-ink font-medium px-2 py-1"
            >
              Workflow
            </a>

            {user ? (
              // If user is already authenticated
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink font-medium hidden sm:inline-block max-w-[130px] truncate bg-paper border border-border px-2.5 py-1 rounded">
                  {user.email}
                </span>
                <Link
                  href="/today"
                  className="inline-flex items-center gap-1.5 text-xs text-surface bg-accent px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-xs"
                >
                  Dashboard &rarr;
                </Link>
                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="text-xs text-muted hover:text-destructive p-1.5 rounded-md hover:bg-paper border border-border transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              // If unauthenticated: MUST ASK LOGIN
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-ink bg-surface border border-border hover:border-accent hover:text-accent px-3 py-1.5 rounded-lg font-medium transition-colors paper-shadow"
                >
                  <LogIn className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} /> Log in
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 bg-accent text-surface px-3.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} /> Sign up
                </Link>

                <Link
                  href="/login?redirect=/today"
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-muted hover:text-ink font-medium px-2 py-1.5"
                  title="Log in required to view dashboard"
                >
                  <Lock className="w-3 h-3 text-muted" /> Dashboard &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        {/* Hero Section */}
        <div className="space-y-6 max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-surface border border-border text-muted">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Built for the Gnani AI Great Indian AI Internship Challenge
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading text-ink tracking-tight leading-[1.15]">
            Every sales call dialed, transcribed, and briefed in your customer&apos;s native voice.
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
            Upload your Excel cold call list, configure your verified forwarding caller ID, and deploy autonomous AI sales calling agents powered by <strong className="text-ink font-semibold">Gnani Prisma STT</strong> &amp; <strong className="text-ink font-semibold">Gnani Timbre TTS</strong> across Telugu, Hindi, English, Tamil, and all Indian languages.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 w-full">
            {user ? (
              <Link
                href="/today"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-surface px-6 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-xs"
              >
                Go to live dashboard <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-surface px-6 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-xs"
                >
                  <UserPlus className="w-4 h-4" strokeWidth={1.5} /> Sign up &amp; set up agent
                </Link>

                <Link
                  href="/login?redirect=/today"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface text-ink border border-border hover:border-accent px-5 py-3 rounded-lg text-sm font-medium transition-colors paper-shadow"
                >
                  <LogIn className="w-4 h-4 text-accent" strokeWidth={1.5} /> Log in to portal
                </Link>

                <Link
                  href="/login?redirect=/today"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs text-muted hover:text-ink font-medium px-3 py-2"
                >
                  <Lock className="w-3.5 h-3.5 text-muted" /> Access dashboard (Log in required) &rarr;
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Voice Audition Carousel / Grid on Homepage */}
        <section id="voices" className="bg-surface border border-border rounded-lg p-6 sm:p-8 paper-shadow space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-accent" strokeWidth={1.5} />
                <h2 className="font-heading text-xl text-ink font-semibold">
                  Audition Gnani Timbre Voice Personas
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                Listen to natural Indian voices across all languages (Timbre v3.0 &amp; v2.5) right from your browser.
              </p>
            </div>

            {/* Filter buttons */}
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
                  onClick={() => setVoiceFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    voiceFilter === f.id
                      ? "bg-accent text-surface font-medium"
                      : "bg-paper text-muted hover:text-ink border border-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredVoices.map((v) => {
              const isCurrent = selectedVoice.id === v.id;
              const isPlayingCurrent = isCurrent && isPlaying;

              return (
                <div
                  key={v.id}
                  className={`border rounded-lg p-3.5 space-y-2 transition-all ${
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
                      onClick={() => handlePlayVoice(v)}
                      disabled={loadingAudio}
                      className="w-8 h-8 rounded-full bg-accent text-surface flex items-center justify-center hover:opacity-90 shrink-0 shadow-xs"
                      title={`Listen to ${v.name}`}
                    >
                      {isPlayingCurrent ? (
                        <Pause className="w-4 h-4 fill-current" strokeWidth={1.5} />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted line-clamp-2">{v.description}</p>
                </div>
              );
            })}
          </div>

          {/* Spoken Quote of Selected Voice */}
          <div className="bg-paper p-4 rounded-lg border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted font-medium">
                Preview Script: {selectedVoice.name} ({selectedVoice.languageLabel} · {selectedVoice.model})
              </span>
              <span className="text-xs text-accent font-medium">
                {isPlaying ? "Playing sample audio..." : "Click play on any card to audition"}
              </span>
            </div>
            <p className="telugu-quote text-sm text-ink italic leading-relaxed">
              &ldquo;{selectedVoice.sampleText}&rdquo;
            </p>
          </div>
        </section>

        {/* Feature Badges / Workflow */}
        <section id="features" className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="font-heading text-xl text-ink font-semibold">
              How the Outbound Synthetic Calling Agent Works
            </h2>
            <p className="text-xs text-muted">
              Built end-to-end to turn cold prospect spreadsheets into high-converting sales conversations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-5 rounded-lg border border-border paper-shadow space-y-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <FileSpreadsheet className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-medium text-base text-ink">1. Excel Sheet Import</h3>
              <p className="text-xs text-muted leading-relaxed">
                Upload <code className="font-mono text-ink">.xlsx</code> or <code className="font-mono text-ink">.csv</code> lists. Automatically maps columns for Name, Phone, and Need.
              </p>
            </div>

            <div className="bg-surface p-5 rounded-lg border border-border paper-shadow space-y-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                <PhoneForwarded className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-medium text-base text-ink">2. Forwarding Caller ID</h3>
              <p className="text-xs text-muted leading-relaxed">
                Calls display and forward through your verified business telephone number for maximum answer rate.
              </p>
            </div>

            <div className="bg-surface p-5 rounded-lg border border-border paper-shadow space-y-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Sliders className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-medium text-base text-ink">3. Virtual Script &amp; Voice</h3>
              <p className="text-xs text-muted leading-relaxed">
                Agent dynamically interpolates lead details into custom pitches in Telugu, Hindi, English, or Tamil.
              </p>
            </div>

            <div className="bg-surface p-5 rounded-lg border border-border paper-shadow space-y-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                <Database className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-medium text-base text-ink">4. Realtime DB &amp; Brief</h3>
              <p className="text-xs text-muted leading-relaxed">
                Live metrics for Ongoing, Answered, Closed, Won, and Lost calls synced to Firebase with a spoken evening recap.
              </p>
            </div>
          </div>
        </section>

        {/* Small business sample strip */}
        <div className="space-y-3 pt-2">
          <span className="text-xs uppercase tracking-wider text-muted font-medium block">
            Crafted for local Indian small businesses
          </span>
          <div className="flex flex-wrap gap-2">
            {businesses.map((biz, i) => (
              <span
                key={i}
                className="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-ink/90 font-medium paper-shadow"
              >
                {biz}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-surface/60 text-xs text-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-medium text-ink">
              Vaani Recap (వాణి రీక్యాప్) · AI Cold Call Agent &amp; Sales Dashboard
            </p>
            <p className="text-[11px] text-muted">
              Built with Gnani Prisma (STT), Gnani Timbre (TTS), SQLite WAL Cache, and Firebase Realtime Database.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline font-medium text-ink">
              Log in
            </Link>
            <span>·</span>
            <Link href="/signup" className="hover:underline font-medium text-ink">
              Sign up
            </Link>
            <span>·</span>
            <Link href="/setup" className="hover:underline font-medium text-ink">
              Agent setup
            </Link>
            <span>·</span>
            <Link href="/today" className="hover:underline font-medium text-ink">
              Dashboard
            </Link>
            <span>·</span>
            <Link href="/design-check" className="hover:underline">
              Design check
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
