"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Copy, 
  Check, 
  AlertCircle, 
  Volume2, 
  Play, 
  Pause, 
  MessageSquare, 
  Calendar, 
  FileText 
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [need, setNeed] = useState("");
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [nextStep, setNextStep] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [keyQuote, setKeyQuote] = useState("");
  const [followUpMessage, setFollowUpMessage] = useState("");

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) throw new Error("Lead not found");
        const data = await res.json();
        if (data.lead) {
          const l = data.lead;
          setLead(l);
          setCustomerName(l.customer_name || "");
          setNeed(l.need || "");
          setBudget(l.budget || "");
          setUrgency(l.urgency || "medium");
          setNextStep(l.next_step || "");
          setFollowUpDate(l.follow_up_date || "");
          setKeyQuote(l.key_quote || "");
          setFollowUpMessage(l.follow_up_message || "");
        }
      } catch (err) {
        console.error("Failed to fetch lead:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          need,
          budget,
          urgency,
          next_step: nextStep,
          follow_up_date: followUpDate,
          key_quote: keyQuote,
          follow_up_message: followUpMessage,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to save lead:", err);
    } finally {
      setSaving(false);
    }
  };

  const copyDraft = () => {
    if (!followUpMessage) return;
    navigator.clipboard.writeText(followUpMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlayAudio = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);

    let audioUrl = lead?.audio_url;
    if (!audioUrl && lead?.filename && !lead.filename.startsWith("demo_call")) {
      audioUrl = `/audio/${lead.filename}`;
    }

    if (!audioUrl || audioUrl.includes("demo_call")) {
      // Trigger on-demand synthesis
      try {
        const res = await fetch("/api/call-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospectId: lead?.call_id || lead?.id,
            transcript: lead?.transcript,
            customerName: lead?.customer_name,
            need: lead?.need,
          }),
        });
        const data = await res.json();
        if (data.audioUrl) {
          audioUrl = data.audioUrl;
          if (lead) lead.audio_url = data.audioUrl;
        }
      } catch (err) {
        console.warn("Lead audio synthesis failed:", err);
      }
    }

    const rawUrl = audioUrl || `/api/call-audio?prospectId=${encodeURIComponent(lead?.call_id || lead?.id || "")}`;
    const targetUrl = `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

    const audio = new Audio(targetUrl);
    audioRef.current = audio;
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    audio.onerror = () => {
      console.warn("Audio playback error for lead");
      setIsPlaying(false);
      audioRef.current = null;
    };

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn("Audio play prevented or interrupted:", e);
      setIsPlaying(false);
      audioRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Loading lead details...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center space-y-4">
        <p className="text-base font-heading text-ink">Lead not found</p>
        <Link href="/today" className="text-xs text-accent hover:underline">
          Return to today&apos;s overview
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <BlurFade delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/today"
              className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center text-muted hover:text-ink hover:border-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted font-medium block">
                Lead Detail &amp; Follow-up
              </span>
              <h1 className="text-2xl font-heading text-ink">
                {customerName || "Customer Lead"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-accent text-surface px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-surface" strokeWidth={2} /> Changes saved
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} /> {saving ? "Saving..." : "Save lead card"}
                </>
              )}
            </button>
          </div>
        </div>
      </BlurFade>

      {/* Main Grid: Left Editable Form (8 cols) + Right Context (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <form onSubmit={handleSave} className="lg:col-span-8 space-y-6">
          <section className="bg-surface border border-border rounded-lg p-6 paper-shadow space-y-5">
            <h2 className="font-heading text-lg text-ink border-b border-border/80 pb-2">
              Editable Lead Card
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Customer name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              {/* Budget */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Budget or Quote Range
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. ₹25,000 or Below ₹50k"
                  className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>

            {/* Need */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                Customer Need
              </label>
              <textarea
                rows={2}
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>

            {/* Urgency & Follow-up Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Urgency level
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                >
                  <option value="high">High priority (Call today)</option>
                  <option value="medium">Medium priority (2-3 days)</option>
                  <option value="low">Low priority (Future follow-up)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Scheduled Follow-up Date
                </label>
                <input
                  type="text"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  placeholder="e.g. Tomorrow 11 AM"
                  className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Agreed Next Step */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                Agreed Next Step
              </label>
              <input
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>

            {/* Exact Key Quote */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                Key quote (Exact verbatim words from call)
              </label>
              <textarea
                rows={2}
                value={keyQuote}
                onChange={(e) => setKeyQuote(e.target.value)}
                className="w-full bg-paper border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent telugu-quote leading-[1.75]"
              />
            </div>
          </section>

          {/* Follow-up WhatsApp Message Section */}
          <section className="bg-surface border border-border rounded-lg p-6 paper-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg text-ink">
                  Follow-up WhatsApp Message Draft
                </h3>
                <p className="text-xs text-muted">
                  Drafted in Telugu / Hinglish for WhatsApp delivery to the customer.
                </p>
              </div>

              <button
                type="button"
                onClick={copyDraft}
                className="inline-flex items-center gap-1.5 text-xs bg-paper border border-border hover:border-accent px-3 py-1.5 rounded-md text-ink transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-secondary" strokeWidth={2} /> Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} /> Copy message
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={followUpMessage}
              onChange={(e) => setFollowUpMessage(e.target.value)}
              className="w-full bg-paper border border-border rounded-md p-3 text-sm text-ink focus:outline-none focus:border-accent telugu-text leading-[1.8]"
            />
          </section>
        </form>

        {/* Right Context: Call recording & Full Transcript */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Audio Player Card */}
          <div className="bg-surface border border-border rounded-lg p-5 paper-shadow space-y-4">
            <h3 className="font-heading text-base text-ink">Source call recording</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayAudio}
                className="w-10 h-10 rounded-full bg-accent text-surface flex items-center justify-center hover:opacity-90 shrink-0 transition-transform active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" strokeWidth={1.5} />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" strokeWidth={1.5} />
                )}
              </button>
              <div>
                <p className="text-xs font-medium text-ink">
                  {lead.original_name || "Call Recording"}
                </p>
                <p className="text-[11px] text-muted">
                  {lead.duration_seconds ? `${Math.round(lead.duration_seconds)}s duration` : "Telugu call"}
                </p>
              </div>
            </div>
          </div>

          {/* Full Transcript */}
          <div className="bg-surface border border-border rounded-lg p-5 paper-shadow space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-muted font-medium block">
              Gnani Prisma Full Transcript
            </span>
            <div className="max-h-80 overflow-y-auto bg-paper p-3 rounded-md border border-border text-xs text-ink telugu-text leading-[1.8] whitespace-pre-line">
              {lead.transcript || "No transcript available for this call."}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

