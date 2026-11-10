import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { ALL_VOICES } from "@/lib/voice-catalog";
import { synthesizeSpeech, transcribe } from "@/lib/gnani";
import { generateLiveAgentTurnReply, extractLeadFromTranscript } from "@/lib/llm";
import { synthesizeDialogueAudio } from "@/lib/dialogue-synthesizer";
import { convertToStandardWav } from "@/lib/audio";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Live Turn (Microphone Audio Upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File | null;
      const historyJson = (formData.get("history") as string) || "[]";
      const customPhone = (formData.get("phoneNumber") as string) || "+91 98765 43210";
      const directText = (formData.get("text") as string) || "";

      let history: { speaker: "agent" | "customer"; text: string }[] = [];
      try { history = JSON.parse(historyJson); } catch {}

      // Load Business & Voice Settings
      const savedVoice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
      const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === savedVoice.toLowerCase()) || ALL_VOICES[0];
      const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Smile Dental Care";
      const businessType = (db.prepare("SELECT value FROM settings WHERE key = 'business_type'").get() as any)?.value || "Healthcare & Dental Care";
      const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
      const language = savedTimbreLang || voiceDef.language || "te-IN";

      let customerText = directText.trim();

      // If no direct text, transcribe user microphone audio via Gnani Prisma v3.0
      if (!customerText && audioFile) {
        const uploadDir = path.join(process.cwd(), "data", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const tempFilename = `live_turn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.webm`;
        const tempPath = path.join(uploadDir, tempFilename);
        const wavPath = tempPath.replace(/\.webm$/, ".wav");
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        fs.writeFileSync(tempPath, buffer);

        // Convert browser WebM audio to standard 16kHz PCM WAV for Gnani Prisma STT
        await convertToStandardWav(tempPath, wavPath);
        const targetPath = fs.existsSync(wavPath) ? wavPath : tempPath;

        try {
          const prismaRes = await transcribe(targetPath, language);
          customerText = prismaRes.transcript.trim();
        } catch (sttErr: any) {
          console.warn("Prisma live STT error:", sttErr);
        }
      }

      if (!customerText) {
        // Fallback prompt if silent/muffled
        const politeAsk = language.startsWith("hi")
          ? "माफ़ कीजिए, आपकी आवाज़ स्पष्ट नहीं आई। क्या आप दोहरा सकते हैं?"
          : language.startsWith("en")
          ? "Pardon me, could you please repeat that? I could not hear clearly."
          : "క్షమించండి అండి, మీ మాట స్పష్టంగా వినిపించలేదు. దయచేసి మళ్ళీ చెప్పగలరా?";

        const askAudio = await synthesizeSpeech(politeAsk, {
          voice: voiceDef.id,
          language,
          model: voiceDef.model,
        });

        return NextResponse.json({
          success: true,
          customerText: "(Silence / Ambient Audio)",
          agentReply: politeAsk,
          audioUrl: askAudio.audioUrl,
        });
      }

      // B. Generate Intelligent Contextual Response via Gemini 2.5 Flash
      const agentReply = await generateLiveAgentTurnReply({
        companyName: company,
        businessType,
        agentVoiceName: voiceDef.name,
        language,
        conversationHistory: history,
        customerSpeechText: customerText,
      });

      // C. Synthesize Agent Spoken Audio via Gnani Timbre v3.0
      const synthRes = await synthesizeSpeech(agentReply, {
        voice: voiceDef.id,
        language,
        model: voiceDef.model,
      });

      return NextResponse.json({
        success: true,
        customerText,
        agentReply,
        audioUrl: synthRes.audioUrl,
      });
    }

    // 2. JSON Actions: "start" or "end"
    const body = await req.json();
    const { action = "start" } = body;

    const savedVoice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === savedVoice.toLowerCase()) || ALL_VOICES[0];
    const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Smile Dental Care";
    const businessType = (db.prepare("SELECT value FROM settings WHERE key = 'business_type'").get() as any)?.value || "Healthcare & Dental Care";
    const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
    const language = savedTimbreLang || voiceDef.language || "te-IN";

    // START CALL: Greeting line synthesized by Gnani Timbre
    if (action === "start") {
      const sessionId = `live_call_${Date.now()}`;
      const isAditya = company.toLowerCase().includes("aditya") || businessType.toLowerCase().includes("aditya") || businessType.toLowerCase().includes("btech");
      
      let greeting = isAditya
        ? `నమస్కారం! ఆదిత్య యూనివర్సిటీ 24/7 అడ్మిషన్ డెస్క్‌కి స్వాగతం. నేను ${voiceDef.name} మాట్లాడుతున్నాను. 4-సంవత్సరాల B.Tech కోర్సులు, ఫీజులు లేదా హాస్టల్ వివరాల గురించి మీకు ఎలా సహాయపడగలను?`
        : `నమస్కారం అండి! నేను ${company} నుండి ${voiceDef.name} మాట్లాడుతున్నాను. మీకు ఎలా సహాయపడగలను?`;

      if (language.startsWith("hi-en") || language === "hi-en") {
        greeting = isAditya
          ? `Namaste! Aditya University 24/7 Admissions Desk me aapka swagat hai. Mai ${voiceDef.name} bol rahi hu. B.Tech courses aur hostel ke baare me mai aapki kya madad kar sakti hu?`
          : `Namaste ji! Mai ${company} se ${voiceDef.name} bol rahi hu. Mai aapki kya madad kar sakti hu?`;
      } else if (language.startsWith("hi")) {
        greeting = isAditya
          ? `नमस्ते! आदित्य यूनिवर्सिटी 24/7 एडमिशन डेस्क में आपका स्वागत है। मैं ${voiceDef.name} बात कर रही हूँ। 4-वर्षीय बीटेक पाठ्यक्रमों और छात्रावास के बारे में मैं आपकी क्या सहायता कर सकती हूँ?`
          : `नमस्ते! मैं ${company} से ${voiceDef.name} बात कर रही हूँ। मैं आपकी किस प्रकार सहायता कर सकती हूँ?`;
      } else if (language.startsWith("en")) {
        greeting = isAditya
          ? `Welcome to Aditya University 24/7 Admissions & Parent Desk! This is ${voiceDef.name}. How can I assist you with our 4-year B.Tech courses, scholarships, or campus facilities?`
          : `Hello and welcome! This is ${voiceDef.name} from ${company}. How may I help you today?`;
      } else if (language.startsWith("ta")) {
        greeting = `வணக்கம்! நான் ${company} நிறுவனத்திலிருந்து ${voiceDef.name} பேசுகிறேன். உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?`;
      }

      const synthRes = await synthesizeSpeech(greeting, {
        voice: voiceDef.id,
        language,
        model: voiceDef.model,
      });

      return NextResponse.json({
        success: true,
        sessionId,
        greeting,
        audioUrl: synthRes.audioUrl,
        agentVoice: voiceDef.name,
        companyName: company,
        businessType,
      });
    }

    // END CALL: Save entire conversation into calls and extract lead card
    if (action === "end") {
      const { sessionId, turns = [], customerPhone = "+91 98490 22334" } = body;
      const callId = sessionId || `call_${Date.now()}`;

      // Build full transcript
      const transcriptLines = (turns as { speaker: "agent" | "customer"; text: string }[]).map((t) =>
        t.speaker === "agent" ? `Agent (${voiceDef.name}): "${t.text}"` : `Customer: "${t.text}"`
      );
      const fullTranscript = transcriptLines.join("\n");

      // Extract key quote from customer
      const customerTurns = turns.filter((t: any) => t.speaker === "customer");
      const keyQuote = customerTurns.length > 0 ? customerTurns[customerTurns.length - 1].text : "Live consultation inquiry";

      // Save to SQLite calls table
      const callFilename = `${callId}.wav`;
      const callAudioUrl = `/api/call-audio?prospectId=${callId}`;

      db.prepare(`
        INSERT OR REPLACE INTO calls (
          id, filename, original_name, file_path, file_hash, duration_seconds,
          language_code, status, transcript, detected_language, audio_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)
      `).run(
        callId,
        callFilename,
        `Live AI Call - ${customerPhone}.wav`,
        "",
        `live_hash_${callId}`,
        Math.max(25, turns.length * 12),
        language,
        fullTranscript,
        language,
        callAudioUrl
      );

      // Generate merged two-party audio asynchronously
      synthesizeDialogueAudio({
        transcript: fullTranscript,
        customerName: customerPhone,
        agentVoiceId: voiceDef.id,
        companyName: company,
        languageCode: language,
        prospectId: callId,
      }).then(res => {
        if (res && res.audioUrl) {
          db.prepare("UPDATE calls SET audio_url = ? WHERE id = ?").run(res.audioUrl, callId);
        }
      }).catch(err => console.warn("Background dialogue synthesis for live call:", err));

      // Extract Lead via Gemini into leads table
      let leadId: string | null = null;
      try {
        const lead = await extractLeadFromTranscript(fullTranscript, callId);
        leadId = `lead_${callId}`;
      } catch (leadErr) {
        console.warn("Lead extraction for live call failed:", leadErr);
      }

      return NextResponse.json({
        success: true,
        callId,
        leadId,
        transcript: fullTranscript,
        keyQuote,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Live call route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
