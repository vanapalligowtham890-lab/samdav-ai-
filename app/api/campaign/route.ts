import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import db from "@/lib/db";
import { 
  getCampaignProspects, 
  calculateCampaignMetrics, 
  seedDefaultCampaign, 
  ColdCallProspect 
} from "@/lib/campaign";
import { synthesizeSpeech } from "@/lib/gnani";
import { synthesizeDialogueAudio } from "@/lib/dialogue-synthesizer";
import { ALL_VOICES } from "@/lib/voice-catalog";
import { renderScript, DEFAULT_VIRTUAL_SCRIPTS } from "@/lib/virtual-script";
import { syncRealtimeDb } from "@/lib/firebase";
import { syncCampaignCallsToDb } from "@/lib/sector-campaigns";

export async function GET() {
  try {
    const prospects = getCampaignProspects();
    const metrics = calculateCampaignMetrics(prospects);
    
    // Get forwarding number, voice, company, and sector from settings
    const forwardingNumber = (db.prepare("SELECT value FROM settings WHERE key = 'forwarding_number'").get() as any)?.value || "+91 98765 43210";
    const voice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Ishiva digital";
    const sector = (db.prepare("SELECT value FROM settings WHERE key = 'business_type'").get() as any)?.value || "Digital Marketing & Agency";
    const language = (db.prepare("SELECT value FROM settings WHERE key = 'language'").get() as any)?.value || "te-en";

    // Sync metrics to Firebase Realtime Database in background
    syncRealtimeDb("campaign/metrics", metrics);

    return NextResponse.json({
      success: true,
      metrics,
      prospects,
      forwardingNumber,
      voice,
      company,
      sector,
      language,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // A. Handle Multipart Excel File Upload (.xlsx, .xls, .csv)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const insert = db.prepare(`
        INSERT OR REPLACE INTO cold_call_campaigns (
          id, name, phone, need, notes, call_status, outcome, duration_seconds, transcript, audio_url, key_quote, call_time
        ) VALUES (?, ?, ?, ?, ?, 'queued', 'pending', 0, '', '', '', 'Imported from Excel')
      `);

      let addedCount = 0;
      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        // Support flexible column headers from different Excel templates
        const name = row.Name || row.name || row["Customer Name"] || row["Prospect"] || row["Lead Name"] || `Lead ${i + 1}`;
        const phone = row.Phone || row.phone || row["Phone Number"] || row["Mobile"] || row["Contact"] || "+91 98765 00000";
        const need = row.Need || row.need || row["Service"] || row["Requirement"] || row["Inquiry"] || "Service consultation";
        const notes = row.Notes || row.notes || row["Remarks"] || "Uploaded from Excel";

        const id = `excel_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
        insert.run(id, String(name), String(phone), String(need), String(notes));
        addedCount++;
      }

      const all = getCampaignProspects();
      const metrics = calculateCampaignMetrics(all);

      // Sync to Firebase Realtime Database
      syncRealtimeDb("campaign/prospects", all);
      syncRealtimeDb("campaign/metrics", metrics);

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${addedCount} prospects from ${file.name}`,
        metrics,
        prospects: all,
      });
    }

    // B. Handle JSON Actions (dial, upload, reset)
    const body = await req.json();
    const { action, prospects: customProspects, prospectId, scriptTemplate, voice: overrideVoice } = body;

    if (action === "upload" && Array.isArray(customProspects)) {
      const insert = db.prepare(`
        INSERT OR REPLACE INTO cold_call_campaigns (
          id, name, phone, need, notes, call_status, outcome, duration_seconds, transcript, audio_url, key_quote, call_time
        ) VALUES (?, ?, ?, ?, ?, 'queued', 'pending', 0, '', '', '', 'Custom Upload')
      `);

      for (const p of customProspects) {
        const id = p.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        insert.run(
          id,
          p.name || "Customer",
          p.phone || "+91 98765 00000",
          p.need || "Sales inquiry",
          p.notes || ""
        );
      }

      const all = getCampaignProspects();
      const metrics = calculateCampaignMetrics(all);
      syncRealtimeDb("campaign/prospects", all);
      syncRealtimeDb("campaign/metrics", metrics);

      return NextResponse.json({
        success: true,
        message: `Added ${customProspects.length} prospects to campaign list`,
        metrics,
        prospects: all,
      });
    }

    // Dial action: Autonomous call with Virtual Script & Chosen Voice
    if (action === "dial") {
      let target: ColdCallProspect | undefined;
      if (prospectId) {
        target = db.prepare("SELECT * FROM cold_call_campaigns WHERE id = ?").get(prospectId) as ColdCallProspect;
      } else {
        target = db.prepare("SELECT * FROM cold_call_campaigns WHERE call_status = 'queued' LIMIT 1").get() as ColdCallProspect;
      }

      if (!target) {
        return NextResponse.json({
          success: true,
          message: "All prospects in the current campaign list have already been dialed!",
        });
      }

      // Enforce the user's SELECTED VOICE from settings
      const savedVoice = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
      const chosenVoiceId = overrideVoice || savedVoice;
      const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === chosenVoiceId.toLowerCase()) || ALL_VOICES[0];
      const voice = voiceDef.id;
      const model = voiceDef.model;

      const company = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Ishiva digital";

      // Load active script (dynamically generated by LLM for this business sector) or fallback to High-English Telugu
      let script = scriptTemplate;
      if (!script) {
        const rawActiveScript = (db.prepare("SELECT value FROM settings WHERE key = 'active_script'").get() as any)?.value;
        if (rawActiveScript) {
          try {
            script = JSON.parse(rawActiveScript);
          } catch {}
        }
      }
      if (!script) {
        script = DEFAULT_VIRTUAL_SCRIPTS.telugu_high_english;
      }

      const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;
      const language = savedTimbreLang || script.language || voiceDef.language || "te-IN";

      // Render virtual script opening (clean name, no duplicate parentheses)
      const cleanTargetName = target.name.replace(/\s*\([^)]*\)/g, "").trim();
      const agentOpening = renderScript(
        `${script.greeting} ${script.pitch} ${script.question}`,
        {
          name: cleanTargetName,
          company,
          need: target.need,
        }
      ).replace(/\s*\([^)]*\)/g, "");

      const isWon = Math.random() > 0.3; // 70% win rate
      const outcome = isWon ? "won" : "lost";
      const duration = Math.floor(25 + Math.random() * 25);

      // Language-aware natural customer response without dual parentheses
      let customerReply = "";
      if (language.startsWith("mr")) {
        customerReply = isWon
          ? "नक्कीच! उद्या सकाळी 11 वाजता बोलूया. सर्व माहिती व्हॉट्सअॅपवर पाठवा."
          : "सध्या मला या सेवेची गरज नाही, नंतर पाहू.";
      } else if (language.startsWith("gu")) {
        customerReply = isWon
          ? "ચોક્કસ, કાલે સવારે 11 વાગ્યે વાત કરીએ. વિગતો વોટ્સએપ પર મોકલી આપો."
          : "હમણાં જરૂર નથી, પછી વિચારીશું.";
      } else if (language.startsWith("bn")) {
        customerReply = isWon
          ? "অবশ্যই, কাল সকাল ১১টায় আলোচনা করা যেতে পারে। বিবরণ হোয়াটসঅ্যাপে পাঠান।"
          : "এখন প্রয়োজন নেই, পরে যোগাযোগ করবেন।";
      } else if (language.startsWith("ta")) {
        customerReply = isWon
          ? "நிச்சயமாக, நாளை காலை 11 மணிக்கு பேசலாம். விவரங்களை வாட்ஸ்அப்பில் பகிருங்கள்."
          : "தற்போது எனக்கு நேரம் இல்லை, பிறகு பார்க்கலாம்.";
      } else if (language.startsWith("kn")) {
        customerReply = isWon
          ? "ಖಂಡಿತವಾಗಿ, ನಾಳೆ ಬೆಳಿಗ್ಗೆ 11 ಗಂಟೆಗೆ ವಿವರಗಳನ್ನು ವಾಟ್ಸಾಪ್‌ಗೆ ಕಳುಹಿಸಿ."
          : "ಈಗ ನನಗೆ ಆಸಕ್ತಿಯಿಲ್ಲ, ನಂತರ ನೋಡೋಣ.";
      } else if (language.startsWith("hi-en") || language === "hi-en") {
        customerReply = isWon
          ? "Sure ji, kal 2 baje theek rahega. Aap location aur brochure WhatsApp pe bhej dijiye."
          : "Abhi required nahi hai, baad me dekhenge.";
      } else if (language.startsWith("hi")) {
        customerReply = isWon
          ? "जी बिल्कुल, कल सुबह 11 बजे का समय सही रहेगा। कृपया विवरण व्हाट्सएप पर भेज दें।"
          : "अभी मुझे इसकी आवश्यकता नहीं है, धन्यवाद।";
      } else if (language.startsWith("te")) {
        customerReply = isWon
          ? "Sure అండి! రేపు morning 11 AM కి call లో మాట్లాడదాం, details WhatsApp చేయండి."
          : "ప్రస్తుతానికి requirement లేదు అండి, తర్వాత చూస్తాము. థాంక్యూ.";
      } else {
        // Indian English
        customerReply = isWon
          ? "Sounds good! Please send the location and appointment details on WhatsApp for tomorrow 11 AM."
          : "I am not interested at this moment, thank you.";
      }

      const fullTranscript = `Agent (${voice} · ${voiceDef.languageLabel}): "${agentOpening}"\nProspect (${cleanTargetName}): "${customerReply}"`;
      const keyQuote = customerReply;

      // Synthesize authentic two-party dialogue (Agent Voice + Customer Voice stitched)
      let audioUrl = "";
      try {
        const dialogueRes = await synthesizeDialogueAudio({
          transcript: fullTranscript,
          customerName: cleanTargetName,
          agentVoiceId: voice,
          companyName: company,
          languageCode: language,
          prospectId: target.id,
        });
        audioUrl = dialogueRes.audioUrl;
      } catch (synthErr) {
        console.warn("TTS dialogue synthesis error during dial:", synthErr);
        audioUrl = "";
      }

      db.prepare(`
        UPDATE cold_call_campaigns
        SET 
          call_status = 'closed',
          outcome = ?,
          duration_seconds = ?,
          transcript = ?,
          audio_url = ?,
          key_quote = ?,
          call_time = 'Just now'
        WHERE id = ?
      `).run(outcome, duration, fullTranscript, audioUrl, keyQuote, target.id);

      // Sync freshly dialed call directly into primary calls and leads tables
      syncCampaignCallsToDb(company, language);

      const all = getCampaignProspects();
      const metrics = calculateCampaignMetrics(all);

      // Sync updated campaign to Firebase Realtime Database
      syncRealtimeDb("campaign/prospects", all);
      syncRealtimeDb("campaign/metrics", metrics);

      return NextResponse.json({
        success: true,
        message: `Agent finished call to ${target.name} (${outcome.toUpperCase()}) using voice ${voice} (${voiceDef.languageLabel})`,
        metrics,
        prospects: all,
        calledProspect: {
          ...target,
          call_status: "closed",
          outcome,
          transcript: fullTranscript,
          audio_url: audioUrl,
        }
      });
    }

    if (action === "reset") {
      db.prepare("DELETE FROM cold_call_campaigns").run();
      seedDefaultCampaign();
      const all = getCampaignProspects();
      const metrics = calculateCampaignMetrics(all);
      syncRealtimeDb("campaign/prospects", all);
      syncRealtimeDb("campaign/metrics", metrics);

      return NextResponse.json({
        success: true,
        message: "Reset campaign to default demo data",
        metrics,
        prospects: all,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Campaign API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
