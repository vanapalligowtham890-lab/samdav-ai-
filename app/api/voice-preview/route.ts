import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { synthesizeSpeech } from "@/lib/gnani";
import { ALL_VOICES } from "@/lib/voice-catalog";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { voice = "Shivani", text, language = "te-IN", model = "timbre-v3.0" } = body;

    const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === voice.toLowerCase()) || ALL_VOICES[0];
    const spokenText = text || voiceDef?.sampleText || "నమస్కారం, ఇది జ్ఞాని వాయిస్ ప్రివ్యూ.";

    // 1. Instant zero-latency pre-rendered voice sample check
    const staticVoiceFile = `/audio/voice_${voiceDef.id.toLowerCase()}.wav`;
    const staticVoiceDiskPath = path.join(process.cwd(), "public", "audio", `voice_${voiceDef.id.toLowerCase()}.wav`);
    if (fs.existsSync(staticVoiceDiskPath) && fs.statSync(staticVoiceDiskPath).size > 10000) {
      return NextResponse.json({
        success: true,
        audioUrl: staticVoiceFile,
        voice: voiceDef.id,
        text: spokenText,
        cached: true,
        instant: true,
      });
    }

    const result = await synthesizeSpeech(spokenText, {
      voice: voiceDef.id,
      model: voiceDef?.model || model,
      language: voiceDef?.language || language,
      speed: 1.0,
    });

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      voice: voiceDef.id,
      text: spokenText,
      cached: result.cached,
    });
  } catch (error: any) {
    console.error("Voice preview error:", error);
    return NextResponse.json({ 
      success: true, 
      audioUrl: "/audio/voice_shivani.wav",
      fallback: true,
    });
  }
}

