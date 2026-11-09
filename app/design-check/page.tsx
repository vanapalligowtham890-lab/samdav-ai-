import React from "react";
import Link from "next/link";
import { 
  Copy, 
  ArrowRight, 
  Volume2, 
  AlertCircle 
} from "lucide-react";

export default function DesignCheckPage() {
  return (
    <div className="min-h-screen bg-paper text-ink p-6 md:p-12 max-w-6xl mx-auto space-y-12">
      {/* Top Banner / Human Sentence-Case Header */}
      <header className="border-b border-border pb-6 flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-muted font-medium">Design System Verification</span>
          <h1 className="text-3xl md:text-4xl font-heading text-ink mt-1">Samvad AI design check</h1>
          <p className="text-muted mt-2 text-base max-w-xl">
            Human, tactile, small-studio aesthetic. No gradients, no glassmorphism, one terracotta accent, and first-class Telugu typography.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/today"
            className="inline-flex items-center gap-2 bg-accent text-surface px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Go to Today&apos;s view <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      {/* 1. Color Tokens Palette */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading text-ink">1. Colour tokens</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          <div className="bg-[#F6F1E7] border border-border p-4 rounded-lg flex flex-col justify-between h-28">
            <span className="text-xs font-semibold">Paper</span>
            <span className="text-xs text-muted font-mono">#F6F1E7</span>
          </div>
          <div className="bg-[#FFFBF3] border border-border p-4 rounded-lg flex flex-col justify-between h-28 paper-shadow">
            <span className="text-xs font-semibold">Surface</span>
            <span className="text-xs text-muted font-mono">#FFFBF3</span>
          </div>
          <div className="bg-[#1F1B16] text-[#FFFBF3] p-4 rounded-lg flex flex-col justify-between h-28">
            <span className="text-xs font-semibold">Ink</span>
            <span className="text-xs opacity-80 font-mono">#1F1B16</span>
          </div>
          <div className="bg-[#7A6F60] text-[#FFFBF3] p-4 rounded-lg flex flex-col justify-between h-28">
            <span className="text-xs font-semibold">Muted</span>
            <span className="text-xs opacity-80 font-mono">#7A6F60</span>
          </div>
          <div className="bg-[#C4522A] text-white p-4 rounded-lg flex flex-col justify-between h-28">
            <span className="text-xs font-semibold">Accent (Terracotta)</span>
            <span className="text-xs opacity-80 font-mono">#C4522A</span>
          </div>
          <div className="bg-[#2F5D50] text-white p-4 rounded-lg flex flex-col justify-between h-28">
            <span className="text-xs font-semibold">Secondary (Green)</span>
            <span className="text-xs opacity-80 font-mono">#2F5D50</span>
          </div>
          <div className="bg-[#E2D9C8] border border-[#1F1B16]/10 p-4 rounded-lg flex flex-col justify-between h-28">
            <span className="text-xs font-semibold">Border</span>
            <span className="text-xs text-muted font-mono">#E2D9C8</span>
          </div>
        </div>
      </section>

      {/* 2. Typography & Fonts Scale */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading text-ink">2. Typography scale</h2>
        <div className="bg-surface border border-border rounded-lg p-6 space-y-6 paper-shadow">
          <div>
            <span className="text-xs text-muted font-mono block mb-1">Fraunces · Heading 1</span>
            <p className="text-3xl font-heading">Three calls today. Ramesh wants a quote by Friday.</p>
          </div>
          <div>
            <span className="text-xs text-muted font-mono block mb-1">Fraunces · Heading 2</span>
            <p className="text-2xl font-heading">Evening audio recap from Gnani Timbre</p>
          </div>
          <div>
            <span className="text-xs text-muted font-mono block mb-1">DM Sans · Body Text</span>
            <p className="text-sm text-ink max-w-2xl leading-relaxed">
              Prisma converts phone speech to raw text in real time. The lead card extracts budget, timeline, and customer hesitation without making assumptions.
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <span className="text-xs text-muted font-mono block mb-2">Noto Sans Telugu & Noto Serif Telugu (Line height 1.75)</span>
            <p className="text-base font-telugu text-ink leading-[1.8] max-w-2xl">
              ఈరోజు మొత్తం 3 లీడ్స్ వచ్చాయి. రమేష్ గారు రేపు ఉదయం 11:00 గంటలకు అపాయింట్‌మెంట్ అడిగారు. వారి బడ్జెట్ రూ. 5,000.
            </p>
            <blockquote className="mt-3 border-l-2 border-accent pl-4 font-telugu-serif text-lg text-ink/90 italic leading-[1.85]">
              &ldquo;నా దవడ నొప్పి భరించలేకపోతున్నాను, రేపు 11 గంటలకు తప్పకుండా అపాయింట్‌మెంట్ బుక్ చేయండి.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* 3. Button Styles */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading text-ink">3. Buttons & Controls</h2>
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-wrap items-center gap-4 paper-shadow">
          <button className="bg-accent text-surface px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Terracotta primary
          </button>
          <button className="bg-secondary text-surface px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Deep green secondary
          </button>
          <button className="border border-border bg-surface text-ink px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-paper transition-colors">
            Hairline outline
          </button>
          <button className="text-muted hover:text-ink px-3 py-2 text-sm font-medium transition-colors">
            Ghost text
          </button>
          <button className="inline-flex items-center gap-2 bg-paper border border-border px-3.5 py-2 rounded-lg text-xs font-medium text-ink hover:border-accent transition-colors">
            <Copy className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} /> Copy WhatsApp draft
          </button>
        </div>
      </section>

      {/* 4. Asymmetric Layout: Lead Card (Wide Left) + Quick Stats (Narrow Right) */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading text-ink">4. Asymmetric card layout & sample lead card</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Wide Left Column: Sample Lead Card */}
          <div className="lg:col-span-8 bg-surface border border-border rounded-lg p-6 paper-shadow space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-heading text-xl text-ink">రమేష్ (Ramesh)</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    <AlertCircle className="w-3 h-3" strokeWidth={1.5} /> High urgency
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">స్మైల్ డెంటల్ కేర్ (Smile Dental Care) · 38s call</p>
              </div>
              <span className="text-xs font-mono text-muted bg-paper px-2.5 py-1 rounded border border-border">
                ₹3,500 - ₹5,000
              </span>
            </div>

            {/* Need & Next Step */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">Core Need</span>
                <p className="text-ink font-medium">రూట్ కెనాల్ ట్రీట్మెంట్ & పంటి నొప్పి చికిత్స</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">Next Step</span>
                <p className="text-ink font-medium">రేపు ఉదయం 11:00 కి డాక్టర్ అపాయింట్‌మెంట్ కన్ఫర్మ్ చేయాలి</p>
              </div>
            </div>

            {/* Key Quote (Telugu Serif) */}
            <div className="bg-paper/70 border border-border rounded-lg p-4 space-y-1.5">
              <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} /> Exact customer words (key quote)
              </span>
              <p className="telugu-quote text-base text-ink italic">
                &ldquo;నా దవడ నొప్పి భరించలేకపోతున్నాను, రేపు 11 గంటలకు appointment బుక్ చేయండి.&rdquo;
              </p>
            </div>

            {/* Follow-up WhatsApp Draft with Copy Button */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">
                  Follow-up WhatsApp Message
                </span>
                <button className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.5} /> Copy message
                </button>
              </div>
              <p className="text-xs bg-paper p-3 rounded-lg border border-border text-ink telugu-text leading-[1.75]">
                నమస్తే రమేష్ గారు, స్మైల్ డెంటల్ కేర్ లో రేపు ఉదయం 11:00 కి మీ అపాయింట్‌మెంట్ కన్ఫర్మ్ అయింది. క్లినిక్ లొకేషన్ ఇక్కడ ఉంది.
              </p>
            </div>
          </div>

          {/* Narrow Right Column: Daily Stats & Quick Actions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-surface border border-border rounded-lg p-5 paper-shadow space-y-4">
              <h4 className="font-heading text-lg text-ink">Today at a glance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-border/70">
                  <span className="text-sm text-muted">Total sales calls</span>
                  <span className="font-heading text-xl text-ink font-semibold">6</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/70">
                  <span className="text-sm text-muted">High priority callbacks</span>
                  <span className="font-heading text-xl text-accent font-semibold">4</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted">Recap voice status</span>
                  <span className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-medium">
                    Gnani Timbre Ready
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-paper border border-border rounded-lg p-4 space-y-2 text-xs text-muted">
              <span className="font-semibold text-ink block">Anti-Generic Design Verification:</span>
              <ul className="space-y-1 list-disc list-inside">
                <li>No purple/blue gradients or glass blobs</li>
                <li>One terracotta accent (#C4522A)</li>
                <li>8px border radius throughout</li>
                <li>DM Sans + Fraunces + Noto Telugu typography</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
