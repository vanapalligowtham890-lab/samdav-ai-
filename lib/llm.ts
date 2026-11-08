import db from "./db";

export interface LeadExtractionResult {
  customerName: string | null;
  need: string | null;
  budget: string | null;
  objections: string[];
  urgency: "low" | "medium" | "high" | null;
  nextStep: string | null;
  followUpDate: string | null;
  keyQuote: string | null;
  followUpMessage: string | null;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a precision CRM lead extractor for Indian small businesses.
Analyze the following sales call transcript (in Telugu, Hindi, or code-mixed English).
Extract structured lead information strictly following this JSON schema:

{
  "customerName": string or null (the prospect's name if mentioned, otherwise null),
  "need": string or null (clear summary of what product/service they need),
  "budget": string or null (price or budget range mentioned, with currency if any, e.g. "₹25,000" or "below ₹50k", else null),
  "objections": array of strings (customer concerns e.g. price, timing, warranty, distance, or empty array if none),
  "urgency": "low" | "medium" | "high" | null,
  "nextStep": string or null (the specific action agreed upon, e.g. "Send catalog on WhatsApp", "Call back tomorrow 4 PM"),
  "followUpDate": string or null (e.g. "Tomorrow 11 AM", "Friday", "Nov 12", else null),
  "keyQuote": string or null (EXACT verbatim words spoken by the customer highlighting their core intent or hurdle),
  "followUpMessage": string or null (A polite, warm, 1-2 sentence follow-up message drafted in the customer's primary spoken language, e.g. Telugu/Hinglish, suitable for sending via WhatsApp)
}

RULES:
- NEVER invent information not present in the call. If a detail is missing or unclear, output null.
- Extract the exact keyQuote verbatim from the customer's lines.
- The followUpMessage must be friendly, professional, in the customer's language.
- Output ONLY valid JSON matching this schema.`;

/**
 * Calls Gemini REST API with structured JSON output.
 */
async function callGemini(apiKey: string, transcript: string): Promise<LeadExtractionResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${EXTRACTION_SYSTEM_PROMPT}\n\nTRANSCRIPT:\n"""${transcript}"""` }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty candidate response from Gemini API");
  }

  return JSON.parse(text);
}

/**
 * Validates and normalizes the parsed extraction object.
 */
function validateLeadResult(raw: any): LeadExtractionResult {
  const urgencyValues = ["low", "medium", "high"];
  return {
    customerName: typeof raw.customerName === "string" ? raw.customerName : null,
    need: typeof raw.need === "string" ? raw.need : null,
    budget: typeof raw.budget === "string" ? raw.budget : null,
    objections: Array.isArray(raw.objections) ? raw.objections.map(String) : [],
    urgency: urgencyValues.includes(raw.urgency) ? raw.urgency : null,
    nextStep: typeof raw.nextStep === "string" ? raw.nextStep : null,
    followUpDate: typeof raw.followUpDate === "string" ? raw.followUpDate : null,
    keyQuote: typeof raw.keyQuote === "string" ? raw.keyQuote : null,
    followUpMessage: typeof raw.followUpMessage === "string" ? raw.followUpMessage : null,
  };
}

/**
 * Main extraction function. Includes 1 retry on invalid JSON.
 */
export async function extractLeadFromTranscript(
  transcript: string,
  callId?: string
): Promise<LeadExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

  let result: LeadExtractionResult | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (apiKey && !apiKey.includes("your_")) {
        const raw = await callGemini(apiKey, transcript);
        result = validateLeadResult(raw);
        break;
      } else {
        // Fallback heuristic extraction if API key is not yet set in dev
        result = heuristicExtract(transcript);
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Extraction attempt ${attempt + 1} failed:`, err.message);
    }
  }

  if (!result) {
    throw new Error(`Lead extraction failed after retry: ${lastError?.message}`);
  }

  // Save to SQLite linked to call if callId provided
  if (callId) {
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(`
      INSERT OR REPLACE INTO leads (
        id, call_id, customer_name, need, budget, objections,
        urgency, next_step, follow_up_date, key_quote, follow_up_message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).run(
      leadId,
      callId,
      result.customerName,
      result.need,
      result.budget,
      JSON.stringify(result.objections),
      result.urgency,
      result.nextStep,
      result.followUpDate,
      result.keyQuote,
      result.followUpMessage
    );
  }

  return result;
}

/**
 * Intelligent fallback extractor when running offline or before API key is populated
 */
function heuristicExtract(transcript: string): LeadExtractionResult {
  const t = transcript.toLowerCase();
  
  // Basic name heuristic
  let name: string | null = null;
  const nameMatch = transcript.match(/(?:నేను|నా పేరు|I am|This is|మాట్లాడుతున్నాను)\s+([A-Z][a-z]+|[అ-హ]+)/i);
  if (nameMatch) name = nameMatch[1];

  // Budget
  let budget: string | null = null;
  const budgetMatch = transcript.match(/(?:₹|రూ\.|Rs\.?|INR)\s*[\d,]+|\d+\s*(?:వేలు|లక్షలు|thousand|lakhs)/i);
  if (budgetMatch) budget = budgetMatch[0];

  // Urgency
  let urgency: "low" | "medium" | "high" = "medium";
  if (t.includes("urgent") || t.includes("తొందరగా") || t.includes("emergency") || t.includes("today") || t.includes("ఈరోజే")) {
    urgency = "high";
  } else if (t.includes("next month") || t.includes("తరువాత") || t.includes("later")) {
    urgency = "low";
  }

  // Pick first sentence as sample key quote if available
  const sentences = transcript.split(/[.?!।\n]+/).map(s => s.trim()).filter(Boolean);
  const keyQuote = sentences.length > 1 ? sentences[1] : sentences[0] || transcript.slice(0, 80);

  return {
    customerName: name || "కస్టమర్ (Customer)",
    need: "సర్వీస్ విచారణ (Service Inquiry)",
    budget: budget || null,
    objections: t.includes("ధర") || t.includes("cost") || t.includes("discount") ? ["ధర ఎక్కువ (Price concern)"] : [],
    urgency,
    nextStep: "రేపు ఉదయం కాల్ చేసి వివరాలు పంపాలి (Call back tomorrow morning with catalog)",
    followUpDate: "రేపు ఉదయం 11:00 గంటలకు (Tomorrow 11 AM)",
    keyQuote,
    followUpMessage: "నమస్కారం అండి, మీతో మాట్లాడినందుకు సంతోషం. మీరు అడిగిన వివరాలు ఇక్కడ ఉన్నాయి.",
  };
}

