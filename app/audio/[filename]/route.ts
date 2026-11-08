import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { synthesizeSpeech } from "@/lib/gnani";
import { ALL_VOICES } from "@/lib/voice-catalog";
import { extractFullCallSpeechText, cleanCustomerName } from "@/lib/sector-campaigns";
import { DEFAULT_VIRTUAL_SCRIPTS } from "@/lib/virtual-script";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const cleanFilename = path.basename(filename);

    const publicAudioDir = path.join(process.cwd(), "public", "audio");
    const filePath = path.join(publicAudioDir, cleanFilename);
    const dataPath = path.join(process.cwd(), "data", "synthetic-calls", cleanFilename);

    // 1. If file exists on disk (cached or committed), stream it immediately
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (fs.existsSync(dataPath)) {
      const buffer = fs.readFileSync(dataPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 2. File not on disk (e.g. Render fresh container): Synthesize on-the-fly with Gnani Timbre!
    const savedVoice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === savedVoice.toLowerCase()) || ALL_VOICES[0];
    const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Our Business";
    const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
    const synthLang = savedTimbreLang || voiceDef.language || "te-IN";

    // A. Check cold_call_campaigns
    let textToSpeak = "";
    const prospect = db.prepare(`
      SELECT * FROM cold_call_campaigns 
      WHERE audio_url LIKE ? OR id = ? OR id = ?
      LIMIT 1
    `).get(`%${cleanFilename}%`, cleanFilename.replace(/\.wav$/, ""), cleanFilename) as any;

    if (prospect) {
      const rawActiveScript = (db.prepare("SELECT value FROM settings WHERE key = 'active_script'").get() as any)?.value;
      let activeScript = DEFAULT_VIRTUAL_SCRIPTS.telugu_high_english;
      if (rawActiveScript) {
        try { activeScript = JSON.parse(rawActiveScript); } catch {}
      }
      textToSpeak = extractFullCallSpeechText(prospect, voiceDef.name, company, activeScript);
    }

    // B. Check recaps
    if (!textToSpeak) {
      const recap = db.prepare(`
        SELECT * FROM recaps WHERE audio_url LIKE ? LIMIT 1
      `).get(`%${cleanFilename}%`) as any;
      if (recap && recap.spoken_text_telugu) {
        textToSpeak = recap.spoken_text_telugu;
      }
    }

    // C. Check calls table
    if (!textToSpeak) {
      const call = db.prepare(`
        SELECT * FROM calls WHERE filename = ? OR audio_url LIKE ? OR id = ? LIMIT 1
      `).get(cleanFilename, `%${cleanFilename}%`, cleanFilename.replace(/\.wav$/, "")) as any;
      if (call && call.transcript) {
        textToSpeak = call.transcript;
      }
    }

    // D. Default fallback spoken text if not matching any DB record
    if (!textToSpeak) {
      textToSpeak = `నమస్కారం, నేను ${company} నుండి ${voiceDef.name} మాట్లాడుతున్నాను. మీ ఎంక్వైరీ వివరాలు ఇక్కడ ఉన్నాయి. ధన్యవాదాలు.`;
    }

    // Clean text
    textToSpeak = textToSpeak.replace(/^["']|["']$/g, "").replace(/\s*\([^)]*\)/g, "").trim();

    // Synthesize authentic speech using Gnani Timbre v3.0
    const result = await synthesizeSpeech(textToSpeak, {
      voice: voiceDef.id,
      model: voiceDef.model,
      language: synthLang,
    });

    // Check if file was written to disk by synthesizeSpeech
    const generatedPath = path.join(process.cwd(), "public", result.audioUrl.replace(/^\//, ""));
    if (fs.existsSync(generatedPath)) {
      // Also copy or save to requested cleanFilename if different so next request hits cache
      if (generatedPath !== filePath) {
        try { fs.copyFileSync(generatedPath, filePath); } catch {}
      }
      const buffer = fs.readFileSync(generatedPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Fallback: If for any reason filesystem writing failed, return 404
    return new NextResponse("Audio file not found", { status: 404 });
  } catch (err: any) {
    console.error("Audio streaming error:", err);
    return new NextResponse(`Audio error: ${err.message}`, { status: 500 });
  }
}
