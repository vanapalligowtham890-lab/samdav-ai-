import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { computeFileHash } from "@/lib/audio";
import { SYNTHETIC_CALLS } from "@/lib/synthetic-data";
import { seedSectorCampaign, syncCampaignCallsToDb } from "@/lib/sector-campaigns";


export async function POST(req: NextRequest) {
  try {
    const businessName = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Ishiva digital";
    const businessType = (db.prepare("SELECT value FROM settings WHERE key = 'business_type'").get() as any)?.value || "Digital Marketing & Agency";
    const voice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const language = (db.prepare("SELECT value FROM settings WHERE key = 'language'").get() as any)?.value || "te-en";

    // Preload campaign with authentic Gnani Timbre speech synthesis and sync to calls and leads tables
    const seeded = await seedSectorCampaign(businessName, businessType, voice, language);
    syncCampaignCallsToDb(businessName);

    return NextResponse.json({
      success: true,
      message: `Seeded ${seeded.count} realistic sector calls for ${businessName} with ${voice} audio into SQLite and Firebase`,
      prospects: seeded.prospects,
      metrics: seeded.metrics,
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
