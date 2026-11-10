"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  Building2, 
  PhoneForwarded, 
  Volume2, 
  ArrowRight, 
  Play, 
  Pause,
  Lock,
  LogIn,
  Sparkles,
  Layers,
  Globe
} from "lucide-react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { ALL_VOICES, VoiceDefinition } from "@/lib/voice-catalog";
import { LANGUAGE_MODES, getLanguageMode } from "@/lib/languages";

const PREDEFINED_SECTORS = [
  { value: "Aditya University - B.Tech Admissions & Parent Desk", label: "Aditya University - B.Tech Admissions & Parent Desk" },
  { value: "Digital Marketing & Agency", label: "Digital Marketing & Agency" },
  { value: "E-Commerce & Online Stores", label: "E-Commerce & Online Stores" },
  { value: "IT Services, Software & SaaS", label: "IT Services, Software & SaaS" },
  { value: "Real Estate & Housing", label: "Real Estate & Housing" },
  { value: "Dental Clinic & Healthcare", label: "Dental Clinic & Healthcare" },
  { value: "Coaching & EdTech", label: "Coaching & EdTech" },
  { value: "Fashion, Tailoring & Boutique", label: "Fashion, Tailoring & Boutique" },
  { value: "Polyclinic & Hospitals", label: "Polyclinic & Hospitals" },
  { value: "Automobile & Two-Wheeler Showrooms", label: "Automobile & Two-Wheeler Showrooms" },
  { value: "Financial, Banking & Insurance", label: "Financial, Banking & Insurance" },
  { value: "Gym, Fitness & Spa", label: "Gym, Fitness & Spa" },
  { value: "Restaurant, Catering & Events", label: "Restaurant, Catering & Events" },
  { value: "Solar Energy & Green Tech", label: "Solar Energy & Green Tech" },
  { value: "Custom", label: "Custom Sector / Other" },
];

