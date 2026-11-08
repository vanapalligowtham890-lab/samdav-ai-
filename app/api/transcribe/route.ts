import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { transcribe } from "@/lib/gnani";
import { computeFileHash, getAudioDuration } from "@/lib/audio";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const languageCode = (formData.get("language_code") as string) || "te-IN";

    if (!file) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "data", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name || "upload.wav";
    const ext = path.extname(originalName) || ".wav";
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const savedFilename = `${callId}${ext}`;
    const filePath = path.join(uploadDir, savedFilename);

    fs.writeFileSync(filePath, buffer);

    const fileHash = computeFileHash(filePath);
    const duration = await getAudioDuration(filePath);

    // Save call record in database
    db.prepare(`
      INSERT INTO calls (id, filename, original_name, file_path, file_hash, duration_seconds, language_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')
    `).run(callId, savedFilename, originalName, filePath, fileHash, duration, languageCode);

    // Transcribe
    const { transcript, detectedLanguage, cached } = await transcribe(filePath, languageCode);

    // Update call record
    db.prepare(`
      UPDATE calls
      SET status = 'transcribed', transcript = ?, detected_language = ?
      WHERE id = ?
    `).run(transcript, detectedLanguage, callId);

    return NextResponse.json({
      success: true,
      callId,
      fileHash,
      transcript,
      detectedLanguage,
      duration,
      cached,
    });
  } catch (error: any) {
    console.error("Transcribe API Error:", error);
    return NextResponse.json({ error: error.message || "Transcription failed" }, { status: 500 });
  }
}

