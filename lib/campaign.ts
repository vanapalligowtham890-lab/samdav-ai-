import db from "./db";
import { database, isFirebaseConfigured } from "./firebase";
import { ref, set, get, update } from "firebase/database";

export interface ColdCallProspect {
  id: string;
  name: string;
  phone: string;
  need: string;
  notes?: string;
  call_status: "queued" | "ongoing" | "answered" | "rejected" | "closed";
  outcome: "pending" | "won" | "lost";
  duration_seconds: number;
  transcript?: string;
  audio_url?: string;
  key_quote?: string;
  call_time?: string;
}

export interface CampaignMetrics {
  total: number;
  ongoing: number;
  answered: number;
  closed: number;
  rejected: number;
  leadsWon: number;
  leadsLost: number;
}

// 10 Realistic Synthetic Small-Business Prospects for Outbound Cold Calling
export const DEMO_PROSPECTS: ColdCallProspect[] = [
  {
    id: "prospect_1",
    name: "రమేష్ వర్మ (Ramesh Varma)",
    phone: "+91 98765 00101",
    need: "రూట్ కెనాల్ ట్రీట్మెంట్ (Root Canal Emergency)",
    notes: "Suffering from toothache since 2 days",
    call_status: "closed",
    outcome: "won",
    duration_seconds: 38,
    audio_url: "/audio/demo_call_1.wav",
    transcript: "నమస్కారం అండి, Smile Dental Care. నేను మీకు ఎలా సహాయపడగలను? Hello Madam. నాకు గత రెండు రోజులుగా toothache చాలా ఎక్కువగా ఉంది. root canal treatment cost ఎంత అవుతుంది? అయ్యో బాధపడుతున్నారా రమేష్ గారు, మా డాక్టర్ గారు రేపు ఉదయం 11 గంటలకు available గా ఉన్నారు. సరే మేడం, రేపు 11 గంటలకు appointment బుక్ చేయండి. నా దవడ నొప్పి భరించలేకపోతున్నాను. ఖచ్చితంగా బుక్ చేశాను.",
    key_quote: "నా దవడ నొప్పి భరించలేకపోతున్నాను, రేపు 11 గంటలకు appointment బుక్ చేయండి.",
    call_time: "Today 10:15 AM",
  },
  {
    id: "prospect_2",
    name: "సురేష్ రెడ్డి (Suresh Reddy)",
    phone: "+91 98765 00102",
    need: "JEE Mains & Inter Coaching for son",
    notes: "Son scored 92% in 10th boards",
    call_status: "closed",
    outcome: "won",
    duration_seconds: 44,
    audio_url: "/audio/demo_call_2.wav",
    transcript: "హలో, విజేత అకాడమీ అడ్మిషన్స్ డెస్క్. చెప్పండి అండి. మేడం, నా కొడుకు టెన్త్ క్లాస్ కంప్లీట్ చేశాడు. ఇంటర్మీడియట్ తో పాటు JEE మెయిన్స్ కోచింగ్ ఫీజు ఎంత ఉంటుంది? సురేష్ గారు, మన దగ్గర టూ ఇయర్ ఇంటిగ్రేటెడ్ బ్యాచ్ ఉంది. ఈ వారం స్కాలర్‌షిప్ టెస్ట్ రాస్తే 25% discount వస్తుంది. ఫీజు కొంచెం ఎక్కువగానే ఉంది కానీ క్వాలిటీ ముఖ్యం. టెస్ట్ డేట్ ఎప్పుడు మేడం? ఈ ఆదివారం ఉదయం 10 గంటలకి అండి. సరే మేడం, శుక్రవారం లోపు రిజిస్ట్రేషన్ చేయిస్తాను.",
    key_quote: "ఫీజు కొంచెం ఎక్కువగానే ఉంది కానీ క్వాలిటీ ముఖ్యం, శుక్రవారం లోపు రిజిస్ట్రేషన్ చేయిస్తాను.",
    call_time: "Today 10:45 AM",
  },
  {
    id: "prospect_3",
    name: "ఆనంద్ కుమార్ (Anand Kumar)",
    phone: "+91 98765 00103",
    need: "CRDA Approved Plot near Highway",
    notes: "Budget strictly capped at ₹25L",
    call_status: "closed",
    outcome: "won",
    duration_seconds: 41,
    audio_url: "/audio/demo_call_3.wav",
    transcript: "హలో అండి, శ్రీ సాయి ప్రాపర్టీస్ నుండి వెంకటేష్ మాట్లాడుతున్నాను. నమస్తే వెంకటేష్ గారు, విజయవాడ హైవే దగ్గర CRDA అప్రూవ్డ్ ఓపెన్ ప్లాట్స్ ఉన్నాయని చూశాను. Sq yard ప్రైస్ ఎంత నడుస్తోంది? అవునండి ఆనంద్ గారు, 150 మరియు 200 గజాల ప్లాట్స్ ఉన్నాయి. గజం ధర ₹18,000. నా బడ్జెట్ మొత్తం ₹25 లక్షల లోపు ఉండాలి. వీకెండ్ లో సైట్ విజిట్ చేయొచ్చా? ఖచ్చితంగా శనివారం ఉదయం 10 గంటలకి క్యాబ్ పంపిస్తాను. సరే శనివారం కలుద్దాం, బ్రోచర్ వాట్సాప్ చేయండి.",
    key_quote: "నా బడ్జెట్ మొత్తం ₹25 లక్షల లోపు ఉండాలి, శనివారం సైట్ విజిట్ కి బ్రోచర్ వాట్సాప్ చేయండి.",
    call_time: "Today 11:10 AM",
  },
  {
    id: "prospect_4",
    name: "మాధవి లత (Madhavi Latha)",
    phone: "+91 98765 00104",
    need: "Bridal Lehenga & Maggam Work Blouse",
    notes: "Wedding on 15th next month",
    call_status: "closed",
    outcome: "won",
    duration_seconds: 46,
    audio_url: "/audio/demo_call_4.wav",
    transcript: "నమస్తే అండి, రమ్య డిజైనర్ బొటిక్. చెప్పండి. హలో రమ్య గారూ, మా చెల్లి పెళ్లి వచ్చే నెల 15వ తేదీన ఉంది. బ్రైడల్ లెహంగా మరియు మూడు మగ్గం వర్క్ బ్లౌజులు కుట్టించాలి. ఎంత టైమ్ పడుతుంది? మాధవి గారూ, కనీసం 10 నుండి 12 రోజులు పడుతుంది. టైమ్ చాలా తక్కువ ఉంది, అర్జెంట్ గా 7 రోజుల్లో ఇవ్వగలరా? సరే అండి, మీరు రేపు సాయంత్రం 4 గంటలకి క్లాత్ తీసుకుని రండి. 8 రోజుల్లో డెలివరీ ఇస్తాను. చాలా థాంక్స్ అండి, రేపు 4 PM కి తప్పకుండా వస్తాను.",
    key_quote: "టైమ్ చాలా తక్కువ ఉంది, అర్జెంట్ గా 7 రోజుల్లో ఇవ్వగలరా? రేపు 4 PM కి వస్తాను.",
    call_time: "Today 11:35 AM",
  },
  {
    id: "prospect_5",
    name: "వెంకట్రావు (Venkata Rao)",
    phone: "+91 98765 00105",
    need: "Commercial Shop Space Rental",
    notes: "Wants main road facing space",
    call_status: "rejected",
    outcome: "lost",
    duration_seconds: 12,
    audio_url: "/audio/sample_recap.wav",
    transcript: "హలో సర్, శ్రీ సాయి ప్రాపర్టీస్ నుండి కాల్ చేస్తున్నాం... (కస్టమర్ కాల్ కట్ చేశారు / ప్రస్తుతం వేరే పనిలో ఉన్నానని చెప్పారు).",
    key_quote: "నేను మీటింగ్‌లో ఉన్నాను, ప్రస్తుతం మాట్లాడలేను.",
    call_time: "Today 11:50 AM",
  },
  {
    id: "prospect_6",
    name: "కార్తీక్ నాయుడు (Karthik Naidu)",
    phone: "+91 98765 00106",
    need: "Two-Wheeler Loan & Exchange",
    notes: "Old bike exchange evaluation",
    call_status: "rejected",
    outcome: "lost",
    duration_seconds: 8,
    audio_url: "/audio/sample_recap.wav",
    transcript: "కాల్ రింగ్ అయింది కానీ కస్టమర్ ఆన్సర్ చేయలేదు (No response from customer).",
    key_quote: "లైన్ బిజీగా వచ్చింది.",
    call_time: "Today 12:05 PM",
  },
  {
    id: "prospect_7",
    name: "ప్రియాంక (Priyanka)",
    phone: "+91 98765 00107",
    need: "Skin & Dental Aesthetic Consultation",
    notes: "Looking for weekend slot",
    call_status: "ongoing",
    outcome: "pending",
    duration_seconds: 22,
    audio_url: "/audio/demo_call_1.wav",
    transcript: "ఏజెంట్ ప్రస్తుతం కస్టమర్‌తో లైవ్ సంభాషణలో ఉన్నారు (Gnani Timbre voice agent actively speaking)...",
    key_quote: "శనివారం మధ్యాహ్నం 3 గంటలకు కన్సల్టేషన్ స్లాట్ ఖాళీగా ఉందా?",
    call_time: "Now (Live Dialing)",
  },
  {
    id: "prospect_8",
    name: "శ్రీకాంత్ (Srikanth)",
    phone: "+91 98765 00108",
    need: "Home Loan Interest Rate Inquiry",
    notes: "CIBIL score > 780",
    call_status: "queued",
    outcome: "pending",
    duration_seconds: 0,
    call_time: "Queued for Forwarding Call",
  },
  {
    id: "prospect_9",
    name: "సునీత (Sunitha)",
    phone: "+91 98765 00109",
    need: "Spoken English & Communication Batch",
    notes: "Online morning timings preferred",
    call_status: "queued",
    outcome: "pending",
    duration_seconds: 0,
    call_time: "Queued for Forwarding Call",
  },
  {
    id: "prospect_10",
    name: "రాజేష్ చౌదరి (Rajesh Choudhary)",
    phone: "+91 98765 00110",
    need: "Honda Activa Booking & Free Accessories",
    notes: "Festive discount offer query",
    call_status: "queued",
    outcome: "pending",
    duration_seconds: 0,
    call_time: "Queued for Forwarding Call",
  }
];

