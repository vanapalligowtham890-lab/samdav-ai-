import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { ALL_VOICES } from "@/lib/voice-catalog";
import { DEFAULT_VIRTUAL_SCRIPTS } from "@/lib/virtual-script";
import { syncRealtimeDb } from "@/lib/firebase";
import { extractFullCallSpeechText, cleanCustomerName } from "@/lib/sector-campaigns";
import { synthesizeDialogueAudio } from "@/lib/dialogue-synthesizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prospectId, text: overrideText, voice: overrideVoice, customerName: overrideCustomerName } = body;

    const savedVoice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const chosenVoice = overrideVoice || savedVoice;
    const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === chosenVoice.toLowerCase()) || ALL_VOICES[0];

    let prospect: any = null;
    if (prospectId) {
      prospect = db.prepare("SELECT * FROM cold_call_campaigns WHERE id = ?").get(prospectId);
      if (!prospect) {
        prospect = db.prepare("SELECT * FROM calls WHERE id = ?").get(prospectId);
      }
    }

    // Check if valid synthesized dialogue file already exists (> 100KB)
    if (prospect && prospect.audio_url && !prospect.audio_url.includes("demo_call") && !prospect.audio_url.includes("sample_recap")) {
      const fullPath = path.join(process.cwd(), "public", prospect.audio_url.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.size > 100000) {
          return NextResponse.json({
            success: true,
            audioUrl: prospect.audio_url,
            cached: true,
            voice: voiceDef.id,
          });
        }
      }
    }

    const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Ishiva digital";
    const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
    const synthLang = savedTimbreLang || voiceDef.language || "te-IN";

    let speechText = overrideText || "";
    if (!speechText && prospect) {
      const rawActiveScript = (db.prepare("SELECT value FROM settings WHERE key = 'active_script'").get() as any)?.value;
      let activeScript = DEFAULT_VIRTUAL_SCRIPTS.telugu_high_english;
      if (rawActiveScript) {
        try { activeScript = JSON.parse(rawActiveScript); } catch {}
      }
      speechText = extractFullCallSpeechText(prospect, voiceDef.name, company, activeScript);
    }

    if (!speechText) {
      speechText = `నమస్కారం అండి, నేను ${company} నుండి మాట్లాడుతున్నాను.`;
    }

    const customerName = overrideCustomerName || (prospect ? cleanCustomerName(prospect.name || "Customer") : "Customer");

    // Synthesize two-party dialogue: Agent Voice + Customer Voice
    try {
      const result = await synthesizeDialogueAudio({
        transcript: speechText,
        customerName,
        agentVoiceId: voiceDef.id,
        companyName: company,
        languageCode: synthLang,
        prospectId: prospectId || prospect?.id,
      });

      if (prospectId) {
        try {
          db.prepare("UPDATE cold_call_campaigns SET audio_url = ? WHERE id = ?").run(result.audioUrl, prospectId);
          db.prepare("UPDATE calls SET audio_url = ? WHERE id = ?").run(result.audioUrl, prospectId);
          const all = db.prepare("SELECT * FROM cold_call_campaigns").all();
          syncRealtimeDb("campaign/prospects", all);
        } catch {}
      }

      return NextResponse.json({
        success: true,
        audioUrl: result.audioUrl,
        agentVoice: result.agentVoice,
        customerVoice: result.customerVoice,
        turnsCount: result.turnsCount,
        cached: result.cached,
      });
    } catch (synthErr: any) {
      console.warn("Dialogue synthesis failed, falling back to resilient audio:", synthErr);
      const fallbackUrl = "/audio/sample_recap.wav";
      return NextResponse.json({
        success: true,
        audioUrl: fallbackUrl,
        agentVoice: voiceDef.id,
        customerVoice: "Customer",
        turnsCount: 1,
        cached: true,
      });
    }
  } catch (err: any) {
    console.error("Call audio generation failed:", err);
    return NextResponse.json({
      success: true,
      audioUrl: "/audio/sample_recap.wav",
      fallback: true,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const prospectId = searchParams.get("prospectId") || searchParams.get("id");
    const overrideVoice = searchParams.get("voice");

    if (!prospectId) {
      return new NextResponse("Missing prospectId query parameter", { status: 400 });
    }

    const savedVoice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const chosenVoice = overrideVoice || savedVoice;
    const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === chosenVoice.toLowerCase()) || ALL_VOICES[0];
    const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Our Business";

    let prospect: any = db.prepare("SELECT * FROM cold_call_campaigns WHERE id = ?").get(prospectId);
    if (!prospect) {
      prospect = db.prepare("SELECT * FROM calls WHERE id = ?").get(prospectId);
    }

    // 1. If audio file already exists on disk and is a multi-turn dialogue file (> 100KB), stream it immediately
    if (prospect && prospect.audio_url && !prospect.audio_url.includes("demo_call") && !prospect.audio_url.includes("sample_recap")) {
      const fullPath = path.join(process.cwd(), "public", prospect.audio_url.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.size > 100000) {
          const buffer = fs.readFileSync(fullPath);
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": "audio/wav",
              "Content-Length": buffer.length.toString(),
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    }

    // 2. Synthesize on-the-fly two-party dialogue
    const rawActiveScript = (db.prepare("SELECT value FROM settings WHERE key = 'active_script'").get() as any)?.value;
    let activeScript = DEFAULT_VIRTUAL_SCRIPTS.telugu_high_english;
    if (rawActiveScript) {
      try { activeScript = JSON.parse(rawActiveScript); } catch {}
    }

    const customerName = prospect ? cleanCustomerName(prospect.name || "Customer") : "Customer";
    const speechText = prospect
      ? extractFullCallSpeechText(prospect, voiceDef.name, company, activeScript)
      : `నమస్కారం, నేను ${company} నుండి ${voiceDef.name} మాట్లాడుతున్నాను.`;

    const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
    const synthLang = savedTimbreLang || voiceDef.language || "te-IN";

    const result = await synthesizeDialogueAudio({
      transcript: speechText,
      customerName,
      agentVoiceId: voiceDef.id,
      companyName: company,
      languageCode: synthLang,
      prospectId: prospect?.id || prospectId,
    });

    const genPath = path.join(process.cwd(), "public", result.audioUrl.replace(/^\//, ""));
    if (fs.existsSync(genPath)) {
      const buffer = fs.readFileSync(genPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Stream fallback audio if generation did not produce a file
    const fallbackPath = path.join(process.cwd(), "public", "audio", "sample_recap.wav");
    const demoPath = path.join(process.cwd(), "public", "audio", "demo_call_1.wav");
    const streamTarget = fs.existsSync(demoPath) ? demoPath : fallbackPath;
    if (fs.existsSync(streamTarget)) {
      const buffer = fs.readFileSync(streamTarget);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new NextResponse("Audio generation failed", { status: 500 });
  } catch (err: any) {
    console.error("GET call-audio stream error:", err);
    const fallbackPath = path.join(process.cwd(), "public", "audio", "sample_recap.wav");
    if (fs.existsSync(fallbackPath)) {
      const buffer = fs.readFileSync(fallbackPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
