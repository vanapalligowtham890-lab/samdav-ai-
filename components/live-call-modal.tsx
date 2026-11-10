"use client";

import React from "react";
import {
  PhoneCall,
  Volume2,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

interface LiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  agentVoiceName?: string;
  companyName?: string;
  onCallSaved?: (callId: string) => void;
}

export function LiveCallModal({
  isOpen,
  onClose,
  companyName = "Aditya University",
}: LiveCallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden text-ink flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0d2137] to-[#1e3a8a] text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
            <GraduationCap className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-3.5 relative z-10">
            <BrandLogo isAditya={true} size="lg" className="border-gold/30 shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider bg-gold/20 text-[#fbbf24] px-2 py-0.5 rounded-full font-semibold border border-[#fbbf24]/30">
                  Academic Prototype Mode
                </span>
                <span className="text-[10px] text-white/70">· College Review Edition</span>
              </div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white mt-1">
                {companyName} · Parent Desk
              </h2>
              <p className="text-xs text-white/80">
                Evaluation Notice: Synthetic Consultation Mode
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors relative z-10"
            title="Close Notice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Notice Banner */}
          <div className="bg-paper border border-border/80 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
              <span>Real Telephony Gateways Are Simulated in this Prototype</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Outbound cellular calls require an active enterprise telecom PRI/SIP gateway (e.g. Exotel / Twilio). For this <strong>academic college review demonstration</strong>, outbound parent consultations are pre-calibrated and fully synthesized using genuine <strong>Gnani Timbre</strong> neural voice models with verified Telugu acoustics.
            </p>
          </div>

          {/* Verification Highlights */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Pre-Calibrated Evaluation Features
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-surface border border-border/70 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Volume2 className="w-3.5 h-3.5 text-secondary" />
                  <span>Gnani Timbre Dual Voices</span>
                </div>
                <p className="text-[11px] text-muted">
                  Authentic alternating voices: <strong>Shivani</strong> (Admissions Counselor) with real Telugu Fathers (<strong>Avinash</strong>, <strong>Prakash</strong>) and Mothers (<strong>Kalpana</strong>, <strong>Lavanya</strong>).
                </p>
              </div>

              <div className="bg-surface border border-border/70 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>Curriculum &amp; Campus Focus</span>
                </div>
                <p className="text-[11px] text-muted">
                  Deep dialogues covering <strong>180-acre Surampalem campus</strong>, <strong>NAAC A++</strong>, <strong>Technical Hub</strong> coding, <strong>₹33 LPA</strong> placements, and hostel security.
                </p>
              </div>

              <div className="bg-surface border border-border/70 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Instant Lead Extraction</span>
                </div>
                <p className="text-[11px] text-muted">
                  EAPCET ranks, program interests, objections, and WhatsApp follow-ups generated autonomously with zero manual entry.
                </p>
              </div>

              <div className="bg-surface border border-border/70 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Layers className="w-3.5 h-3.5 text-secondary" />
                  <span>SQLite Cache Architecture</span>
                </div>
                <p className="text-[11px] text-muted">
                  Zero re-billing: All synthesized audio WAVs and transcripts are stored locally in SQLite with SHA-256 hash validation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-paper/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/calls"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#1e3a8a]/90 transition-all shadow-xs"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Listen to Parent Calls (4 Recordings)</span>
          </Link>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link
              href="/settings"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink border border-border px-3 py-2 rounded-lg transition-colors"
            >
              <Volume2 className="w-3 h-3" />
              <span>Voice Catalog</span>
            </Link>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium bg-surface border border-border hover:bg-paper transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
