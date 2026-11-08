import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { synthesizeSpeech } from "@/lib/gnani";
import { ALL_VOICES } from "@/lib/voice-catalog";
import { renderScript, DEFAULT_VIRTUAL_SCRIPTS } from "@/lib/virtual-script";
import { syncRealtimeDb } from "@/lib/firebase";
import { extractFullCallSpeechText } from "@/lib/sector-campaigns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prospectId, text: overrideText, voice: overrideVoice } = body;

    // 1. Get user's selected voice from settings
    const savedVoice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const chosenVoice = overrideVoice || savedVoice;
    const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === chosenVoice.toLowerCase()) || ALL_VOICES[0];

    // 2. Look up prospect if prospectId provided
    let prospect: any = null;
    if (prospectId) {
      prospect = db.prepare("SELECT * FROM cold_call_campaigns WHERE id = ?").get(prospectId);
    }

    // Check if prospect already has a valid synthesized audio file on disk (and NOT an old demo_call file)
    if (prospect && prospect.audio_url && !prospect.audio_url.includes("demo_call") && !prospect.audio_url.includes("sample_recap")) {
      const fullPath = path.join(process.cwd(), "public", prospect.audio_url);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        // If file is complete (> 450KB ~ 9.5s) or transcript is brief, return cached
        if (stat.size > 450000 || !prospect.transcript || prospect.transcript.length < 160) {
          return NextResponse.json({
            success: true,
            audioUrl: prospect.audio_url,
            cached: true,
            voice: voiceDef.id,
          });
        }
      }
    }

    // 3. Determine the complete speech text to synthesize
    let speechText = overrideText || "";
    const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Ishiva digital";

    if (!speechText && prospect) {
      const rawActiveScript = (db.prepare("SELECT value FROM settings WHERE key = 'active_script'").get() as any)?.value;
      let activeScript = DEFAULT_VIRTUAL_SCRIPTS.telugu_high_english;
      if (rawActiveScript) {
        try { activeScript = JSON.parse(rawActiveScript); } catch {}
      }

      speechText = extractFullCallSpeechText(prospect, voiceDef.name, company, activeScript);
    }

    if (!speechText) {
      speechText = `Hello, ${voiceDef.name} calling from ${company}.`;
    }

    // Clean any unwanted outer quotes and duplicate parentheses
    speechText = speechText.replace(/^["']|["']$/g, "").replace(/\s*\([^)]*\)/g, "").trim();

    // 4. Synthesize with the user's SELECTED VOICE & language
    const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
    const synthLang = savedTimbreLang || voiceDef.language || "te-IN";

    const result = await synthesizeSpeech(speechText, {
      voice: voiceDef.id,
      model: voiceDef.model,
      language: synthLang,
    });

    // 5. Update prospect in SQLite and Firebase if prospectId was provided
    if (prospectId) {
      db.prepare(`
        UPDATE cold_call_campaigns
        SET audio_url = ?
        WHERE id = ?
      `).run(result.audioUrl, prospectId);

      const all = db.prepare("SELECT * FROM cold_call_campaigns").all();
      syncRealtimeDb("campaign/prospects", all);
    }

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      voice: voiceDef.id,
      text: speechText,
      cached: result.cached,
    });
  } catch (err: any) {
    console.error("Call audio generation failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    // 1. If audio file already exists on disk, stream it immediately
    if (prospect && prospect.audio_url) {
      const fullPath = path.join(process.cwd(), "public", prospect.audio_url.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) {
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

    // 2. Synthesize on-the-fly
    const rawActiveScript = (db.prepare("SELECT value FROM settings WHERE key = 'active_script'").get() as any)?.value;
    let activeScript = DEFAULT_VIRTUAL_SCRIPTS.telugu_high_english;
    if (rawActiveScript) {
      try { activeScript = JSON.parse(rawActiveScript); } catch {}
    }

    let speechText = prospect
      ? extractFullCallSpeechText(prospect, voiceDef.name, company, activeScript)
      : `Hello, ${voiceDef.name} calling from ${company}.`;

    speechText = speechText.replace(/^["']|["']$/g, "").replace(/\s*\([^)]*\)/g, "").trim();

    const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
    const synthLang = savedTimbreLang || voiceDef.language || "te-IN";

    const result = await synthesizeSpeech(speechText, {
      voice: voiceDef.id,
      model: voiceDef.model,
      language: synthLang,
    });

    if (prospectId) {
      try {
        db.prepare("UPDATE cold_call_campaigns SET audio_url = ? WHERE id = ?").run(result.audioUrl, prospectId);
        db.prepare("UPDATE calls SET audio_url = ? WHERE id = ?").run(result.audioUrl, prospectId);
      } catch {}
    }

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

    return new NextResponse("Audio generation failed", { status: 500 });
  } catch (err: any) {
    console.error("GET call-audio stream error:", err);
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}


