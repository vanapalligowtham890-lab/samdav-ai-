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
 * Calls Gemini REST API with structured JSON output with multi-model fallback on rate limits.
 */
async function callGemini(apiKey: string, transcript: string): Promise<LeadExtractionResult> {
  const CANDIDATE_MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];

  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

      if (res.status === 429) {
        console.warn(`[Gemini Extraction] Model ${model} rate-limited (429). Trying fallback model...`);
        continue;
      }

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty candidate response from Gemini API");

      return JSON.parse(text);
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Extraction] Attempt with ${model} failed:`, err.message);
    }
  }

  throw lastError || new Error("All Gemini candidate models failed.");
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

export interface AgentTurnParams {
  companyName: string;
  businessType: string;
  agentVoiceName: string;
  language: string;
  conversationHistory: { speaker: "agent" | "customer"; text: string }[];
  customerSpeechText: string;
}

/**
 * Generates an intelligent, conversational spoken sales response from the AI agent during a live call.
 * Uses a cascading pool of Gemini models (2.5-flash -> 1.5-flash -> 1.5-flash-8b) with instant contextual
 * fallback on rate limits so the call NEVER pauses or stutters.
 */
export async function generateLiveAgentTurnReply(params: AgentTurnParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  const { companyName, businessType, agentVoiceName, language, conversationHistory, customerSpeechText } = params;

  const isAditya = companyName.toLowerCase().includes("aditya") || businessType.toLowerCase().includes("aditya") || businessType.toLowerCase().includes("btech");

  const systemInstruction = isAditya
    ? `You are ${agentVoiceName}, the polite and knowledgeable 24/7 Admissions Officer & Parent Assistant for Aditya University (Surampalem, Andhra Pradesh).
You are speaking live on the phone with a parent inquiring about our 4-Year B.Tech Degree Programs (CSE, AI & ML, Data Science, Cyber Security, ECE, EEE, Mechanical, Civil, IT).
Key College Knowledge:
- Placements: 3,000+ campus placements, ₹33+ LPA highest package (Amazon, Cisco, TCS, Infosys, Tech Mahindra).
- Technical Hub: Coding & global IT certifications from 1st year.
- Hostels: Separate Boys & Girls AC and Non-AC hostels with 24/7 security, Wi-Fi, hygienic food court.
- Scholarships: 25% to 50% merit concession for top EAPCET ranks and >90% in Intermediate.
- Campus: Surampalem (near Kakinada / Rajahmundry, AP). Saturday Open House campus visits.
Rules:
1. Speak concisely in 1 to 2 spoken conversational sentences (under 30 words).
2. Answer the parent respectfully in Telugu (or English if they speak in English).
3. Do NOT use markdown, bullets, or asterisks. Output purely spoken conversational words.`
    : `You are ${agentVoiceName}, an empathetic and articulate AI outbound sales executive for ${companyName} (${businessType}).
You are speaking on a live phone call with a customer.
Language mode: ${language} (respond naturally in the customer's language/dialect: Telugu, Hinglish, or English).
Rules:
1. Speak concisely in 1 to 2 spoken sentences (under 30 words total).
2. Answer the customer's question directly (pricing, timing, appointment, offers).
3. If they show interest, guide them towards confirming an appointment, plot visit, or WhatsApp proposal.
4. Do NOT use bullet points, asterisks, stage directions, or markdown. Output purely natural spoken conversational words.`;

  const conversationText = conversationHistory
    .map(t => `${t.speaker === "agent" ? agentVoiceName : "Customer"}: "${t.text}"`)
    .join("\n");

  const prompt = `${conversationText}\nCustomer: "${customerSpeechText}"\n${agentVoiceName}:`;

  if (apiKey && !apiKey.includes("your_")) {
    const CANDIDATE_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.3,
          },
        };
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 429) {
          console.warn(`[Live Call Turn] Model ${model} rate-limited (429). Falling back to next model...`);
          continue;
        }

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            return reply.replace(/[*_#`"]/g, "").replace(/\n/g, " ").trim();
          }
        }
      } catch (err) {
        console.warn(`[Live Call Turn] Attempt with ${model} failed:`, err);
      }
    }
  }

  // Instant contextual conversational fallback so customer is answered immediately without lag
  return contextualSalesReply(customerSpeechText, companyName, agentVoiceName, language);
}

/**
 * High-speed contextual conversational fallback for real-time live calling
 */
