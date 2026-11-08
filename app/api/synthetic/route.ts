import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { computeFileHash } from "@/lib/audio";
import { SYNTHETIC_CALLS } from "@/lib/synthetic-data";

export { SYNTHETIC_CALLS };

export async function POST(req: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), "data", "synthetic-calls");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const publicAudioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(publicAudioDir)) {
      fs.mkdirSync(publicAudioDir, { recursive: true });
    }

    // Seed all 6 calls into SQLite database
    let seededCount = 0;
    for (const item of SYNTHETIC_CALLS) {
      const scriptPath = path.join(dataDir, `${item.id}.txt`);
      fs.writeFileSync(scriptPath, item.transcript, "utf8");

      const audioFileName = `${item.id}.wav`;
      const audioPath = path.join(dataDir, audioFileName);
      const publicPath = path.join(publicAudioDir, audioFileName);

      // Create a lightweight valid WAV placeholder if not yet generated
      if (!fs.existsSync(audioPath) && !fs.existsSync(publicPath)) {
        createCleanBeepWav(publicPath, item.duration);
        fs.copyFileSync(publicPath, audioPath);
      } else if (!fs.existsSync(publicPath) && fs.existsSync(audioPath)) {
        fs.copyFileSync(audioPath, publicPath);
      }

      const fileHash = computeFileHash(publicPath);

      // Insert or ignore into calls table
      db.prepare(`
        INSERT OR REPLACE INTO calls (
          id, filename, original_name, file_path, file_hash, duration_seconds,
          language_code, status, transcript, detected_language
        ) VALUES (?, ?, ?, ?, ?, ?, 'te-IN', 'completed', ?, 'te-IN')
      `).run(
        item.id,
        audioFileName,
        `${item.business} Call.wav`,
        audioPath,
        fileHash,
        item.duration,
        item.transcript
      );

      // Insert or replace lead
      db.prepare(`
        INSERT OR REPLACE INTO leads (
          id, call_id, customer_name, need, budget, objections,
          urgency, next_step, follow_up_date, key_quote, follow_up_message, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
      `).run(
        `lead_${item.id}`,
        item.id,
        item.lead.customerName,
        item.lead.need,
        item.lead.budget,
        JSON.stringify(item.lead.objections),
        item.lead.urgency,
        item.lead.nextStep,
        item.lead.followUpDate,
        item.lead.keyQuote,
        item.lead.followUpMessage
      );

      seededCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${seededCount} realistic small-business Telugu calls into SQLite`,
      calls: SYNTHETIC_CALLS,
    });
  } catch (err: any) {
    console.error("Synthetic seeding error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Creates a valid PCM WAV audio file with gentle ambient tone
 */
function createCleanBeepWav(outputPath: string, durationSec: number) {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const numSamples = Math.min(sampleRate * Math.floor(durationSec), sampleRate * 10);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // subchunk 1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // audio format 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate gentle phone ring & ambient tone
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // 440Hz + 480Hz US ring tone simulation or phone line buzz at low amplitude
    const sampleVal = Math.sin(2 * Math.PI * 440 * t) * 0.15 + Math.sin(2 * Math.PI * 350 * t) * 0.1;
    const intVal = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(intVal, offset);
    offset += 2;
  }

  fs.writeFileSync(outputPath, buffer);
}
