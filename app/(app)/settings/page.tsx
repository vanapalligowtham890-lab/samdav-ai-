"use client";

import React, { useState, useEffect } from "react";
import { 
  Volume2, 
  Store, 
  Check, 
  Save, 
  ShieldCheck, 
  Play, 
  Pause, 
  PhoneForwarded,
  Sparkles,
  Globe,
  Radio
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { ALL_VOICES, VoiceDefinition } from "@/lib/voice-catalog";
import { LANGUAGE_MODES, getLanguageMode } from "@/lib/languages";
import { useAuth } from "@/lib/auth-context";

const SECTOR_OPTIONS = [
  "Digital Marketing & Agency",
  "E-Commerce & Online Stores",
  "IT Services, Software & SaaS",
  "Real Estate & Housing",
  "Dental Clinic & Healthcare",
  "Coaching & EdTech",
  "Fashion, Tailoring & Boutique",
  "Polyclinic & Hospitals",
  "Automobile & Two-Wheeler Showrooms",
  "Financial, Banking & Insurance",
  "Gym, Fitness & Spa",
  "Restaurant, Catering & Events",
  "Solar Energy & Green Tech",
  "Custom Sector / Other",
];

export default function SettingsPage() {
  const { updateSetup } = useAuth();

  const [language, setLanguage] = useState("te-en");
  const [voice, setVoice] = useState("Shivani");
  const [forwardingNumber, setForwardingNumber] = useState("+91 99897 76543");
  const [businessType, setBusinessType] = useState("Aditya University - B.Tech Admissions & Parent Desk");
  const [customSector, setCustomSector] = useState("");
  const [companyName, setCompanyName] = useState("Aditya University");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Audio preview state
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState("all");
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.settings) {
          if (data.settings.language) setLanguage(data.settings.language);
          if (data.settings.voice) setVoice(data.settings.voice);
          if (data.settings.business_name) setCompanyName(data.settings.business_name);
          if (data.settings.forwarding_number) setForwardingNumber(data.settings.forwarding_number);

          if (data.settings.business_type) {
            const bt = data.settings.business_type;
            const matched = SECTOR_OPTIONS.find(
              (s) => s.toLowerCase() === bt.toLowerCase() || bt.toLowerCase().includes(s.toLowerCase())
            );
            if (matched) {
              setBusinessType(matched);
            } else {
              setBusinessType("Custom Sector / Other");
              setCustomSector(bt);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    fetchSettings();
  }, []);

  const handleSelectLanguage = (langId: string) => {
    setLanguage(langId);
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
      setVoice(mode.defaultVoice);
    }
  };

  const handlePlayPreview = async (v: VoiceDefinition) => {
    if (previewingVoice === v.id) {
      if (audioRef.current) audioRef.current.pause();
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(v.id);
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
        audio.onended = () => setPreviewingVoice(null);
        audio.play().catch(() => setPreviewingVoice(null));
      }
    } catch {
      setPreviewingVoice(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSector = businessType === "Custom Sector / Other" 
      ? (customSector.trim() || "Custom Business") 
      : businessType;

    const currentMode = getLanguageMode(language);

    try {
      setSaving(true);
      setStatusMessage(`Regenerating AI outbound sales script & fresh leads for ${companyName} in ${currentMode.name} using Gemini 2.5 Flash...`);

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          voice,
          forwarding_number: forwardingNumber,
          business_type: effectiveSector,
          business_name: companyName,
        }),
      });

      const data = await res.json();

      // Update global Auth Context so the rest of the application updates immediately
      await updateSetup({
        companyName,
        companyType: effectiveSector,
        forwardingNumber,
        voice,
        language,
        completed: true,
        updatedAt: new Date().toISOString(),
      });

      setSavedSuccess(true);
      setStatusMessage(`Fresh leads & script regenerated for ${companyName} (${currentMode.name}) using voice ${voice}! Total ${data.seededCount || 6} leads ready.`);
      setTimeout(() => {
        setSavedSuccess(false);
        setStatusMessage(null);
      }, 4500);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setStatusMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const filteredVoices = ALL_VOICES.filter((v) => {
    if (voiceFilter === "telugu") return v.language === "te-IN";
    if (voiceFilter === "hindi") return v.language === "hi-IN";
    if (voiceFilter === "hinglish") return v.language === "hi-en";
    if (voiceFilter === "english") return v.language === "en-IN";
    if (voiceFilter === "tamil") return v.language === "ta-IN";
    if (voiceFilter === "marathi") return v.language === "mr-IN";
    if (voiceFilter === "kannada") return v.language === "kn-IN";
    if (voiceFilter === "bengali") return v.language === "bn-IN";
    if (voiceFilter === "gujarati") return v.language === "gu-IN";
    return true;
  });

  const activeLangMode = getLanguageMode(language);
  const activeVoiceDef = ALL_VOICES.find(v => v.id === voice) || ALL_VOICES[0];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <BlurFade delay={0.05}>
        <div className="border-b border-border pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted font-medium block mb-1">
              Configuration &amp; Multilingual AI Engine
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading text-ink">Settings &amp; Voice Library</h1>
            <p className="text-xs text-muted mt-1">
              Configure your business sector, phone caller ID, target language mode, and selected Timbre voice persona.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-surface px-5 py-2.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-xs shrink-0"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-surface" strokeWidth={2} /> Saved &amp; Preloaded
              </>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={1.5} /> {saving ? "Saving & Generating..." : "Save changes"}
              </>
            )}
          </button>
        </div>
      </BlurFade>

      {/* Dynamic Status / Progress Banner */}
      {statusMessage && (
        <div className="bg-secondary/10 border border-secondary/20 text-secondary text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Outbound Forwarding Phone Number */}
        <BlurFade delay={0.1}>
          <section className="bg-surface border border-border rounded-lg p-4 sm:p-6 paper-shadow space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-paper border border-border flex items-center justify-center text-secondary shrink-0">
                <PhoneForwarded className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-heading text-base sm:text-lg text-ink">Forwarding Phone Number (Caller ID)</h2>
                <p className="text-xs text-muted">
                  The verified phone number through which outbound cold calls and forwarding route.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                Forwarding Number
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
          </section>
        </BlurFade>

        {/* 1. Language & Dialect Selection (All 10 Indian Languages) */}
        <BlurFade delay={0.12}>
          <section className="bg-surface border border-border rounded-lg p-4 sm:p-6 paper-shadow space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-paper border border-border flex items-center justify-center text-accent shrink-0">
                <Globe className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-heading text-base sm:text-lg text-ink">Target Language &amp; Dialect Mode</h2>
                <p className="text-xs text-muted">
                  Choose the dialect for outbound sales calls, AI scripts, recordings, and evening spoken recaps.
                </p>
              </div>
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {LANGUAGE_MODES.map((mode) => {
                const isSelected = language === mode.id;
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
                          name="languageRadio"
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
                    <p className="text-[11px] text-muted mt-1.5 pl-5 line-clamp-1 italic">
                      Sample: {mode.samplePhrase.replace(/\{name\}/g, "Prospect").replace(/\{company\}/g, companyName)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Active Language Banner */}
            <div className="bg-paper p-3 rounded-md border border-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted">Active Dialect:</span>
                <strong className="text-ink font-semibold">{activeLangMode.name}</strong>
              </div>
              <span className="text-[11px] text-muted">
                Recommended voice: <strong className="text-accent">{activeLangMode.defaultVoice}</strong>
              </span>
            </div>
          </section>
        </BlurFade>

        {/* 2. Timbre TTS Voice Selection Across ALL Languages */}
        <BlurFade delay={0.15}>
          <section className="bg-surface border border-border rounded-lg p-4 sm:p-6 paper-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-paper border border-border flex items-center justify-center text-accent shrink-0">
                  <Volume2 className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-heading text-base sm:text-lg text-ink">Active Voice (Gnani Timbre)</h2>
                  <p className="text-xs text-muted">
                    Only your selected voice will speak all outgoing calls, recorded leads, and spoken briefs.
                  </p>
                </div>
              </div>

              {/* Language filter pills with horizontal touch scroll */}
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

            {/* Selected Voice Banner */}
            <div className="bg-paper p-3 rounded-md border border-accent/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Selected Agent Voice:</span>
                <strong className="text-ink font-semibold">{voice}</strong>
                <span className="text-[10px] bg-accent/10 text-accent font-mono px-2 py-0.5 rounded">
                  {activeVoiceDef.languageLabel} · {activeVoiceDef.gender}
                </span>
              </div>
              <span className="text-[11px] text-muted hidden sm:inline">
                {activeVoiceDef.persona}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1 no-scrollbar">
              {filteredVoices.map((v) => {
                const isSelected = voice === v.id;
                const isPlaying = previewingVoice === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => setVoice(v.id)}
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
                            name="voiceRadio"
                            value={v.id}
                            checked={isSelected}
                            onChange={() => setVoice(v.id)}
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
                        className="w-8 h-8 rounded-full bg-paper border border-border hover:border-accent text-accent flex items-center justify-center shrink-0 shadow-xs"
                        title={`Listen to ${v.name}`}
                      >
                        {isPlaying ? (
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
          </section>
        </BlurFade>

        {/* 3. Business Domain & Identity */}
        <BlurFade delay={0.2}>
          <section className="bg-surface border border-border rounded-lg p-4 sm:p-6 paper-shadow space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-paper border border-border flex items-center justify-center text-accent shrink-0">
                <Store className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-heading text-base sm:text-lg text-ink">Business Identity &amp; Sector</h2>
                <p className="text-xs text-muted">
                  Used by the agent when introducing your business. Changing this regenerates tailored leads!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Company / Clinic / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Business Domain / Sector
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                >
                  {SECTOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Sector Input */}
            {businessType === "Custom Sector / Other" && (
              <div className="space-y-1.5 bg-paper p-3.5 rounded-md border border-accent/40 animate-fade-in">
                <label className="text-xs font-semibold text-accent block">
                  Specify Your Custom Sector:
                </label>
                <input
                  type="text"
                  required
                  value={customSector}
                  onChange={(e) => setCustomSector(e.target.value)}
                  placeholder="e.g. Drone Technology, Solar Rooftop, Fintech Lending"
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
                <p className="text-[11px] text-muted">
                  Gemini LLM will dynamically generate an outbound sales script and fresh leads for <strong>{customSector || "your sector"}</strong> in <strong>{activeLangMode.name}</strong>.
                </p>
              </div>
            )}
          </section>
        </BlurFade>

        {/* Challenge Rules Compliance & Firebase status */}
        <BlurFade delay={0.25}>
          <div className="bg-paper border border-border rounded-lg p-4 sm:p-5 space-y-2 text-xs text-muted">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0" strokeWidth={1.5} />
              Connected Infrastructure:
            </div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Firebase Realtime DB: <code className="font-mono text-[11px] break-all">gnani-e666b-default-rtdb.europe-west1.firebasedatabase.app</code></li>
              <li>Gnani Speech APIs: Prisma v3.0 (STT) + Timbre v3.0 (TTS) with 10 confirmed Indian language codes.</li>
              <li>Outbound Caller Forwarding: Guaranteed routing through verified phone number.</li>
            </ul>
          </div>
        </BlurFade>
      </form>
    </div>
  );
}