function contextualSalesReply(text: string, company: string, agent: string, language: string): string {
  const t = text.toLowerCase();
  const isTe = language.startsWith("te");
  const isAditya = company.toLowerCase().includes("aditya") || t.includes("aditya") || t.includes("btech") || t.includes("college") || t.includes("university");

  if (isAditya) {
    if (t.includes("course") || t.includes("btech") || t.includes("branch") || t.includes("కోర్సు") || t.includes("బ్రాంచ్") || t.includes("cse") || t.includes("ai")) {
      return isTe
        ? `ఆదిత్య యూనివర్సిటీలో 4-సంవత్సరాల B.Tech CSE, AI & ML, Data Science, ECE మరియు IT బ్రాంచెస్ అందుబాటులో ఉన్నాయి సర్. మీ అబ్బాయికి ఏ బ్రాంచ్ అంటే ఆసక్తి?`
        : `At Aditya University, we offer 4-year B.Tech in CSE, AI & ML, Data Science, ECE, and IT. Which branch is your student interested in?`;
    }

    if (t.includes("hostel") || t.includes("హాస్టల్") || t.includes("room") || t.includes("food") || t.includes("security") || t.includes("భద్రత")) {
      return isTe
        ? `మా సూరంపాలెం క్యాంపస్ లో బాయ్స్ మరియు గర్ల్స్ కి వేర్వేరుగా 24/7 భద్రతతో కూడిన AC మరియు Non-AC హాస్టల్స్, పరిశుభ్రమైన భోజన సదుపాయం ఉన్నాయి సర్.`
        : `We provide separate on-campus AC and Non-AC hostels for boys and girls with 24/7 security and hygienic food courts at our Surampalem campus.`;
    }

    if (t.includes("placement") || t.includes("job") || t.includes("salary") || t.includes("ప్లేస్‌మెంట్") || t.includes("ప్యాకేజీ") || t.includes("amazon")) {
      return isTe
        ? `ఆదిత్యలో ఏటా 3000 కు పైగా ప్లేస్‌మెంట్స్ వస్తాయి సర్. అమెజాన్, సిస్కో, టీసీఎస్ కంపెనీలలో అత్యధిక ప్యాకేజీ ₹33 లక్షల వరకు వచ్చింది!`
        : `Aditya University has 3,000+ placements every year with top recruiters like Amazon, Cisco, and TCS, with the highest package reaching ₹33+ LPA!`;
    }

    if (t.includes("fee") || t.includes("scholarship") || t.includes("cost") || t.includes("ఫీజు") || t.includes("రాయితీ") || t.includes("eapcet")) {
      return isTe
        ? `EAPCET ర్యాంక్ మరియు ఇంటర్ మార్కుల (90%+) ఆధారంగా 25% నుండి 50% వరకు మెరిట్ స్కాలర్‌షిప్ లభిస్తుంది సర్. పూర్తి ఫీజు బ్రోచర్ వాట్సాప్ పంపించమంటారా?`
        : `Merit scholarships up to 25% to 50% tuition fee waiver are available based on EAPCET rank and Intermediate marks. Shall I share the fee brochure?`;
    }

    if (t.includes("campus") || t.includes("visit") || t.includes("address") || t.includes("క్యాంపస్") || t.includes("ఎక్కడ") || t.includes("శనివారం")) {
      return isTe
        ? `మా క్యాంపస్ తూర్పు గోదావరి జిల్లా సూరంపాలెంలో ఉంది సర్. ఈ శనివారం ఉదయం 10 గంటలకి ఓపెన్ హౌస్ క్యాంపస్ విజిట్ కి మీరు ఆహ్వానితులు!`
        : `Our university campus is located in Surampalem, AP. You are warmly invited for our Open House campus visit this Saturday at 10 AM!`;
    }
  }

  if (t.includes("cost") || t.includes("price") || t.includes("charge") || t.includes("ధర") || t.includes("ఖర్చు") || t.includes("fee") || t.includes("ప్యాకేజీ")) {
    return isTe
      ? `ఖచ్చితంగా అండి! మా దగ్గర ప్రారంభ ప్యాకేజీలు చాలా అందుబాటు ధరలలో ఉన్నాయి, ప్రత్యేక రాయితీ కూడా లభిస్తుంది. పూర్తి కొటేషన్ మీ వాట్సాప్‌కి పంపమంటారా?`
      : `Certainly! Our starter packages are very affordable with special introductory discounts. Shall I send the complete price details to your WhatsApp?`;
  }

  if (t.includes("time") || t.includes("timing") || t.includes("appointment") || t.includes("schedule") || t.includes("సమయం") || t.includes("రేపు") || t.includes("ఉదయం") || t.includes("slots")) {
    return isTe
      ? `తప్పకుండా అండి! రేపు ఉదయం 11:00 గంటలకు లేదా సాయంత్రం 4:00 గంటలకు స్లాట్ ఖాళీగా ఉంది. మీకు ఏ సమయం వీలవుతుంది?`
      : `Definitely! We have open slots tomorrow at 11:00 AM and 4:00 PM. Which time suits you best?`;
  }

  if (t.includes("location") || t.includes("address") || t.includes("where") || t.includes("ఎక్కడ") || t.includes("లొకేషన్") || t.includes("ఆఫీస్")) {
    return isTe
      ? `మా ప్రధాన కార్యాలయం నగరంలోనే అందుబాటులో ఉంది అండి. మీకు గూగుల్ మ్యాప్స్ లొకేషన్ వివరాలు వెంటనే పంపిస్తాము.`
      : `Our main office is centrally located in the city. I will share the exact Google Maps location link on your phone right away.`;
  }

  if (t.includes("discount") || t.includes("offer") || t.includes("తగ్గింపు") || t.includes("ఆఫర్")) {
    return isTe
      ? `అవునండి! ఈ నెలలో సంప్రదించిన కస్టమర్ల కోసం ప్రత్యేకంగా 15% వరకు ప్రత్యేక రాయితీ ఆఫర్ నడుస్తోంది!`
      : `Yes! We are running a special 15% introductory discount offer for customers this week!`;
  }

  return isTe
    ? `నమస్కారం అండి! ${company} నుండి మీ వివరాలు నోట్ చేసుకున్నాము. మీకు కావాల్సిన పూర్తి వివరాలు వెంటనే పంపిస్తాము.`
    : `Hello and thank you! We have noted your request at ${company}. We will share the full details with you right away.`;
}

