import { ColdCallProspect } from "./campaign";
import { getLanguageMode } from "./languages";

export interface GeneratedCampaign {
  script: {
    greeting: string;
    pitch: string;
    question: string;
    objectionResponse: string;
    closing: string;
  };
  prospects: Omit<ColdCallProspect, "id">[];
}

const SYSTEM_PROMPT = `You are an elite Indian AI Sales Agent architect.
Your task is to generate a personalized outbound cold-calling campaign for an Indian business in the user's requested language.

RULES:
1. SCRIPT & TRANSCRIPT LANGUAGE: Strictly generate in the specified Language Mode. If Hindi, write authentic Hindi. If Hinglish, write code-mixed Hindi+English. If Telugu, write Telugu. If Telugu+English, write High-English Telugu. If Marathi, write Marathi. If Tamil, write Tamil. If Kannada, write Kannada. If Indian English, write English.
2. NAMES: Every customer name MUST BE a clean single name without duplicate words in parentheses (e.g. "Rahul Varma", "Priyanka Sharma", "Kiran Kumar", "Sneha Latha"). NEVER write dual-script duplicates like "రాహుల్ వర్మ (Rahul Varma)" or "राहुल (Rahul)".
3. PROSPECTS: Generate exactly 6 realistic leads tailored to the company and industry:
   - 2 Won leads (call_status: "closed", outcome: "won", realistic 35-45s conversation transcript in the chosen language, clear budget/need, and verbatim key_quote)
   - 1 Lost lead (call_status: "closed", outcome: "lost", realistic 20-30s polite decline transcript in the chosen language, key_quote)
   - 1 Ongoing lead (call_status: "ongoing", outcome: "pending", duration_seconds: 25, live in-progress transcript, key_quote)
   - 2 Queued leads (call_status: "queued", outcome: "pending", duration_seconds: 0, clear customer need)
4. OUTPUT FORMAT: Output ONLY valid JSON matching this exact structure:
{
  "script": {
    "greeting": string,
    "pitch": string,
    "question": string,
    "objectionResponse": string,
    "closing": string
  },
  "prospects": [
    {
      "name": string,
      "phone": string,
      "need": string,
      "notes": string,
      "call_status": "closed" | "ongoing" | "queued",
      "outcome": "won" | "lost" | "pending",
      "duration_seconds": number,
      "transcript": string,
      "key_quote": string,
      "call_time": string
    }
  ]
}`;

export async function generateCampaignWithGemini(
  companyName: string,
  sector: string,
  voiceName: string,
  languageModeId: string = "te-en"
): Promise<GeneratedCampaign | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    console.warn("No Gemini API key available for dynamic campaign generation");
    return null;
  }

  const langMode = getLanguageMode(languageModeId);

  const prompt = `Generate a high-converting outbound sales campaign for:
Company Name: "${companyName}"
Industry / Sector: "${sector}"
Agent Voice Persona: "${voiceName}"
Target Language / Mode: "${langMode.name}" (${langMode.label})

SPECIFIC LANGUAGE INSTRUCTION:
${langMode.promptDescription}
Write the script, call transcripts, customer replies, and notes strictly according to this language mode.

Remember:
- Single clean customer names with NO parentheses duplicates.
- Exactly 6 tailored prospects (2 won, 1 lost, 1 ongoing, 2 queued).`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`Gemini campaign gen returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as GeneratedCampaign;

    if (!parsed.script || !Array.isArray(parsed.prospects) || parsed.prospects.length === 0) {
      return null;
    }

    // Clean any accidental parentheses from prospect names and reset audio_url for dynamic synthesis
    parsed.prospects = parsed.prospects.map((p) => ({
      ...p,
      name: p.name.replace(/\s*\([^)]*\)/g, "").trim(),
      audio_url: "",
    }));

    return parsed;
  } catch (err: any) {
    console.warn("Dynamic campaign generation failed, using sector fallback:", err.message);
    return null;
  }
}

