import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { transcribe } from "../lib/gnani";

async function main() {
  console.log("=== Gnani Prisma STT Test Script ===");
  const sampleAudio = process.argv[2] || path.join(process.cwd(), "public", "audio", "demo_call_1.wav");

  if (!fs.existsSync(sampleAudio)) {
    console.error(`Audio file not found: ${sampleAudio}`);
    process.exit(1);
  }

  console.log(`Input File: ${sampleAudio}`);
  console.log(`Starting transcription via Gnani Prisma (Telugu: te-IN)...`);

  const startTime = Date.now();
  try {
    const result = await transcribe(sampleAudio, "te-IN");
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n--- RESULT ---");
    console.log(`Time taken: ${duration}s`);
    console.log(`Cached: ${result.cached}`);
    console.log(`Detected Language: ${result.detectedLanguage}`);
    console.log(`Transcript:\n"${result.transcript}"`);
  } catch (err: any) {
    console.error("\nTranscription error:", err.message);
    if (!process.env.GNANI_API_KEY) {
      console.log("Tip: Add GNANI_API_KEY to .env.local to transcribe live audio with Gnani Prisma.");
    }
  }
}

main();

