import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { synthesizeSpeech } from "@/lib/gnani";
import { computeStringHash } from "@/lib/audio";
import { ALL_VOICES } from "@/lib/voice-catalog";
import { cleanCustomerName } from "@/lib/sector-campaigns";
import { getLanguageMode } from "@/lib/languages";

export async function POST(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch from cold_call_campaigns
    const campaignCalls = db.prepare(`
      SELECT * FROM cold_call_campaigns WHERE call_status = 'closed' OR call_status = 'ongoing'
    `).all() as any[];

    const companyName = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Our Business";
    const voiceSetting = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const languageSetting = (db.prepare("SELECT value FROM settings WHERE key = 'language'").get() as any)?.value || "te-en";
    const savedTimbreLang = (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value;

    const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === voiceSetting.toLowerCase()) || ALL_VOICES[0];
    const langMode = getLanguageMode(languageSetting);
    const timbreLanguage = savedTimbreLang || langMode.timbreLanguageCode || voiceDef.language || "te-IN";

    const wonCalls = campaignCalls.filter(c => c.outcome === "won");
    const wonCount = wonCalls.length;
    const topLead = wonCalls[0] || campaignCalls[0];
    const cleanName = topLead ? cleanCustomerName(topLead.name) : "Customer";
    const keyQuote = topLead?.key_quote ? topLead.key_quote.replace(/^[a-zA-Z0-9_ ()·]+:\s*/, "").slice(0, 45).replace(/[()"]/g, "") : "";

    let spokenText = "";

    // Generate concise brief (under 50 words) customized to the chosen Language Mode
    switch (languageSetting) {
      case "te-IN": // Pure Telugu
        if (campaignCalls.length === 0) {
          spokenText = `${companyName} లో ఈరోజు కొత్త కాల్స్ ఏమీ రాలేదు. మీ కస్టమర్ లీడ్స్ అన్నీ సిద్ధంగా ఉన్నాయి. ధన్యవాదాలు.`;
        } else {
          spokenText = `${companyName} సేల్స్ రీక్యాప్: ఈరోజు ${wonCount} హాట్ లీడ్స్ కన్ఫర్మ్ అయ్యాయి. ${cleanName} గారితో సంభాషణ విజయవంతమైంది. కస్టమర్ మాట: "${keyQuote}". పూర్తి వివరాలు పోర్టల్‌లో ఉన్నాయి. ధన్యవాదాలు.`;
        }
        break;

      case "hi-en": // Hinglish (Hindi + English)
        if (campaignCalls.length === 0) {
          spokenText = `${companyName} mein aaj koi new calls nahi the. Saari leads up to date hain. Thank you.`;
        } else {
          spokenText = `${companyName} Sales Recap: Aaj total ${wonCount} hot leads close hui hain. ${cleanName} ji ke saath conversation successfully complete hua. Call recordings portal pe ready hain. Thank you.`;
        }
        break;

      case "hi-IN": // Pure Hindi
        if (campaignCalls.length === 0) {
          spokenText = `${companyName} में आज कोई नई कॉल प्राप्त नहीं हुई। आपकी सभी लीड्स अपडेट हैं। धन्यवाद।`;
        } else {
          spokenText = `${companyName} दैनिक बिक्री रिपोर्ट: आज ${wonCount} मुख्य ग्राहक लीड्स सफलतापूर्वक प्राप्त हुईं। ${cleanName} जी के साथ बातचीत सकारात्मक रही। संपूर्ण रिकॉर्डिंग्स पोर्टल पर उपलब्ध हैं। धन्यवाद।`;
        }
        break;

      case "en-IN": // Indian Corporate English
        if (campaignCalls.length === 0) {
          spokenText = `No new outbound calls recorded today for ${companyName}. All customer prospects are updated. Thank you.`;
        } else {
          spokenText = `${companyName} Sales Brief: A total of ${wonCount} high-intent client deals were confirmed today. Discussion with ${cleanName} was successful. Detailed call recordings are available in your portal. Thank you.`;
        }
        break;

      case "ta-IN": // Tamil
        if (campaignCalls.length === 0) {
          spokenText = `${companyName}-ல் இன்று புதிய அழைப்புகள் எதுவும் இல்லை. அனைத்து லீட்களும் தயார் நிலையில் உள்ளன. நன்றி.`;
        } else {
          spokenText = `${companyName} விற்பனை சுருக்கம்: இன்று ${wonCount} முக்கிய வாய்ப்புகள் வெற்றிகரமாக உறுதி செய்யப்பட்டன. ${cleanName} உடனான அழைப்பு முடிவடைந்தது. பதிவுகள் போர்ட்டலில் உள்ளன. நன்றி.`;
        }
        break;

      case "mr-IN": // Marathi
        if (campaignCalls.length === 0) {
          spokenText = `${companyName} मध्ये आज कोणतेही नवीन कॉल्स झाले नाहीत. सर्व लीड्स अद्ययावत आहेत. धन्यवाद.`;
        } else {
          spokenText = `${companyName} दैनिक विक्री अहवाल: आज ${wonCount} महत्त्वाच्या ग्राहक लीड्स निश्चित झाल्या आहेत. ${cleanName} यांच्याशी सकारात्मक चर्चा झाली. सर्व रेकॉर्डिंग्स पोर्टलवर उपलब्ध आहेत. धन्यवाद.`;
        }
        break;

      case "kn-IN": // Kannada
        if (campaignCalls.length === 0) {
          spokenText = `${companyName} ನಲ್ಲಿ ಇಂದು ಯಾವುದೇ ಹೊಸ ಕರೆಗಳು ಬಂದಿಲ್ಲ. ಎಲ್ಲಾ ಲೀಡ್‌ಗಳು ಅಪ್‌ಡೇಟ್ ಆಗಿವೆ. ಧನ್ಯವಾದಗಳು.`;
        } else {
          spokenText = `${companyName} ದೈನಂದಿನ ಮಾರಾಟ ಸಾರಾಂಶ: ಇಂದು ${wonCount} ಪ್ರಮುಖ ಲೀಡ್‌ಗಳು ಖಚಿತವಾಗಿವೆ. ${cleanName} ಅವರ ಜೊತೆಗಿನ ಮಾತುಕತೆ ಯಶಸ್ವಿಯಾಗಿದೆ. ಎಲ್ಲಾ ರೆಕಾರ್ಡಿಂಗ್‌ಗಳು ಪೋರ್ಟಲ್‌ನಲ್ಲಿವೆ. ಧನ್ಯವಾದಗಳು.`;
        }
        break;

      case "bn-IN": // Bengali
        if (campaignCalls.length === 0) {
          spokenText = `${companyName}-এ আজ কোনো নতুন কল নেই। সমস্ত লিড আপডেট করা হয়েছে। ধন্যবাদ।`;
        } else {
          spokenText = `${companyName} দৈনিক বিক্রয় রিপোর্ট: আজ মোট ${wonCount} গুরুত্বপূর্ণ ক্লায়েন্ট লিড নিশ্চিত হয়েছে। ${cleanName}-এর সাথে সফল আলোচনা হয়েছে। সম্পূর্ণ রেকর্ডিং পোর্টালে উপলব্ধ। ধন্যবাদ।`;
        }
        break;

      case "gu-IN": // Gujarati
        if (campaignCalls.length === 0) {
          spokenText = `${companyName} માં આજે કોઈ નવા કોલ્સ આવ્યા નથી. તમામ લીડ્સ તૈયાર છે. આભાર.`;
        } else {
          spokenText = `${companyName} દૈનિક સેલ્સ રિપોર્ટ: આજે કુલ ${wonCount} મહત્વપૂર્ણ લીડ્સ સફળતાપૂર્વક કન્ફર્મ થઈ છે. ${cleanName} સાથે વાતચીત સફળ રહી. તમામ રેકોર્ડિંગ પોર્ટલ પર ઉપલબ્ધ છે. આભાર.`;
        }
        break;

      case "te-en": // High-English Telugu (Default)
      default:
        if (campaignCalls.length === 0) {
          spokenText = `${companyName} లో ఈరోజు new calls ఏమీ లేవు. Leads అన్నీ up to date ఉన్నాయి. Thank you!`;
        } else {
          spokenText = `${companyName} Evening Sales Recap: ఈరోజు ${wonCount} high-intent leads confirm అయ్యాయి. ${cleanName} గారితో call successful గా పూర్తయింది. Detailed recordings portal లో live గా ఉన్నాయి. Thank you!`;
        }
        break;
    }

    // Ensure strictly under 60 words for Gnani challenge requirement
    const words = spokenText.trim().split(/\s+/);
    if (words.length > 56) {
      spokenText = words.slice(0, 54).join(" ") + "... Thank you.";
    }

    // Synthesize speech using Timbre TTS with the exact voice and language
    let audioResult: { audioUrl: string; cached: boolean };
    try {
      audioResult = await synthesizeSpeech(spokenText, {
        voice: voiceDef.id,
        model: voiceDef.model,
        language: timbreLanguage,
      });
    } catch (apiErr: any) {
      console.warn("Gnani Timbre API synthesis error:", apiErr.message);
      audioResult = {
        audioUrl: "",
        cached: false,
      };
    }

    const recapId = `recap_${Date.now()}`;
    const textHash = computeStringHash(spokenText);

    // Save recap to DB
    db.prepare(`
      INSERT OR REPLACE INTO recaps (id, recap_date, spoken_text_telugu, audio_url, text_hash, voice)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(recapId, todayStr, spokenText, audioResult.audioUrl, textHash, voiceDef.id);

    return NextResponse.json({
      success: true,
      recapId,
      text: spokenText,
      audioUrl: audioResult.audioUrl,
      wordCount: spokenText.split(/\s+/).length,
      voice: voiceDef.id,
      language: languageSetting,
      timbreLanguage,
      cached: audioResult.cached,
    });
  } catch (error: any) {
    console.error("Recap API Error:", error);
    return NextResponse.json({ error: error.message || "Recap generation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const voiceSetting = (db.prepare("SELECT value FROM settings WHERE key = 'voice'").get() as any)?.value || "Shivani";
    const businessName = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Ishiva digital";

    // Return latest recap matching current voice and business
    const latestRecap = db.prepare(`
      SELECT * FROM recaps 
      WHERE voice = ? AND spoken_text_telugu LIKE ? 
      ORDER BY created_at DESC LIMIT 1
    `).get(voiceSetting, `%${businessName}%`) as any;

    return NextResponse.json({
      success: true,
      recap: latestRecap || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
