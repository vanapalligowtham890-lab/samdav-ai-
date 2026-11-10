"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sparkles, 
  CalendarDays, 
  PhoneCall, 
  Settings as SettingsIcon, 
  Check, 
  Layers, 
  PhoneForwarded, 
  LogOut, 
  LogIn,
  Lock,
  Phone
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LiveCallModal } from "@/components/live-call-modal";
import { BrandLogo } from "@/components/brand-logo";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setup, logout, loading, isFirebaseConnected } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);

  // Strict route protection: If not authenticated, redirect to /login immediately
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/synthetic", { method: "POST" });
      if (res.ok) {
        setSeeded(true);
        setTimeout(() => {
          setSeeded(false);
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      console.error("Seeding failed:", err);
    } finally {
      setSeeding(false);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/today", icon: CalendarDays },
    { label: "Recordings & Transcripts", href: "/calls", icon: PhoneCall },
    { label: "Agent Setup", href: "/setup", icon: PhoneForwarded },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  // 1. Loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center space-y-3">
        <BrandLogo isAditya={false} size="lg" className="animate-pulse" />
        <p className="text-xs text-muted font-medium">Verifying user authorization...</p>
      </div>
    );
  }

  // 2. Unauthenticated state: Return redirect splash, do not render dashboard!
  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <Lock className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-xl text-ink">Authentication Required</h2>
          <p className="text-xs text-muted max-w-sm">
            Please log in with your registered account to access the sales dashboard.
          </p>
        </div>
        <Link
          href={`/login?redirect=${encodeURIComponent(pathname)}`}
          className="inline-flex items-center gap-2 bg-accent text-surface px-5 py-2.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
        >
          <LogIn className="w-4 h-4" strokeWidth={1.5} /> Proceed to Log in
        </Link>
      </div>
    );
  }

  // 3. Authenticated: Render Dashboard layout
  const isAdityaUser = user?.email?.toLowerCase().includes("vanapalligowtham9108") || setup?.companyName?.toLowerCase().includes("aditya");

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      {/* Top Navigation */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            {/* Logo & Brand */}
            <Link href="/today" className="flex items-center gap-2.5 group shrink-0">
              <BrandLogo isAditya={isAdityaUser} size="md" className="group-hover:scale-105 transition-transform" />
              <div className="flex flex-col justify-center shrink-0">
                <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-ink leading-tight whitespace-nowrap">
                  {isAdityaUser ? "Aditya University" : "Samvad AI"}
                </span>
                <span className="text-[10px] text-muted font-medium tracking-wide whitespace-nowrap">
                  {isAdityaUser ? "24/7 B.Tech Admissions Desk" : "Gnani Prisma &amp; Timbre"}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-border shrink-0">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? "bg-paper text-ink border border-border/80 shadow-xs"
                        : "text-muted hover:text-ink hover:bg-paper/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Utilities: User account info + Forwarding status + Seed */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Forwarding Number Indicator */}
            {setup?.forwardingNumber && (
              <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono bg-paper border border-border px-2.5 py-1 rounded text-muted shrink-0 whitespace-nowrap">
                <PhoneForwarded className="w-3 h-3 text-secondary shrink-0" strokeWidth={1.5} />
                <span>{setup.forwardingNumber}</span>
              </span>
            )}

            {/* User Account / Auth State */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isAdityaUser && (
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-semibold">
                  Aditya Desk
                </span>
              )}
              <span 
                className="text-xs text-ink font-medium hidden md:inline-block max-w-[140px] truncate bg-paper border border-border px-2.5 py-1 rounded shrink-0 whitespace-nowrap"
                title={user.email || ""}
              >
                {user.email}
              </span>
              <button
                onClick={() => logout()}
                title="Sign out of account"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-destructive px-2.5 py-1 rounded-md hover:bg-paper border border-border transition-colors shrink-0 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>

            <button
              onClick={() => setIsLiveCallOpen(true)}
              title="Speak live with the AI agent using your microphone"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold bg-accent text-surface hover:opacity-95 shadow-xs transition-all shrink-0 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 animate-pulse" strokeWidth={2} />
              <span>Live Call AI</span>
            </button>

            <button
              onClick={handleSeedDemo}
              disabled={seeding || seeded}
              title="Loads realistic synthetic small-business calls instantly without waiting on live API"
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 whitespace-nowrap ${
                seeded
                  ? "bg-secondary text-surface border-secondary"
                  : "bg-surface hover:bg-paper text-ink border-border hover:border-accent"
              }`}
            >
              {seeded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-surface shrink-0" strokeWidth={2} /> Demo calls ready
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                  {seeding ? "Loading..." : "Load demo"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation bar */}
        <div className="flex lg:hidden border-t border-border px-4 py-2 gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-paper text-ink font-semibold border border-border"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Samvad AI · Multilingual Sales Call Assistant · Gnani Prisma STT &amp; Timbre TTS.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/design-check" className="hover:text-ink transition-colors underline-offset-2 hover:underline">
              Design check
            </Link>
            <span className="text-border">|</span>
            <span className="text-[11px] font-mono">
              {isFirebaseConnected ? "Firebase Realtime DB Active" : "Local SQLite & Firebase Ready"}
            </span>
            <span className="text-border">|</span>
            <span className="text-[11px]">Synthetic Call Data Only</span>
          </div>
        </div>
      </footer>
      {/* Floating Live Call Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsLiveCallOpen(true)}
          className="flex items-center gap-2.5 bg-secondary text-surface px-4 py-3 rounded-full shadow-xl hover:opacity-95 hover:scale-105 active:scale-95 transition-all text-xs font-semibold group border-2 border-surface"
          title="Interactive Live Voice Calling with AI Agent"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-surface animate-ping" />
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">Live Call AI Agent</span>
        </button>
      </div>

      {/* Live Call Modal */}
      <LiveCallModal
        isOpen={isLiveCallOpen}
        onClose={() => setIsLiveCallOpen(false)}
        defaultPhone={setup?.forwardingNumber || "+91 98490 22334"}
        agentVoiceName={setup?.voice || "Shivani"}
        companyName={setup?.companyName || "Smile Dental Care"}
        onCallSaved={() => {
          // If on today or calls page, trigger reload or notification
          if (pathname === "/today" || pathname === "/calls") {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