// Ensure campaign table exists in SQLite
db.exec(`
  CREATE TABLE IF NOT EXISTS cold_call_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    need TEXT,
    notes TEXT,
    call_status TEXT DEFAULT 'queued',
    outcome TEXT DEFAULT 'pending',
    duration_seconds REAL DEFAULT 0,
    transcript TEXT,
    audio_url TEXT,
    key_quote TEXT,
    call_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

/**
 * Returns all campaign prospects from SQLite
 */
export function getCampaignProspects(): ColdCallProspect[] {
  const rows = db.prepare(`
    SELECT * FROM cold_call_campaigns ORDER BY 
      CASE call_status
        WHEN 'ongoing' THEN 1
        WHEN 'queued' THEN 2
        WHEN 'answered' THEN 3
        WHEN 'closed' THEN 4
        ELSE 5
      END, created_at DESC
  `).all() as ColdCallProspect[];

  if (rows.length === 0) {
    // Seed default campaign prospects into SQLite
    seedDefaultCampaign();
    return db.prepare("SELECT * FROM cold_call_campaigns").all() as ColdCallProspect[];
  }

  return rows;
}

/**
 * Seeds default 10 synthetic prospects
 */
export function seedDefaultCampaign(): void {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO cold_call_campaigns (
      id, name, phone, need, notes, call_status, outcome, duration_seconds, transcript, audio_url, key_quote, call_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of DEMO_PROSPECTS) {
    insert.run(
      p.id,
      p.name,
      p.phone,
      p.need,
      p.notes || "",
      p.call_status,
      p.outcome,
      p.duration_seconds,
      p.transcript || "",
      p.audio_url || "",
      p.key_quote || "",
      p.call_time || "Today"
    );
  }
}

/**
 * Calculate Dashboard Metrics exactly as specified by user
 */
export function calculateCampaignMetrics(prospects: ColdCallProspect[]): CampaignMetrics {
  return {
    total: prospects.length,
    ongoing: prospects.filter(p => p.call_status === "ongoing").length,
    answered: prospects.filter(p => p.call_status === "answered" || (p.call_status === "closed" && p.outcome === "won")).length,
    closed: prospects.filter(p => p.call_status === "closed").length,
    rejected: prospects.filter(p => p.call_status === "rejected" || p.outcome === "lost").length,
    leadsWon: prospects.filter(p => p.outcome === "won").length,
    leadsLost: prospects.filter(p => p.outcome === "lost").length,
  };
}

