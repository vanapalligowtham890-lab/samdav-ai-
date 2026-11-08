import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { execFile } from "child_process";
import { promisify } from "util";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { synthesizeSpeech } from "../lib/gnani";
import { applyPhoneLineEffect } from "../lib/audio";

const execFileAsync = promisify(execFile);

function getFfmpegPath(): string {
  const envPath = process.env.FFMPEG_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const wingetPath = "C:\\Users\\vanap\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe";
  if (fs.existsSync(wingetPath)) return wingetPath;

  return "ffmpeg";
}

const CALLS_TO_GENERATE = [
  {
    id: "demo_call_2",
    title: "Vijetha Academy Coaching",
    lines: [
      { speaker: "Counselor", voice: "Lakshmi", text: "హలో, విజేత అకాడమీ అడ్మిషన్స్ డెస్క్. చెప్పండి అండి." },
      { speaker: "Suresh", voice: "Shubham", text: "మేడం, నా కొడుకు టెన్త్ క్లాస్ కంప్లీట్ చేశాడు. ఇంటర్మీడియట్ తో పాటు JEE మెయిన్స్ కోచింగ్ ఫీజు ఎంత ఉంటుంది?" },
      { speaker: "Counselor", voice: "Lakshmi", text: "సురేష్ గారు, మన దగ్గర టూ ఇయర్ ఇంటిగ్రేటెడ్ బ్యాచ్ ఉంది. మొత్తం ఫీజు లక్ష ఇరవై వేల రూపాయలు. స్కాలర్‌షిప్ టెస్ట్ రాస్తే 25% discount వస్తుంది." },
      { speaker: "Suresh", voice: "Shubham", text: "ఫీజు కొంచెం ఎక్కువగానే ఉంది కానీ క్వాలిటీ ముఖ్యం. టెస్ట్ డేట్ ఎప్పుడు మేడం?" },
      { speaker: "Counselor", voice: "Lakshmi", text: "ఈ ఆదివారం ఉదయం 10 గంటలకి అండి. మీ వాట్సాప్‌కి సిలబస్ డీటెయిల్స్ పంపుతున్నాను." },
      { speaker: "Suresh", voice: "Shubham", text: "సరే మేడం, శుక్రవారం లోపు రిజిస్ట్రేషన్ చేయిస్తాను. థాంక్యూ." },
    ]
  },
  {
    id: "demo_call_3",
    title: "Sri Sai Properties Real Estate",
    lines: [
      { speaker: "Agent", voice: "Avinash", text: "హలో అండి, శ్రీ సాయి ప్రాపర్టీస్ నుండి వెంకటేష్ మాట్లాడుతున్నాను." },
      { speaker: "Anand", voice: "Devansh", text: "నమస్తే వెంకటేష్ గారు, విజయవాడ హైవే దగ్గర CRDA అప్రూవ్డ్ ఓపెన్ ప్లాట్స్ ఉన్నాయని చూశాను. Sq yard ప్రైస్ ఎంత నడుస్తోంది?" },
      { speaker: "Agent", voice: "Avinash", text: "అవునండి ఆనంద్ గారు, హైవే కి 500 మీటర్ల దూరంలో ప్లాట్స్ ఉన్నాయి. గజం ధర ₹18,000. బ్యాంక్ లోన్ కూడా 70% వస్తుంది." },
      { speaker: "Buyer", voice: "Devansh", text: "నా బడ్జెట్ మొత్తం ₹25 లక్షల లోపు ఉండాలి. వీకెండ్ లో సైట్ విజిట్ చేయొచ్చా?" },
      { speaker: "Agent", voice: "Avinash", text: "ఖచ్చితంగా శనివారం ఉదయం 10 గంటలకి క్యాబ్ పంపిస్తాను. సైట్ చూసిన తర్వాత నిర్ణయం తీసుకోవచ్చు." },
      { speaker: "Buyer", voice: "Devansh", text: "సరే శనివారం కలుద్దాం, బ్రోచర్ వాట్సాప్ చేయండి." },
    ]
  }
];

async function generateCalls() {
  const tempDir = path.join(process.cwd(), "data", "synthetic-calls", "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const ffmpeg = getFfmpegPath();

  for (const call of CALLS_TO_GENERATE) {
    console.log(`\n=== Generating ${call.title} (${call.id}) ===`);
    const chunkPaths: string[] = [];

    for (const turn of call.lines) {
      console.log(`[${turn.speaker} - ${turn.voice}]: ${turn.text}`);
      const res = await synthesizeSpeech(turn.text, {
        voice: turn.voice,
        model: "timbre-v3.0",
        language: "te-IN",
        speed: 1.0,
      });
      const diskPath = path.join(process.cwd(), "public", res.audioUrl);
      chunkPaths.push(diskPath);
    }

    const listFile = path.join(tempDir, `${call.id}_concat.txt`);
    const listContent = chunkPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    fs.writeFileSync(listFile, listContent);

    const rawCombined = path.join(tempDir, `${call.id}_raw.wav`);
    const finalPublicPath = path.join(process.cwd(), "public", "audio", `${call.id}.wav`);
    const finalDataPath = path.join(process.cwd(), "data", "synthetic-calls", `${call.id}.wav`);

    await execFileAsync(ffmpeg, ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", rawCombined]);
    console.log(`Applying phone line filter to ${call.id}...`);
    await applyPhoneLineEffect(rawCombined, finalPublicPath);
    fs.copyFileSync(finalPublicPath, finalDataPath);
    console.log(`✓ Completed: ${finalPublicPath}`);
  }

  console.log("\nAll requested synthetic multi-voice calls generated successfully!");
}

generateCalls().catch(console.error);
