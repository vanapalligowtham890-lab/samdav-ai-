import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import db from "../lib/db";
import { SYNTHETIC_CALLS } from "../lib/synthetic-data";
import { computeStringHash, computeFileHash } from "../lib/audio";

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
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.sin(2 * Math.PI * 440 * t) * 0.15 + Math.sin(2 * Math.PI * 350 * t) * 0.1;
    const intVal = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(intVal, offset);
    offset += 2;
  }

  fs.writeFileSync(outputPath, buffer);
}

async function runSeed() {
  console.log("=== Seeding Realistic Synthetic Calls into SQLite ===");

  const dataDir = path.join(process.cwd(), "data", "synthetic-calls");
  const publicAudioDir = path.join(process.cwd(), "public", "audio");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicAudioDir)) fs.mkdirSync(publicAudioDir, { recursive: true });

  for (const item of SYNTHETIC_CALLS) {
    const audioFileName = `${item.id}.wav`;
    const audioPath = path.join(dataDir, audioFileName);
    const publicPath = path.join(publicAudioDir, audioFileName);

    if (!fs.existsSync(publicPath)) {
      createCleanBeepWav(publicPath, item.duration);
    }
    if (!fs.existsSync(audioPath)) {
      fs.copyFileSync(publicPath, audioPath);
    }

    const scriptPath = path.join(dataDir, `${item.id}.txt`);
    fs.writeFileSync(scriptPath, item.transcript, "utf8");

    const fileHash = computeFileHash(publicPath);

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

    console.log(`✓ Seeded ${item.business} -> ${item.lead.customerName} (${item.duration}s)`);
  }

  console.log("\nAll 6 synthetic Telugu small-business calls registered in database!");
}

runSeed();
