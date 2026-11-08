import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const execFileAsync = promisify(execFile);

// Candidate ffmpeg binary paths
function getFfmpegPath(): string {
  const envPath = process.env.FFMPEG_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const wingetPath = "C:\\Users\\vanap\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe";
  if (fs.existsSync(wingetPath)) return wingetPath;

  return "ffmpeg";
}

function getFfprobePath(): string {
  const envPath = process.env.FFPROBE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const wingetProbe = "C:\\Users\\vanap\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe";
  if (fs.existsSync(wingetProbe)) return wingetProbe;

  return "ffprobe";
}

/**
 * Compute SHA-256 hash of a file for caching.
 */
export function computeFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

/**
 * Compute SHA-256 hash of a string.
 */
export function computeStringHash(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

/**
 * Get duration of an audio file in seconds.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  const ffprobe = getFfprobePath();
  try {
    const { stdout } = await execFileAsync(ffprobe, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath
    ]);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch (err) {
    console.warn("ffprobe duration check failed, fallback to file size estimate:", err);
    return 30; // fallback default
  }
}

/**
 * Splits audio file into chunks <= maxDurationSeconds if audio exceeds that duration.
 * Prisma REST API maximum audio length is 30s (we use chunk length 28s).
 */
export async function splitAudioIfNecessary(filePath: string, maxDurationSec: number = 28): Promise<string[]> {
  const duration = await getAudioDuration(filePath);
  if (duration <= maxDurationSec) {
    return [filePath];
  }

  const ffmpeg = getFfmpegPath();
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const outputPattern = path.join(dir, `${baseName}_part_%03d${ext}`);

  // ffmpeg -i input.wav -f segment -segment_time 28 -c copy output_%03d.wav
  await execFileAsync(ffmpeg, [
    "-y",
    "-i", filePath,
    "-f", "segment",
    "-segment_time", maxDurationSec.toString(),
    "-c", "copy",
    outputPattern
  ]);

  // Find all generated parts
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(`${baseName}_part_`) && f.endsWith(ext))
    .sort()
    .map(f => path.join(dir, f));

  return files.length > 0 ? files : [filePath];
}

/**
 * Simulates a realistic phone line audio effect for synthetic calls:
 * - Bandpass filter: 300 Hz to 3400 Hz (standard POTS telephony frequency response)
 * - Mild dynamic compression and telephonic coloration
 */
export async function applyPhoneLineEffect(inputPath: string, outputPath: string): Promise<void> {
  const ffmpeg = getFfmpegPath();
  
  // Bandpass filter: highpass 300Hz, lowpass 3400Hz, mild compression
  const filter = "highpass=f=300,lowpass=f=3400,acompressor=threshold=-18dB:ratio=4:attack=20:release=100";

  await execFileAsync(ffmpeg, [
    "-y",
    "-i", inputPath,
    "-af", filter,
    "-ar", "16000",
    outputPath
  ]);
}
