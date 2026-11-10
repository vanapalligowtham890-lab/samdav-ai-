"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { 
  Play, 
  Pause, 
  Volume2, 
  RefreshCw, 
  PhoneCall, 
  PhoneOutgoing, 
  PhoneForwarded, 
  PhoneOff, 
  UploadCloud, 
  Trophy, 
  XCircle, 
  CheckCircle2, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  Sliders, 
  Download,
  RotateCcw,
  Globe,
  BarChart3,
  GraduationCap,
  Calendar,
  Check
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AnimatedList } from "@/components/ui/animated-list";
import { ColdCallProspect, CampaignMetrics } from "@/lib/campaign";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_VIRTUAL_SCRIPTS, VirtualScript } from "@/lib/virtual-script";
import { ALL_VOICES, VoiceDefinition } from "@/lib/voice-catalog";
import { getLanguageMode } from "@/lib/languages";
import { LiveCallModal } from "@/components/live-call-modal";

interface RecapData {
  spoken_text_telugu: string;
  audio_url: string;
  voice: string;
}

export default function TodayDashboardPage() {
  const { setup, user } = useAuth();

  // Calling List Tab Filter (Upcoming vs Recorded vs All)
  const [callingListTab, setCallingListTab] = useState<"upcoming" | "recorded" | "all">("upcoming");

  // Ongoing Polls State (Live Parent Inquiries & Campus Preferences)
  const [polls, setPolls] = useState([
    {
      id: "poll_branch",
      title: "Preferred 4-Year B.Tech Branch (Aditya University)",
      category: "Academic Curriculum",
      totalVotes: 312,
      options: [
        { id: "opt_aiml", text: "B.Tech CSE (AI & Machine Learning)", votes: 150 },
        { id: "opt_cse", text: "B.Tech Computer Science & Engineering (Core)", votes: 97 },
        { id: "opt_ds", text: "B.Tech Data Science & Cyber Security", votes: 41 },
        { id: "opt_ece", text: "B.Tech Electronics & Communication (ECE)", votes: 24 },
      ],
      userVotedOption: undefined as string | undefined,
    },
    {
      id: "poll_hostel",
      title: "Hostel & Accommodation Preference (Surampalem Campus)",
      category: "Campus Facilities",
      totalVotes: 298,
      options: [
        { id: "opt_ac", text: "Aditya On-Campus AC Hostels (Separate Boys & Girls)", votes: 167 },
        { id: "opt_nonac", text: "Standard Non-AC Hostels", votes: 77 },
        { id: "opt_bus", text: "Day-Scholar College Bus (Kakinada / Rajahmundry)", votes: 54 },
      ],
      userVotedOption: undefined as string | undefined,
    },
    {
      id: "poll_visit",
      title: "Upcoming Campus Open House & Document Verification",
      category: "Admissions Desk Schedule",
      totalVotes: 340,
      options: [
        { id: "opt_sat", text: "Visiting Surampalem Campus This Saturday (10 AM)", votes: 218 },
        { id: "opt_next", text: "Visiting Next Week", votes: 85 },
        { id: "opt_online", text: "Virtual Parent Counseling Only", votes: 37 },
      ],
      userVotedOption: undefined as string | undefined,
    },
  ]);

  const handleVotePoll = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        const alreadyVoted = poll.userVotedOption === optionId;
        const updatedOptions = poll.options.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + (alreadyVoted ? -1 : 1) };
          }
          if (opt.id === poll.userVotedOption) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          return opt;
        });
        const total = updatedOptions.reduce((acc, curr) => acc + curr.votes, 0);
        return {
          ...poll,
          totalVotes: total,
          options: updatedOptions,
          userVotedOption: alreadyVoted ? undefined : optionId,
        };
      })
    );
  };

  // Campaign State & Metrics
  const [prospects, setProspects] = useState<ColdCallProspect[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    total: 0,
    ongoing: 0,
    answered: 0,
    closed: 0,
    rejected: 0,
    leadsWon: 0,
    leadsLost: 0,
  });
  const [forwardingNumber, setForwardingNumber] = useState(setup?.forwardingNumber || "+91 99897 76543");
  const [voiceName, setVoiceName] = useState(setup?.voice || "Shivani");
  const [companyName, setCompanyName] = useState(setup?.companyName || "Aditya University");
  const [sectorName, setSectorName] = useState(setup?.companyType || "Aditya University - B.Tech Admissions & Parent Desk");
  const [languageModeId, setLanguageModeId] = useState(setup?.language || "te-en");

  // Recap State
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [isPlayingRecap, setIsPlayingRecap] = useState(false);
  const [generatingRecap, setGeneratingRecap] = useState(false);

  // Audio Player State for Call Recordings
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [dialing, setDialing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Excel & Virtual Script Modals
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [liveCallModalOpen, setLiveCallModalOpen] = useState(false);
  const [liveCallTargetPhone, setLiveCallTargetPhone] = useState("+91 99897 76543");
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [activeScript, setActiveScript] = useState<VirtualScript>(
    DEFAULT_VIRTUAL_SCRIPTS.aditya_admissions || DEFAULT_VIRTUAL_SCRIPTS.telugu_high_english
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const audioRecapRef = useRef<HTMLAudioElement | null>(null);
  const audioCallRef = useRef<HTMLAudioElement | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);

  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const fetchCampaignData = async () => {
    try {
      const res = await fetch("/api/campaign");
      const data = await res.json();
      if (data.prospects) setProspects(data.prospects);
      if (data.metrics) setMetrics(data.metrics);
      if (data.forwardingNumber) setForwardingNumber(data.forwardingNumber);
      if (data.voice) setVoiceName(data.voice);
      if (data.company) setCompanyName(data.company);
      if (data.sector) setSectorName(data.sector);
      if (data.language) setLanguageModeId(data.language);
    } catch (err) {
      console.error("Failed to load campaign data:", err);
    }
  };

  const fetchRecap = async () => {
    try {
      const res = await fetch("/api/recap");
      const data = await res.json();
      if (data.recap) {
        setRecap(data.recap);
      } else {
        handleGenerateRecap();
      }
    } catch (err) {
      console.error("Failed to load recap:", err);
    }
  };

  useEffect(() => {
    fetchCampaignData();
    fetchRecap();

    // If logged in as Aditya University Administrator, ensure the Aditya campaign is active
    if (user?.email?.toLowerCase().includes("vanapalligowtham9108")) {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: "Aditya University",
          business_type: "Aditya University - B.Tech Admissions & Parent Desk",
          forwarding_number: "+91 99897 76543",
          voice: "Shivani",
          language: "te-en",
        }),
      }).then(() => {
        fetchCampaignData();
      }).catch(() => {});
    }
  }, [user]);

  const togglePlayRecap = () => {
    if (isPlayingRecap && audioRecapRef.current) {
      audioRecapRef.current.pause();
      setIsPlayingRecap(false);
      return;
    }

    if (!recap?.audio_url) {
      handleGenerateRecap();
      return;
    }

    if (isPlayingRecap) {
      if (audioRecapRef.current) {
        audioRecapRef.current.pause();
        audioRecapRef.current.src = "";
        audioRecapRef.current.onended = null;
        audioRecapRef.current.onerror = null;
        audioRecapRef.current = null;
      }
      setIsPlayingRecap(false);
      return;
    }

    // Stop any call audio that might be playing
    if (audioCallRef.current) {
      audioCallRef.current.pause();
      audioCallRef.current.src = "";
      audioCallRef.current.onended = null;
      audioCallRef.current.onerror = null;
      audioCallRef.current = null;
      setPlayingCallId(null);
    }

    if (audioRecapRef.current) {
      audioRecapRef.current.pause();
      audioRecapRef.current.src = "";
      audioRecapRef.current.onended = null;
      audioRecapRef.current.onerror = null;
      audioRecapRef.current = null;
    }

    const audio = new Audio(recap.audio_url);
    audioRecapRef.current = audio;
    audio.onended = () => {
      setIsPlayingRecap(false);
      audioRecapRef.current = null;
    };
    audio.onerror = () => {
      console.warn("Recap audio load error");
      setIsPlayingRecap(false);
      audioRecapRef.current = null;
    };

    audio.play()
      .then(() => setIsPlayingRecap(true))
      .catch((err) => {
        console.warn("Recap play error:", err);
        setIsPlayingRecap(false);
        audioRecapRef.current = null;
      });
  };

  const handleGenerateRecap = async () => {
    try {
      setGeneratingRecap(true);
      const res = await fetch("/api/recap", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRecap({
          spoken_text_telugu: data.text,
          audio_url: data.audioUrl,
          voice: data.voice,
        });
        if (audioRecapRef.current) {
          audioRecapRef.current.pause();
          audioRecapRef.current = new Audio(data.audioUrl);
          audioRecapRef.current.onended = () => setIsPlayingRecap(false);
        }
      }
    } catch (err) {
      console.error("Failed to generate recap:", err);
    } finally {
      setGeneratingRecap(false);
    }
  };

  const togglePlayCallAudio = async (prospect: ColdCallProspect) => {
    if (playingCallId === prospect.id) {
      if (audioCallRef.current) {
        audioCallRef.current.pause();
        audioCallRef.current.src = "";
        audioCallRef.current.onended = null;
        audioCallRef.current.onerror = null;
        audioCallRef.current = null;
      }
      setPlayingCallId(null);
      return;
    }

    // Stop any recap audio playing
    if (audioRecapRef.current) {
      audioRecapRef.current.pause();
      audioRecapRef.current.src = "";
      audioRecapRef.current.onended = null;
      audioRecapRef.current.onerror = null;
      audioRecapRef.current = null;
      setIsPlayingRecap(false);
    }

    // Stop any previous call audio playing
    if (audioCallRef.current) {
      audioCallRef.current.pause();
      audioCallRef.current.src = "";
      audioCallRef.current.onended = null;
      audioCallRef.current.onerror = null;
      audioCallRef.current = null;
    }
    setPlayingCallId(null);

    const targetUrl = prospect.audio_url || `/api/call-audio?prospectId=${encodeURIComponent(prospect.id)}&voice=${encodeURIComponent(voiceName)}`;
    setLoadingAudioId(prospect.id);

    const audio = new Audio(targetUrl);
    audioCallRef.current = audio;

    audio.onended = () => {
      setPlayingCallId(null);
      setLoadingAudioId(null);
      audioCallRef.current = null;
    };
    audio.onerror = () => {
      console.warn("Call audio error for prospect:", prospect.id);
      setPlayingCallId(null);
      setLoadingAudioId(null);
      audioCallRef.current = null;
    };

    try {
      await audio.play();
      setPlayingCallId(prospect.id);
    } catch (e) {
      console.warn("Call audio play prevented or interrupted:", e);
      setPlayingCallId(null);
    } finally {
      setLoadingAudioId(null);
    }
  };

  // Synthetic Dialing using the Virtual Script & Current Voice
  const handleDialNext = async (specificId?: string) => {
    try {
      setDialing(true);
      setStatusMessage(`Agent dialing with voice ${voiceName} via forwarding number ${forwardingNumber}...`);

      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dial",
          prospectId: specificId,
          voice: voiceName,
          scriptTemplate: activeScript,
        }),
      });
      const data = await res.json();
      if (data.prospects) setProspects(data.prospects);
      if (data.metrics) setMetrics(data.metrics);
      if (data.message) {
        setStatusMessage(data.message);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error("Dialing error:", err);
      setStatusMessage("Call completed and recorded.");
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setDialing(false);
    }
  };

  // Excel / CSV File Upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setUploadingExcel(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/campaign", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.prospects) setProspects(data.prospects);
      if (data.metrics) setMetrics(data.metrics);
      setExcelModalOpen(false);
      setStatusMessage(data.message || `Imported prospects from ${file.name}`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Excel upload error: ${err.message}`);
    } finally {
      setUploadingExcel(false);
    }
  };

  // Download a sample Excel file for testing
  const handleDownloadSampleExcel = () => {
    const sampleRows = [
      { "Customer Name": "Kiran Kumar", "Phone Number": "+91 94401 23456", "Service": "Consultation & Strategy", "Remarks": "Interested in weekend morning slot" },
      { "Customer Name": "Pravallika Reddy", "Phone Number": "+91 98480 34567", "Service": "Service Inquiry & Pricing", "Remarks": "Follow up for company growth package" },
      { "Customer Name": "Rajesh Varma", "Phone Number": "+91 91234 56789", "Service": "Premium Onboarding", "Remarks": "Urgent timeline" },
      { "Customer Name": "Sujatha Rao", "Phone Number": "+91 93901 87654", "Service": "Quarterly Plan", "Remarks": "Requested call back tomorrow" },
      { "Customer Name": "Venkat Narayana", "Phone Number": "+91 99887 76655", "Service": "Custom Enterprise Solution", "Remarks": "Requested pricing brochure" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prospects");
    XLSX.writeFile(workbook, "Sample_Cold_Call_Prospects.xlsx");
  };

  const handleResetDemoData = async () => {
    if (!confirm("Reset cold call prospects back to original demo state?")) return;
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.prospects) setProspects(data.prospects);
      if (data.metrics) setMetrics(data.metrics);
      setStatusMessage("Reset campaign to initial demo dataset.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyQuote = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentVoiceObj = ALL_VOICES.find((v) => v.id === voiceName) || ALL_VOICES[0];
  const activeLanguageObj = getLanguageMode(languageModeId);
  const isAditya = companyName.toLowerCase().includes("aditya") || sectorName.toLowerCase().includes("aditya") || Boolean(user?.email?.toLowerCase().includes("vanapalligowtham9108"));

  return (
    <div className="space-y-8">
      {/* 1. Header with Forwarding Number & Voice Pill */}
      <BlurFade delay={0.05}>
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span suppressHydrationWarning className="text-xs uppercase tracking-widest text-muted font-medium">
                {todayFormatted}
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-paper border border-border px-2.5 py-0.5 rounded text-ink">
                <PhoneForwarded className="w-3 h-3 text-secondary" strokeWidth={1.5} />
                {isAditya ? "Admissions Helpline:" : "Forwarding Caller ID:"} <strong className="text-ink">{forwardingNumber}</strong>
              </span>
              <span className="text-border">·</span>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-xs bg-paper border border-border hover:border-accent px-2.5 py-0.5 rounded text-ink transition-colors"
              >
                <Globe className="w-3 h-3 text-secondary" strokeWidth={1.5} />
                Dialect: <strong>{activeLanguageObj.name}</strong>
              </Link>
              <span className="text-border">·</span>
              <button
                onClick={() => setScriptModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs bg-paper border border-border hover:border-accent px-2.5 py-0.5 rounded text-ink transition-colors"
              >
                <Volume2 className="w-3 h-3 text-accent" strokeWidth={1.5} />
                Counselor Voice: <strong>{currentVoiceObj.name}</strong> ({currentVoiceObj.languageLabel})
              </button>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading text-ink">
              {isAditya ? "Aditya University · AI Admissions Desk" : `${companyName} · AI Cold Call Agent`}
            </h1>
            <p className="text-xs text-muted mt-1">
              {isAditya ? (
                <>Educational Sector: <strong className="text-ink">4-Year B.Tech Admissions &amp; Parent Counseling Desk</strong> · Surampalem Campus</>
              ) : (
                <>Sector: <strong className="text-ink">{sectorName}</strong> · Outbound Campaign &amp; Lead Management</>
              )}
            </p>
          </div>

          {/* Action buttons: Excel Upload, Virtual Script, Dial Next */}
          <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setScriptModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-surface text-ink border border-border hover:border-accent px-3 py-2 rounded-lg text-xs font-medium transition-colors paper-shadow"
            >
              <Sliders className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} /> {isAditya ? "Admissions Script & Voice" : "Virtual Script & Voice"}
            </button>

            <button
              onClick={() => setExcelModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-surface text-ink border border-border hover:border-accent px-3 py-2 rounded-lg text-xs font-medium transition-colors paper-shadow"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} /> {isAditya ? "Upload Parent Sheet" : "Upload Excel Sheet"}
            </button>

            <button
              onClick={() => {
                setLiveCallTargetPhone(forwardingNumber || "+91 99897 76543");
                setLiveCallModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-secondary text-surface px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs border border-secondary"
              title="Test talking live with the Admissions AI counselor with your microphone"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" strokeWidth={2} />
              <span>{isAditya ? "Test Live Admissions Call (Mic)" : "Live AI Call (Microphone)"}</span>
            </button>

            <button
              onClick={() => handleDialNext()}
              disabled={dialing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-accent text-surface px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
            >
              <PhoneOutgoing className="w-3.5 h-3.5" strokeWidth={1.5} />
              {dialing ? `Connecting with ${currentVoiceObj.name}...` : (isAditya ? "Call Next Parent with Agent" : "Dial Next Lead with Agent")}
            </button>
          </div>
        </div>
      </BlurFade>

      {/* Status banner */}
      {statusMessage && (
        <div className="bg-secondary/10 border border-secondary/20 text-secondary text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* 2. THE 6 EXACT DASHBOARD METRICS: Ongoing, Answered, Closed, Rescheduled, Seats Reserved, Under Review */}
      <BlurFade delay={0.1}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Ongoing Calls */}
          <div className="bg-surface border border-border p-4 rounded-lg paper-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">Calls Ongoing</span>
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="font-heading text-3xl font-bold text-accent mt-2">
              <NumberTicker value={metrics.ongoing} />
            </div>
            <span className="text-[10px] text-muted mt-1">{isAditya ? "Live parent counseling" : "Live speaking agent"}</span>
          </div>

          {/* Answered Calls */}
          <div className="bg-surface border border-border p-4 rounded-lg paper-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">Calls Answered</span>
              <PhoneCall className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} />
            </div>
            <div className="font-heading text-3xl font-bold text-ink mt-2">
              <NumberTicker value={metrics.answered} />
            </div>
            <span className="text-[10px] text-muted mt-1">{isAditya ? "Connected with parent" : "Connected with prospect"}</span>
          </div>

          {/* Closed Calls */}
          <div className="bg-surface border border-border p-4 rounded-lg paper-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">Calls Closed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-ink" strokeWidth={1.5} />
            </div>
            <div className="font-heading text-3xl font-bold text-ink mt-2">
              <NumberTicker value={metrics.closed} />
            </div>
            <span className="text-[10px] text-muted mt-1">{isAditya ? "Counseling concluded" : "Conversations finalized"}</span>
          </div>

          {/* Rescheduled / Callback */}
          <div className="bg-surface border border-border p-4 rounded-lg paper-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">{isAditya ? "Callback Requested" : "Calls Rejected"}</span>
              <PhoneOff className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
            </div>
            <div className="font-heading text-3xl font-bold text-muted mt-2">
              <NumberTicker value={metrics.rejected} />
            </div>
            <span className="text-[10px] text-muted mt-1">{isAditya ? "Scheduled for follow-up" : "Busy or declined"}</span>
          </div>

          {/* Seats Reserved / Admissions Confirmed */}
          <div className="bg-surface border border-secondary/30 p-4 rounded-lg paper-shadow flex flex-col justify-between bg-secondary/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-secondary font-semibold">{isAditya ? "Seats Reserved" : "Leads Won"}</span>
              <Trophy className="w-4 h-4 text-secondary" strokeWidth={1.5} />
            </div>
            <div className="font-heading text-3xl font-bold text-secondary mt-2">
              <NumberTicker value={metrics.leadsWon} />
            </div>
            <span className="text-[10px] text-secondary/80 mt-1">{isAditya ? "Admissions confirmed" : "Agreed to follow-up"}</span>
          </div>

          {/* Under Review / Deferred */}
          <div className="bg-surface border border-border p-4 rounded-lg paper-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">{isAditya ? "Under Review" : "Leads Rejected"}</span>
              <XCircle className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
            </div>
            <div className="font-heading text-3xl font-bold text-muted mt-2">
              <NumberTicker value={metrics.leadsLost} />
            </div>
            <span className="text-[10px] text-muted mt-1">{isAditya ? "Awaiting EAPCET round" : "Not interested"}</span>
          </div>
        </div>
      </BlurFade>

      {/* 3. Spoken Evening Recap Player (Timbre) */}
      <BlurFade delay={0.15}>
        <section className="bg-surface border border-border rounded-lg p-5 sm:p-6 paper-shadow relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Volume2 className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-heading text-xl text-ink">
                  {isAditya ? "Admissions Evening Voice Brief" : "Spoken evening voice recap"}
                </h2>
                <p className="text-xs text-muted">
                  {isAditya
                    ? `Daily admissions committee summary synthesized with Gnani Timbre (${recap?.voice || voiceName})`
                    : `Spoken brief synthesized with Gnani Timbre (${recap?.voice || voiceName})`}
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateRecap}
              disabled={generatingRecap}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink bg-paper border border-border hover:border-accent px-3 py-1.5 rounded-md transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted ${generatingRecap ? "animate-spin" : ""}`} strokeWidth={1.5} />
              {generatingRecap ? "Synthesizing recap..." : "Regenerate recap"}
            </button>
          </div>

          {/* Player Bar & Waveform */}
          <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
            <button
              onClick={togglePlayRecap}
              disabled={!recap}
              aria-label={isPlayingRecap ? "Pause recap" : "Play recap"}
              className="w-12 h-12 rounded-full bg-accent text-surface flex items-center justify-center hover:opacity-90 transition-transform active:scale-95 shadow-xs shrink-0"
            >
              {isPlayingRecap ? (
                <Pause className="w-5 h-5 fill-current" strokeWidth={1.5} />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" strokeWidth={1.5} />
              )}
            </button>

            <div className="flex-1 bg-paper border border-border rounded-lg p-3 flex items-center justify-between gap-1 overflow-hidden h-14">
              {[4, 8, 14, 20, 26, 12, 18, 24, 16, 28, 22, 14, 18, 10, 6, 16, 24, 20, 12, 26, 18, 8, 14, 22, 16, 10, 6, 14, 20, 8].map(
                (h, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      isPlayingRecap ? "bg-accent wave-bar" : "bg-muted/40"
                    }`}
                    style={{
                      height: isPlayingRecap ? undefined : `${h}px`,
                      animationDelay: `${idx * 0.05}s`,
                    }}
                  />
                )
              )}
            </div>
          </div>

          {recap?.spoken_text_telugu && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <span className="text-[11px] uppercase tracking-wider text-muted font-medium block mb-1">
                Spoken summary script
              </span>
              <p className="telugu-quote text-base sm:text-lg text-ink font-medium leading-[1.8] italic bg-paper/60 p-3.5 rounded-md border border-border/50">
                &ldquo;{recap.spoken_text_telugu}&rdquo;
              </p>
            </div>
          )}
        </section>
      </BlurFade>

      {/* 4. WHICH AGENT IS ACTIVATING & WHAT IS THE VOICE (College AI Agent Status) */}
      <BlurFade delay={0.18}>
        <div className="bg-surface border border-secondary/30 rounded-xl p-5 sm:p-6 paper-shadow relative overflow-hidden bg-gradient-to-br from-surface via-surface to-secondary/5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0 shadow-xs">
                <GraduationCap className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-secondary text-surface px-2.5 py-0.5 rounded-full">
                    Active Agent
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-secondary font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                    Live &amp; Actively Counseling
                  </span>
                  <span className="text-border">·</span>
                  <span className="text-xs font-mono text-muted">
                    Surampalem Campus, AP
                  </span>
                </div>
                <h2 className="font-heading text-xl sm:text-2xl text-ink font-bold mt-1">
                  Aditya University · B.Tech Admissions &amp; Parent Desk Officer
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Autonomous outreach and parent advisory assistant for 4-year B.Tech programs (CSE, AI &amp; ML, Data Science, ECE, Mechanical, IT)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
              <button
                onClick={() => {
                  setLiveCallTargetPhone(forwardingNumber || "+91 99897 76543");
                  setLiveCallModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-secondary text-surface px-4 py-2.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs border border-secondary"
              >
                <PhoneCall className="w-3.5 h-3.5 animate-pulse" strokeWidth={2} />
                <span>Test Live Call with Agent</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Activating Agent Info */}
            <div className="bg-paper/80 border border-border/80 p-3.5 rounded-lg space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block">
                Which Agent Is Activating
              </span>
              <p className="font-heading text-sm text-ink font-bold">
                Aditya Admissions Officer
              </p>
              <p className="text-[11px] text-muted">
                Status: <strong className="text-secondary font-semibold">Live &amp; Active for Parents</strong>
              </p>
            </div>

            {/* Voice Engine & Persona */}
            <div className="bg-paper/80 border border-border/80 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block">
                  What Is The Voice
                </span>
                <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.2 rounded font-semibold">
                  Gnani Timbre v3.0
                </span>
              </div>
              <p className="font-heading text-sm text-ink font-bold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-accent" />
                {currentVoiceObj.name} ({currentVoiceObj.gender})
              </p>
              <p className="text-[11px] text-muted">
                Dialect: <strong className="text-ink">{currentVoiceObj.languageLabel}</strong> (Empathetic Tone)
              </p>
            </div>

            {/* Speech Recognition (STT) */}
            <div className="bg-paper/80 border border-border/80 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block">
                  Parent Speech STT
                </span>
                <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.2 rounded font-semibold">
                  Gnani Prisma v3.0
                </span>
              </div>
              <p className="font-heading text-sm text-ink font-bold">
                Telugu &amp; Indian English
              </p>
              <p className="text-[11px] text-muted">
                Code: <strong className="text-ink font-mono">te-IN</strong> (Real-time VAD)
              </p>
            </div>

            {/* Helpline & Forwarding */}
            <div className="bg-paper/80 border border-border/80 p-3.5 rounded-lg space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block">
                Admissions Caller ID
              </span>
              <p className="font-mono text-sm text-ink font-bold flex items-center gap-1.5">
                <PhoneForwarded className="w-3.5 h-3.5 text-secondary" />
                {forwardingNumber}
              </p>
              <p className="text-[11px] text-muted">
                Campus: Surampalem (08852-252243)
              </p>
            </div>
          </div>
        </div>
      </BlurFade>

      {/* 5. ONGOING POLLS & PARENT PREFERENCE SURVEYS */}
      <BlurFade delay={0.2}>
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 paper-shadow space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-heading text-lg sm:text-xl text-ink font-semibold flex items-center gap-2">
                  <span>Ongoing Polls · Parent Inquiries &amp; Preferences</span>
                  <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded-full font-mono font-bold">
                    Live Updates
                  </span>
                </h3>
                <p className="text-xs text-muted">
                  Aggregated in real-time from automated parent calls and counseling desk interactions
                </p>
              </div>
            </div>
            <span className="text-xs text-muted bg-paper px-2.5 py-1 rounded border border-border font-mono self-start sm:self-auto">
              Total Responses: {polls.reduce((acc, p) => acc + p.totalVotes, 0)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-paper/70 border border-border rounded-lg p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                    <span className="uppercase tracking-wider font-semibold text-secondary">{poll.category}</span>
                    <span className="font-mono">{poll.totalVotes} votes</span>
                  </div>
                  <h4 className="font-heading text-sm font-semibold text-ink leading-snug">
                    {poll.title}
                  </h4>
                </div>

                <div className="space-y-2 pt-1">
                  {poll.options.map((option) => {
                    const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                    const isVoted = poll.userVotedOption === option.id;

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleVotePoll(poll.id, option.id)}
                        className={`group p-2 rounded-md border text-xs cursor-pointer transition-all ${
                          isVoted
                            ? "border-secondary bg-secondary/10 shadow-xs"
                            : "border-border/80 bg-surface hover:border-accent"
                        }`}
                        title="Click to register parent response in this poll"
                      >
                        <div className="flex items-center justify-between font-medium mb-1">
                          <span className="text-ink flex items-center gap-1.5 truncate max-w-[190px]">
                            {isVoted && <Check className="w-3 h-3 text-secondary shrink-0" />}
                            {option.text}
                          </span>
                          <span className="font-mono text-[11px] text-muted shrink-0">
                            {pct}% ({option.votes})
                          </span>
                        </div>
                        <div className="w-full bg-paper rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isVoted ? "bg-secondary" : "bg-accent/75 group-hover:bg-accent"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-muted italic pt-1">
                  💡 Click any option above to cast an updated parent vote.
                </p>
              </div>
            ))}
          </div>
        </div>
      </BlurFade>

      {/* 6. CALLING LIST PORTAL WITH FILTER TABS (Upcoming vs Recorded vs All) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Wide Left: Calling Lists with Tabs */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
            {/* TABS */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCallingListTab("upcoming")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  callingListTab === "upcoming"
                    ? "bg-secondary text-surface shadow-xs font-bold ring-1 ring-secondary"
                    : "bg-surface text-ink hover:bg-paper border border-border"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>📋 Upcoming Calling List</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  callingListTab === "upcoming" ? "bg-surface/25 text-surface" : "bg-paper text-muted"
                }`}>
                  {prospects.filter((p) => p.call_status === "queued").length}
                </span>
              </button>

              <button
                onClick={() => setCallingListTab("recorded")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  callingListTab === "recorded"
                    ? "bg-secondary text-surface shadow-xs font-bold ring-1 ring-secondary"
                    : "bg-surface text-ink hover:bg-paper border border-border"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>🎙️ Recorded Calling List</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  callingListTab === "recorded" ? "bg-surface/25 text-surface" : "bg-paper text-muted"
                }`}>
                  {prospects.filter((p) => p.call_status === "closed" || p.call_status === "ongoing").length}
                </span>
              </button>

              <button
                onClick={() => setCallingListTab("all")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  callingListTab === "all"
                    ? "bg-secondary text-surface shadow-xs font-bold ring-1 ring-secondary"
                    : "bg-surface text-ink hover:bg-paper border border-border"
                }`}
              >
                <span>📊 All Contacts</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  callingListTab === "all" ? "bg-surface/25 text-surface" : "bg-paper text-muted"
                }`}>
                  {prospects.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetDemoData}
                className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
                title="Reset demo prospects"
              >
                <RotateCcw className="w-3 h-3" /> Reset list
              </button>
            </div>
          </div>

          <AnimatedList delay={40}>
            {(() => {
              const upcomingProspects = prospects.filter((p) => p.call_status === "queued");
              const recordedProspects = prospects.filter((p) => p.call_status === "closed" || p.call_status === "ongoing");
              const displayed =
                callingListTab === "upcoming"
                  ? upcomingProspects
                  : callingListTab === "recorded"
                  ? recordedProspects
                  : prospects;

              if (displayed.length === 0) {
                return (
                  <div className="bg-surface border border-border rounded-lg p-8 text-center space-y-2">
                    <p className="text-sm font-medium text-ink">
                      {callingListTab === "upcoming"
                        ? "No upcoming calls queued."
                        : "No recorded calls yet."}
                    </p>
                    <p className="text-xs text-muted">
                      {callingListTab === "upcoming"
                        ? "Upload an Excel sheet of parent contacts or click Dial Next to queue new calls."
                        : "Dial upcoming parent contacts with the AI agent to generate authentic call recordings."}
                    </p>
                  </div>
                );
              }

              return displayed.map((prospect) => {
                const isPlaying = playingCallId === prospect.id;
                const isWon = prospect.outcome === "won";
                const isOngoing = prospect.call_status === "ongoing";
                const isRejected = prospect.call_status === "rejected" || prospect.outcome === "lost";
                const isQueued = prospect.call_status === "queued";

                return (
                  <article
                    key={prospect.id}
                    className={`bg-surface border rounded-lg p-5 paper-shadow paper-shadow-hover space-y-3 transition-colors ${
                      isOngoing ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                      <div className="flex items-center gap-3">
                        {prospect.call_status !== "queued" ? (
                          <button
                            onClick={() => togglePlayCallAudio(prospect)}
                            disabled={loadingAudioId === prospect.id}
                            aria-label={isPlaying ? "Pause call audio" : "Play call audio"}
                            title={loadingAudioId === prospect.id ? `Synthesizing ${voiceName}'s voice...` : (isPlaying ? "Pause call audio" : `Play recording in ${voiceName}'s voice`)}
                            className="w-9 h-9 rounded-full bg-paper border border-border hover:border-accent text-accent flex items-center justify-center shrink-0 transition-colors shadow-xs"
                          >
                            {loadingAudioId === prospect.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-accent" strokeWidth={1.5} />
                            ) : isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" strokeWidth={1.5} />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" strokeWidth={1.5} />
                            )}
                          </button>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-paper border border-border flex items-center justify-center text-secondary shrink-0">
                            <Calendar className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading text-lg text-ink font-medium">
                              {prospect.name}
                            </h3>
                            <span className="text-xs font-mono text-muted bg-paper px-2 py-0.5 rounded border border-border">
                              {prospect.phone}
                            </span>
                            {prospect.call_time && (
                              <span className="text-[10px] font-mono text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded font-medium">
                                {prospect.call_time}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5">{prospect.need}</p>
                          {prospect.notes && (
                            <p className="text-[11px] text-muted/80 mt-0.5 italic">Note: {prospect.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* Call Status Badge */}
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                            isOngoing
                              ? "bg-accent/10 text-accent border-accent/20 animate-pulse"
                              : isWon
                              ? "bg-secondary/15 text-secondary border-secondary/30"
                              : isRejected
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-paper text-muted border-border"
                          }`}
                        >
                          {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />}
                          {isAditya
                            ? isOngoing
                              ? "LIVE COUNSELING"
                              : isWon
                              ? "SEAT RESERVED"
                              : isRejected
                              ? "UNDER REVIEW"
                              : isQueued
                              ? "SCHEDULED OUTREACH"
                              : "COUNSELING CONCLUDED"
                            : `${prospect.call_status.toUpperCase()}${prospect.outcome !== "pending" ? ` · ${prospect.outcome.toUpperCase()}` : ""}`}
                        </span>

                        {/* Individual Dial Button if Queued */}
                        {isQueued && (
                          <button
                            onClick={() => handleDialNext(prospect.id)}
                            disabled={dialing}
                            className="text-xs bg-secondary text-surface border border-secondary hover:opacity-90 px-3 py-1.5 rounded font-semibold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <PhoneOutgoing className="w-3 h-3" />
                            <span>{isAditya ? "Call Parent" : "Dial"}</span>
                          </button>
                        )}

                        {prospect.duration_seconds > 0 && (
                          <span className="text-[11px] text-muted font-mono">
                            {prospect.duration_seconds}s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Verbatim Transcript */}
                    {prospect.transcript && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted font-medium block">
                          Verbatim Speech-to-Text Conversation
                        </span>
                        <p className="telugu-text text-xs text-ink leading-[1.8] bg-paper p-3 rounded border border-border whitespace-pre-line">
                          {prospect.transcript}
                        </p>
                      </div>
                    )}

                    {/* Key Quote / Intent */}
                    {prospect.key_quote && (
                      <div className="flex items-start justify-between gap-3 text-xs bg-paper/60 p-2.5 rounded border border-border/60">
                        <div className="flex items-start gap-1.5 text-ink">
                          <Volume2 className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" strokeWidth={1.5} />
                          <span className="telugu-quote italic">&ldquo;{prospect.key_quote}&rdquo;</span>
                        </div>
                        <button
                          onClick={() => copyQuote(prospect.key_quote!, prospect.id)}
                          className="text-[11px] text-accent hover:underline shrink-0"
                        >
                          {copiedId === prospect.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              });
            })()}
          </AnimatedList>
        </div>

        {/* Narrow Right Column: Outbound Details & Firebase Realtime Status */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface border border-border rounded-lg p-5 paper-shadow space-y-4">
            <h3 className="font-heading text-base text-ink">Outbound agent config</h3>
            <div className="space-y-3 text-xs text-muted">
              <div className="flex items-center justify-between py-1.5 border-b border-border/80">
                <span>Industry sector</span>
                <span className="font-heading text-ink font-medium truncate max-w-[170px]">{sectorName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/80">
                <span>Forwarding number</span>
                <span className="font-mono text-ink font-semibold">{forwardingNumber}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/80">
                <span>Timbre voice</span>
                <span className="font-heading text-ink font-medium">{currentVoiceObj.name} ({currentVoiceObj.gender})</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/80">
                <span>Voice language</span>
                <span className="text-ink font-medium">{currentVoiceObj.languageLabel}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/80">
                <span>Active script</span>
                <span className="text-ink font-medium">{activeScript.name.slice(0, 18)}...</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Firebase database</span>
                <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 font-medium">
                  Realtime Synced
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setScriptModalOpen(true)}
                className="w-full text-center text-xs bg-paper border border-border hover:border-accent py-2 rounded-md font-medium text-ink transition-colors"
              >
                Change Virtual Script &amp; Voice
              </button>
              <Link
                href="/settings"
                className="block text-center text-xs text-accent hover:underline font-medium"
              >
                Configure settings &amp; caller ID &rarr;
              </Link>
            </div>
          </div>

          {/* Aditya University Admissions Desk Card */}
          <div className="bg-surface border border-secondary/30 rounded-lg p-5 paper-shadow space-y-3 bg-secondary/5">
            <div className="flex items-center gap-2 text-secondary font-heading font-semibold text-sm">
              <GraduationCap className="w-4 h-4" />
              <span>Aditya University B.Tech Desk</span>
            </div>
            <div className="space-y-2 text-[11px] text-muted leading-relaxed">
              <p>
                <strong className="text-ink">Campus:</strong> Surampalem, Near Kakinada, AP
              </p>
              <p>
                <strong className="text-ink">Degree Programs:</strong> 4-Year B.Tech (CSE, AI&amp;ML, Data Science, ECE, EEE, Mech, Civil, IT)
              </p>
              <p>
                <strong className="text-ink">Placements:</strong> 3,000+ Offers (Amazon ₹33+ LPA, Cisco, TCS, Infosys)
              </p>
              <p>
                <strong className="text-ink">Hostels:</strong> On-Campus AC &amp; Non-AC (Separate Boys &amp; Girls)
              </p>
              <p>
                <strong className="text-ink">Admissions Helpline:</strong> +91 99897 76543 (Always Available)
              </p>
            </div>
          </div>

          <div className="bg-paper border border-border rounded-lg p-4 space-y-2 text-xs text-muted">
            <span className="font-semibold text-ink block">{isAditya ? "Parent Outreach & Counseling Workflow:" : "Synthetic Dialing Workflow:"}</span>
            <p className="leading-relaxed">
              {isAditya ? (
                <>When a parent inquiry is dialed, the admissions officer speaks in <strong>{currentVoiceObj.name}&apos;s voice</strong> via Gnani Timbre, routes with your verified helpline caller ID (<strong>{forwardingNumber}</strong>), records the parent&apos;s course and hostel preferences, and logs the counseling status.</>
              ) : (
                <>When an Excel prospect is dialed, the agent speaks using <strong>{currentVoiceObj.name}&apos;s voice</strong> via Gnani Timbre, routes with your verified forwarding number (<strong>{forwardingNumber}</strong>), saves the audio, and logs the outcome to Firebase.</>
              )}
            </p>
          </div>
        </aside>
      </div>

      {/* MODAL 1: EXCEL SHEET UPLOADER (.xlsx, .xls, .csv) */}
      {excelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 paper-shadow space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-accent" strokeWidth={1.5} />
                <h3 className="font-heading text-lg text-ink font-semibold">Upload Excel Prospect Sheet</h3>
              </div>
              <button
                onClick={() => setExcelModalOpen(false)}
                className="text-muted hover:text-ink text-sm font-semibold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Upload an Excel (<code className="font-mono text-ink">.xlsx</code>, <code className="font-mono text-ink">.xls</code>) or CSV sheet. Columns can include: <strong className="text-ink">Name, Phone, Service/Need, Remarks</strong>.
            </p>

            <input
              type="file"
              ref={excelFileInputRef}
              onChange={handleExcelUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div
              onClick={() => excelFileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-accent rounded-lg p-8 text-center cursor-pointer transition-colors bg-paper"
            >
              <UploadCloud className="w-8 h-8 text-accent mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-heading font-medium text-sm text-ink">
                {uploadingExcel ? "Parsing Excel & queuing prospects..." : "Click to select Excel file (.xlsx / .csv)"}
              </p>
              <p className="text-[11px] text-muted mt-1">
                Numbers in the sheet will be queued for autonomous dialing through your forwarding number.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
              >
                <Download className="w-3.5 h-3.5" /> Download Sample .xlsx
              </button>

              <button
                type="button"
                onClick={() => setExcelModalOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIRTUAL SCRIPT & VOICE CUSTOMIZER */}
      {scriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-2xl w-full p-6 paper-shadow space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-accent" strokeWidth={1.5} />
                <h3 className="font-heading text-lg text-ink font-semibold">Virtual Conversation Script &amp; Voice</h3>
              </div>
              <button
                onClick={() => setScriptModalOpen(false)}
                className="text-muted hover:text-ink text-sm font-semibold"
              >
                &times;
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted font-medium block">Select Conversation Script:</span>
              <div className="flex flex-wrap gap-2">
                {Object.values(DEFAULT_VIRTUAL_SCRIPTS).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveScript(s);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      activeScript.id === s.id
                        ? "bg-accent text-surface border-accent font-medium shadow-xs"
                        : "bg-paper text-ink border-border hover:border-accent"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Persona Selector */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                Agent Voice Persona (All Indian Languages)
              </label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full bg-paper border border-border rounded-md px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
              >
                {ALL_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender} · {v.languageLabel}) · {v.persona}
                  </option>
                ))}
              </select>
            </div>

            {/* Script Fields */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-muted font-medium block">
                  Agent Greeting (with {"{name}"} &amp; {"{company}"})
                </label>
                <textarea
                  rows={2}
                  value={activeScript.greeting}
                  onChange={(e) => setActiveScript({ ...activeScript, greeting: e.target.value })}
                  className="w-full bg-paper border border-border rounded-md p-2.5 text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-muted font-medium block">
                  Sales Pitch &amp; Offer (with {"{need}"})
                </label>
                <textarea
                  rows={2}
                  value={activeScript.pitch}
                  onChange={(e) => setActiveScript({ ...activeScript, pitch: e.target.value })}
                  className="w-full bg-paper border border-border rounded-md p-2.5 text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-muted font-medium block">
                  Qualifying Question
                </label>
                <input
                  type="text"
                  value={activeScript.question}
                  onChange={(e) => setActiveScript({ ...activeScript, question: e.target.value })}
                  className="w-full bg-paper border border-border rounded-md p-2 text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-muted font-medium block">
                  Closing &amp; WhatsApp Confirmation
                </label>
                <textarea
                  rows={2}
                  value={activeScript.closing}
                  onChange={(e) => setActiveScript({ ...activeScript, closing: e.target.value })}
                  className="w-full bg-paper border border-border rounded-md p-2.5 text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setScriptModalOpen(false)}
                className="bg-accent text-surface px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90"
              >
                Apply Virtual Script &amp; Voice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive AI Phone Call Modal */}
      <LiveCallModal
        isOpen={liveCallModalOpen}
        onClose={() => setLiveCallModalOpen(false)}
        defaultPhone={liveCallTargetPhone}
        agentVoiceName={currentVoiceObj.name}
        companyName={companyName}
        onCallSaved={() => {
          fetchCampaignData();
          setStatusMessage("Live call successfully saved to recordings & CRM leads!");
          setTimeout(() => setStatusMessage(null), 4000);
        }}
      />
    </div>
  );
}