export default function SetupPage() {
  const router = useRouter();
  const { user, setup, updateSetup, loading: authLoading, isFirebaseConnected } = useAuth();

  const [companyName, setCompanyName] = useState(setup?.companyName || "Ishiva digital");
  const [sectorChoice, setSectorChoice] = useState(setup?.companyType || "Digital Marketing & Agency");
  const [customSector, setCustomSector] = useState("");
  const [forwardingNumber, setForwardingNumber] = useState(setup?.forwardingNumber || "+91 98765 43210");
  const [selectedVoice, setSelectedVoice] = useState(setup?.voice || "Shivani");
  const [selectedLanguage, setSelectedLanguage] = useState(setup?.language || "te-en");
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  // Filter tabs: All, Telugu, Hindi, Hinglish, English, Tamil, Marathi, Kannada, Bengali, Gujarati
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Route Guard: Require authentication before accessing setup
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/setup");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (setup) {
      if (setup.companyName) setCompanyName(setup.companyName);
      if (setup.companyType) {
        const found = PREDEFINED_SECTORS.find(s => s.value === setup.companyType);
        if (found) {
          setSectorChoice(setup.companyType);
        } else {
          setSectorChoice("Custom");
          setCustomSector(setup.companyType);
        }
      }
      if (setup.forwardingNumber) setForwardingNumber(setup.forwardingNumber);
      if (setup.voice) setSelectedVoice(setup.voice);
      if (setup.language) setSelectedLanguage(setup.language);
    }
  }, [setup]);

  const handleSelectLanguage = (langId: string) => {
    setSelectedLanguage(langId);
    const mode = getLanguageMode(langId);

    // Auto-filter voice list and select recommended voice for this language
    if (langId.startsWith("te")) setVoiceFilter("telugu");
    else if (langId.startsWith("hi-en")) setVoiceFilter("hinglish");
    else if (langId.startsWith("hi")) setVoiceFilter("hindi");
    else if (langId.startsWith("ta")) setVoiceFilter("tamil");
    else if (langId.startsWith("mr")) setVoiceFilter("marathi");
    else if (langId.startsWith("kn")) setVoiceFilter("kannada");
    else if (langId.startsWith("bn")) setVoiceFilter("bengali");
    else if (langId.startsWith("gu")) setVoiceFilter("gujarati");
    else if (langId.startsWith("en")) setVoiceFilter("english");

    if (mode.defaultVoice) {
      setSelectedVoice(mode.defaultVoice);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-lg bg-surface border border-border/80 p-1 flex items-center justify-center shadow-xs animate-pulse">
          <img src="/logo.png" alt="Samvad AI" className="w-full h-full object-contain" />
        </div>
        <p className="text-xs text-muted font-medium">Loading setup session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <Lock className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading text-xl text-ink">Authentication Required</h2>
        <p className="text-xs text-muted max-w-sm">
          Please log in first to configure your agent setup and forwarding caller ID.
        </p>
        <Link
          href="/login?redirect=/setup"
          className="inline-flex items-center gap-2 bg-accent text-surface px-5 py-2.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
        >
          <LogIn className="w-4 h-4" strokeWidth={1.5} /> Log in to continue
        </Link>
      </div>
    );
  }

  const effectiveSector = sectorChoice === "Custom" ? (customSector.trim() || "Custom Business") : sectorChoice;

  const handlePlayPreview = async (v: VoiceDefinition) => {
    if (previewingVoice === v.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setPreviewingVoice(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    setPreviewingVoice(v.id);

    // Instant zero-latency pre-rendered voice playback
    const staticUrl = `/audio/voice_${v.id.toLowerCase()}.wav`;
    const audio = new Audio(staticUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setPreviewingVoice(null);
      audioRef.current = null;
    };

    audio.onerror = async () => {
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
          const fallbackAudio = new Audio(data.audioUrl);
          audioRef.current = fallbackAudio;
          fallbackAudio.onended = () => setPreviewingVoice(null);
          await fallbackAudio.play();
        }
      } catch {
        setPreviewingVoice(null);
      }
    };

    try {
      await audio.play();
    } catch {
      setPreviewingVoice(null);
    }
  };

  const filteredVoices = ALL_VOICES.filter((v) => {
    if (voiceFilter === "telugu") return v.language === "te-IN";
    if (voiceFilter === "hindi") return v.language === "hi-IN";
    if (voiceFilter === "english") return v.language === "en-IN";
    if (voiceFilter === "hinglish") return v.language === "hi-en";
    if (voiceFilter === "tamil") return v.language === "ta-IN";
    if (voiceFilter === "marathi") return v.language === "mr-IN";
    if (voiceFilter === "kannada") return v.language === "kn-IN";
    if (voiceFilter === "bengali") return v.language === "bn-IN";
    if (voiceFilter === "gujarati") return v.language === "gu-IN";
    return true;
  });

  const activeLangMode = getLanguageMode(selectedLanguage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusText(`Customizing ${companyName} (${activeLangMode.name}) and preloading authentic AI calls with voice ${selectedVoice}...`);

    try {
      await updateSetup({
        companyName,
        companyType: effectiveSector,
        forwardingNumber,
        voice: selectedVoice,
        language: selectedLanguage,
        completed: true,
        updatedAt: new Date().toISOString(),
      });

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: companyName,
          business_type: effectiveSector,
          forwarding_number: forwardingNumber,
          voice: selectedVoice,
          language: selectedLanguage,
        }),
      });

      const data = await res.json();
      setStatusText(`Preloaded ${data.seededCount || 6} sector calls in ${activeLangMode.name}! Launching...`);

      setTimeout(() => {
        router.push("/today");
      }, 900);
    } catch (err: any) {
      console.error("Setup save error:", err);
      router.push("/today");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper py-8 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        <BlurFade delay={0.05}>
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-muted font-medium block">
              Step 2 of 2 · Agent Onboarding
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading text-ink">
              Set up your AI sales call agent
            </h1>
            <p className="text-xs text-muted max-w-md mx-auto">
              Configure your business sector, target language, verified caller ID, and authentic Gnani Timbre voice persona.
            </p>
          </div>
        </BlurFade>

        {statusText && (
          <div className="bg-secondary/10 border border-secondary/20 text-secondary text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span className="font-medium">{statusText}</span>
          </div>
        )}

        <BlurFade delay={0.1}>
          <form onSubmit={handleSubmit} className="bg-surface border border-border p-4 sm:p-8 rounded-lg paper-shadow space-y-6">
            {/* 1. Business Details */}
            <div className="space-y-4 border-b border-border/80 pb-6">
              <div className="flex items-center gap-2 text-ink font-heading text-base font-semibold">
                <Building2 className="w-4 h-4 text-accent" strokeWidth={1.5} />
                <span>1. Business Details &amp; Industry Sector</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                    Company / Brand / Clinic Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Ishiva digital"
                    className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                    Business Domain / Sector
                  </label>
                  <select
                    value={sectorChoice}
                    onChange={(e) => setSectorChoice(e.target.value)}
                    className="w-full bg-paper border border-border rounded-md px-3 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent"
                  >
                    {PREDEFINED_SECTORS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Sector Input Field if Custom chosen */}
              {sectorChoice === "Custom" && (
                <div className="space-y-1.5 bg-paper p-3.5 rounded-md border border-accent/40 animate-fade-in">
                  <label className="text-xs font-semibold text-accent block">
                    Specify Your Custom Industry / Sector:
                  </label>
                  <input
                    type="text"
                    required
                    value={customSector}
                    onChange={(e) => setCustomSector(e.target.value)}
                    placeholder="e.g. Drone Technology, Solar Rooftop, Event Photography, Fintech Loans"
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                  />
                  <p className="text-[11px] text-muted">
                    We will pre-generate tailored synthetic calls, customer inquiries, and virtual scripts for <strong>{customSector || "your sector"}</strong>.
                  </p>
                </div>
              )}

              {/* Prototype Preloaded Notice */}
              <div className="bg-paper/70 border border-border/80 rounded-md p-3 flex items-start gap-2.5 text-xs text-muted">
                <Layers className="w-4 h-4 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
                <p className="leading-relaxed">
                  <strong className="text-ink font-medium">Prototype Preload:</strong> Once you complete setup for <strong className="text-ink">{companyName}</strong> in <strong className="text-ink">{effectiveSector}</strong>, your dashboard is automatically preloaded with recorded closed calls, in-progress ongoing calls, and ready-to-dial prospects tailored to this exact business!
                </p>
              </div>
            </div>

            {/* 2. Target Language & Dialect Mode */}
            <div className="space-y-4 border-b border-border/80 pb-6">
              <div className="flex items-center gap-2 text-ink font-heading text-base font-semibold">
                <Globe className="w-4 h-4 text-accent" strokeWidth={1.5} />
                <span>2. Outbound Dialect &amp; Target Language</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Select the language used for cold calls, transcripts, objection handling, and evening spoken summaries.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LANGUAGE_MODES.map((mode) => {
                  const isSelected = selectedLanguage === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => handleSelectLanguage(mode.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5 ring-1 ring-accent paper-shadow"
                          : "border-border bg-paper/60 hover:bg-paper"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="setupLanguageRadio"
                            value={mode.id}
                            checked={isSelected}
                            onChange={() => handleSelectLanguage(mode.id)}
                            className="text-accent focus:ring-accent"
                          />
                          <span className="font-heading font-medium text-xs sm:text-sm text-ink">{mode.label}</span>
                        </div>
                        <span className="text-[10px] text-muted font-mono bg-paper px-1.5 py-0.5 rounded border border-border shrink-0">
                          {mode.timbreLanguageCode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Forwarding / Caller ID Phone Number */}
            <div className="space-y-3 border-b border-border/80 pb-6">
              <div className="flex items-center gap-2 text-ink font-heading text-base font-semibold">
                <PhoneForwarded className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                <span>3. Outbound Caller ID &amp; Call Forwarding Number</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Provide the phone number with which outbound calls will route. When the AI agent speaks to leads, this verified phone number appears on their screen.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Verified Forwarding Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={forwardingNumber}
                  onChange={(e) => setForwardingNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* 4. Voice Persona Across ALL Languages */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-ink font-heading text-base font-semibold">
                  <Volume2 className="w-4 h-4 text-accent" strokeWidth={1.5} />
                  <span>4. Voice Persona (All Indian Languages &amp; Genders)</span>
                </div>

                {/* Filter pills with horizontal scroll */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "telugu", label: "Telugu" },
                    { id: "hindi", label: "Hindi" },
                    { id: "hinglish", label: "Hinglish" },
                    { id: "english", label: "English" },
                    { id: "tamil", label: "Tamil" },
                    { id: "marathi", label: "Marathi" },
                    { id: "kannada", label: "Kannada" },
                    { id: "bengali", label: "Bengali" },
                    { id: "gujarati", label: "Gujarati" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setVoiceFilter(f.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
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

              {/* Grid of Voices with Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1 no-scrollbar">
                {filteredVoices.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  const isAudioPlaying = previewingVoice === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`border rounded-lg p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5 paper-shadow ring-1 ring-accent"
                          : "border-border bg-paper/60 hover:bg-paper"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="selectedVoice"
                              value={v.id}
                              checked={isSelected}
                              onChange={() => setSelectedVoice(v.id)}
                              className="text-accent focus:ring-accent"
                            />
                            <span className="font-heading font-medium text-sm text-ink">{v.name}</span>
                            <span className="text-[10px] text-muted bg-paper px-1.5 py-0.2 rounded border border-border">
                              {v.gender}
                            </span>
                          </div>
                          <span className="text-[11px] text-accent font-medium block pl-5">
                            {v.languageLabel} · {v.persona}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPreview(v);
                          }}
                          className="w-7 h-7 rounded-full bg-paper border border-border hover:border-accent text-accent flex items-center justify-center shrink-0 shadow-xs"
                          title={`Preview ${v.name}'s voice`}
                        >
                          {isAudioPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-muted mt-2 pl-5 line-clamp-2 leading-relaxed">
                        {v.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-muted">
                {isFirebaseConnected ? "Connected to Firebase Realtime DB" : "Syncs to Firebase Realtime Database"}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-accent text-surface py-2.5 px-6 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs"
              >
                {saving ? "Preloading sector calls..." : "Complete setup & launch dashboard"}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </form>
        </BlurFade>
      </div>
    </div>
  );
}
