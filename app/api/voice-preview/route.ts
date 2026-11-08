import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/gnani";
import { ALL_VOICES } from "@/lib/voice-catalog";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { voice = "Shivani", text, language = "te-IN", model = "timbre-v3.0" } = body;

    const voiceDef = ALL_VOICES.find(v => v.id === voice);
    const spokenText = text || voiceDef?.sampleText || "నమస్కారం, ఇది జ్ఞాని వాయిస్ ప్రివ్యూ.";

    const result = await synthesizeSpeech(spokenText, {
      voice,
      model: voiceDef?.model || model,
      language: voiceDef?.language || language,
      speed: 1.0,
    });

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      voice,
      text: spokenText,
      cached: result.cached,
    });
  } catch (error: any) {
    console.error("Voice preview error:", error);
    return NextResponse.json({ 
      success: true, 
      audioUrl: "/audio/sample_recap.wav",
      fallback: true,
    });
  }
}

