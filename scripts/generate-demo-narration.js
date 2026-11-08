const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GNANI_API_KEY;
if (!apiKey) {
  console.error("Missing GNANI_API_KEY");
  process.exit(1);
}

const parts = [
  {
    name: "part_1",
    text: "Hello judges! My name is Gowtham, and this is Vaani Recap — an autonomous, multilingual AI sales and lead briefing agent built for over 63 million Indian small businesses for the Gnani AI Great Indian AI Internship Challenge. Local business owners like clinic operators, coaching institutes, and real estate consultants cannot afford dedicated telecallers, and they lose hot leads right after calls end. Vaani Recap automates outbound calling, real-time lead extraction, and delivers a spoken evening brief under 60 words."
  },
  {
    name: "part_2",
    text: "Here is the live Dashboard. Notice at the top, outbound calls are tied to the business owner's verified forwarding phone number, so prospects always see a trusted local caller ID. Owners can upload prospect lists directly via Excel or CSV. The dashboard tracks six live metrics: Calls Ongoing, Answered, Closed, Rejected, Leads Won, and Leads Lost. When I click Dial Next Prospect, the AI agent autonomously initiates the cold call using our tailored sector script and speaks directly with the customer."
  },
  {
    name: "part_3",
    text: "Let's listen to the generated call. Every conversation is synthesized using Gnani Timbre v3.0. Notice that unlike basic demos that cut off after 5 seconds, Vaani Recap synthesizes the complete, natural conversation — greeting, pitch, customer objection, and closing — without robotic repetition. Simultaneously, Gnani Prisma v3.0 STT transcribes the call with high phonetic accuracy, highlighting the customer's exact intent and budget."
  },
  {
    name: "part_4",
    text: "At the end of a busy day, small business owners don't want to read raw spreadsheets. Vaani Recap generates an Evening Spoken Brief under 60 words using Gnani Timbre, highlighting today's won leads and critical callbacks. Clicking on any prospect opens their structured Lead Card: automatically extracting customer need, budget, exact objection quotes, and a pre-drafted WhatsApp follow-up message ready to send with one click."
  },
  {
    name: "part_5",
    text: "In Settings, Vaani Recap supports true regional commerce across 10 Indian language modes — from Pure Telugu and High-English Telugu to Hinglish, Pure Hindi, Tamil, Marathi, Bengali, and Indian Corporate English. We provide over 16 verified Gnani Timbre voices matching local regional dialects. All audio hashes are cached in SQLite to guarantee zero redundant API billing. Vaani Recap brings enterprise-grade voice AI to India's small businesses by combining Gnani Prisma STT and Gnani Timbre TTS with intelligent lead workflows. Thank you for your time!"
  }
];

async function run() {
  const audioBuffers = [];

  for (let i = 0; i < parts.length; i++) {
    const item = parts[i];
    console.log(`Synthesizing ${item.name}...`);

    const res = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key-ID": apiKey
      },
      body: JSON.stringify({
        text: item.text,
        voice: "Riyaa",
        model: "timbre-v3.0",
        language: "en-IN",
        audio_config: {
          encoding: "linear_pcm",
          container: "wav",
          sample_rate: 24000,
          num_channels: 1,
          sample_width: 2
        }
      })
    });

    if (!res.ok) {
      console.error(`Failed ${item.name}:`, res.status, await res.text());
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(__dirname, "..", "public", "audio", `demo_voiceover_${item.name}.wav`);
    fs.writeFileSync(filePath, buf);
    console.log(`Saved ${filePath} (${buf.length} bytes)`);
    audioBuffers.push(buf);
  }

  // Concatenate PCM WAV chunks into a single continuous narration file
  if (audioBuffers.length > 0) {
    const pcmChunks = [];
    for (let i = 0; i < audioBuffers.length; i++) {
      const b = audioBuffers[i];
      // strip 44-byte WAV header and take raw PCM data
      pcmChunks.push(b.subarray(44));
      // add 1.2s silence between sections (24000 samples/sec * 2 bytes * 1.2s = ~57600 bytes)
      if (i < audioBuffers.length - 1) {
        pcmChunks.push(Buffer.alloc(57600));
      }
    }

    const totalPcmLength = pcmChunks.reduce((acc, c) => acc + c.length, 0);
    const firstHeader = Buffer.from(audioBuffers[0].subarray(0, 44));
    // update RIFF chunk size and data chunk size
    firstHeader.writeUInt32LE(36 + totalPcmLength, 4);
    firstHeader.writeUInt32LE(totalPcmLength, 40);

    const fullBuffer = Buffer.concat([firstHeader, ...pcmChunks]);
    const fullPath = path.join(__dirname, "..", "public", "audio", "demo_video_full_narration.wav");
    fs.writeFileSync(fullPath, fullBuffer);
    console.log(`Successfully generated full continuous narration: ${fullPath} (${fullBuffer.length} bytes)`);
  }
}

run().catch(console.error);

