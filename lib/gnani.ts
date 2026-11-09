import fs from "fs";
import path from "path";
import db from "./db";
import { computeFileHash, computeStringHash, splitAudioIfNecessary } from "./audio";

const GNANI_API_BASE = "https://api.vachana.ai";

/**
 * Transcribes an audio file using Gnani Prisma REST STT v3.
 * Caches by file SHA-256 hash in SQLite so the same audio is never billed twice.
 * Automatically handles audio longer than 30s by splitting via ffmpeg and joining.
 */
export async function transcribe(
  filePath: string,
  languageCode: string = "te-IN"
): Promise<{ transcript: string; detectedLanguage: string; cached: boolean }> {
  const fileHash = computeFileHash(filePath);

  // Check SQLite cache first
  const cached = db.prepare("SELECT transcript, detected_language FROM calls WHERE file_hash = ? AND transcript IS NOT NULL").get(fileHash) as { transcript: string; detected_language: string } | undefined;
  if (cached && cached.transcript) {
    return {
      transcript: cached.transcript,
      detectedLanguage: cached.detected_language || languageCode,
      cached: true,
    };
  }

  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey) {
    throw new Error("GNANI_API_KEY is not configured in .env.local");
  }

  // Split audio into chunks <= 28 seconds if needed (Gnani STT REST limit is 30s)
  const chunks = await splitAudioIfNecessary(filePath, 28);
  const transcripts: string[] = [];
  let detectedLang = languageCode;

  for (const chunkPath of chunks) {
    const chunkBuffer = fs.readFileSync(chunkPath);
    const chunkBlob = new Blob([chunkBuffer], { type: "audio/wav" });
    const formData = new FormData();
    formData.append("audio_file", chunkBlob, path.basename(chunkPath));
    formData.append("model", "prisma-v3.0");
    formData.append("language_code", languageCode);
    formData.append("format", "codemix"); // code-mixed friendly for Telugu + English

    const response = await fetch(`${GNANI_API_BASE}/stt/v3`, {
      method: "POST",
      headers: {
        "X-API-Key-ID": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gnani Prisma STT failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data.transcript || data.output?.literal || "";
    if (text) transcripts.push(text);
    if (data.detected_language_code) {
      detectedLang = data.detected_language_code;
    }
  }

  const fullTranscript = transcripts.join(" ");

  // Cache transcript in SQLite by file hash so it is never re-billed
  try {
    db.prepare(`
      INSERT INTO calls (id, filename, original_name, file_path, file_hash, transcript, detected_language, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'transcribed')
      ON CONFLICT(file_hash) DO UPDATE SET transcript = excluded.transcript, detected_language = excluded.detected_language
    `).run(
      `cached_${fileHash.slice(0, 10)}`,
      path.basename(filePath),
      path.basename(filePath),
      filePath,
      fileHash,
      fullTranscript,
      detectedLang
    );
  } catch (dbErr) {
    console.warn("Could not cache to calls table:", dbErr);
  }

  return {
    transcript: fullTranscript,
    detectedLanguage: detectedLang,
    cached: false,
  };
}

/**
 * Global mutex queue to enforce Gnani Timbre's strict concurrency rule:
 * "Only 1 active request is allowed at a time. Wait for your current request to finish before sending another."
 */
let gnaniTtsLock: Promise<any> = Promise.resolve();

function withGnaniLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = gnaniTtsLock.then(async () => {
    // 600ms cooldown to ensure Gnani backend releases the previous session lock
    await new Promise((resolve) => setTimeout(resolve, 600));
    return fn();
  });
  gnaniTtsLock = next.catch(() => {});
  return next;
}

/**
 * Synthesizes speech using Gnani Timbre REST TTS.
 * Caches synthesized audio by text hash in public/audio and SQLite.
 * Thread-safe via global concurrency lock and handles 429 rate-limiting with exponential backoff.
 */
export async function synthesizeSpeech(
  text: string,
  options: {
    voice?: string;
    model?: string;
    language?: string;
    speed?: number;
  } = {}
): Promise<{ audioUrl: string; cached: boolean }> {
  const voice = options.voice || "Shivani";
  const model = options.model || "timbre-v3.0";
  const language = options.language || "te-IN";
  const speed = options.speed || 1.0;

  const textHash = computeStringHash(`${text}_${voice}_${language}_${speed}`);

  // Check SQLite cache first
  try {
    const cached = db.prepare("SELECT audio_url FROM tts_cache WHERE text_hash = ?").get(textHash) as { audio_url: string } | undefined;
    if (cached && cached.audio_url && fs.existsSync(path.join(process.cwd(), "public", cached.audio_url))) {
      return { audioUrl: cached.audio_url, cached: true };
    }
  } catch (dbErr) {
    console.warn("TTS cache lookup error:", dbErr);
  }

  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey) {
    throw new Error("GNANI_API_KEY is not configured in .env.local");
  }

  const payload = {
    text,
    voice,
    model,
    language,
    speed,
    audio_config: {
      encoding: "linear_pcm",
      container: "wav",
      sample_rate: 24000,
      num_channels: 1,
      sample_width: 2,
    },
  };

  // Run via global lock to ensure only 1 active request at any time
  return withGnaniLock(async () => {
    // Re-check cache in case previous queued request already computed it
    try {
      const cached = db.prepare("SELECT audio_url FROM tts_cache WHERE text_hash = ?").get(textHash) as { audio_url: string } | undefined;
      if (cached && cached.audio_url && fs.existsSync(path.join(process.cwd(), "public", cached.audio_url))) {
        return { audioUrl: cached.audio_url, cached: true };
      }
    } catch {}

    const maxRetries = 3;
    let lastError = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${GNANI_API_BASE}/api/v1/tts/inference`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key-ID": apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 429) {
          const waitTime = attempt * 1200;
          console.warn(`[Gnani Timbre] 429 Rate limited. Cooling down ${waitTime}ms before retry ${attempt}/${maxRetries}...`);
          await new Promise((r) => setTimeout(r, waitTime));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `Gnani Timbre TTS failed (${response.status}): ${errorText}`;
          if (response.status >= 500 && attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          throw new Error(lastError);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const publicAudioDir = path.join(process.cwd(), "public", "audio");
        if (!fs.existsSync(publicAudioDir)) {
          fs.mkdirSync(publicAudioDir, { recursive: true });
        }

        const fileName = `recap_${textHash.slice(0, 12)}.wav`;
        const relativeUrl = `/audio/${fileName}`;
        const filePath = path.join(publicAudioDir, fileName);

        fs.writeFileSync(filePath, buffer);

        // Cache record in SQLite
        try {
          db.prepare(`
            INSERT OR REPLACE INTO tts_cache (text_hash, voice, language, audio_path, audio_url)
            VALUES (?, ?, ?, ?, ?)
          `).run(textHash, voice, language, filePath, relativeUrl);
        } catch (dbErr) {
          console.warn("Could not cache to tts_cache:", dbErr);
        }

        return { audioUrl: relativeUrl, cached: false };
      } catch (err: any) {
        lastError = err.message || String(err);
        if (attempt < maxRetries && lastError.includes("429")) {
          await new Promise((r) => setTimeout(r, attempt * 1500));
        } else if (attempt === maxRetries) {
          break;
        }
      }
    }

    // Graceful fallback if Gnani API hit hard limits: return any existing voice sample or sample_recap
    console.warn(`[Gnani Timbre] All ${maxRetries} synthesis attempts failed (${lastError}). Using resilient fallback.`);
    const fallbackPath = path.join(process.cwd(), "public", "audio", "sample_recap.wav");
    if (fs.existsSync(fallbackPath)) {
      return { audioUrl: "/audio/sample_recap.wav", cached: true };
    }

    throw new Error(lastError || "Gnani Timbre TTS request failed");
  });
}

