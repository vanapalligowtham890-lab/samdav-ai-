import path from "path";
import db from "./db";
import { ColdCallProspect, CampaignMetrics, calculateCampaignMetrics } from "./campaign";
import { syncRealtimeDb } from "./firebase";
import { synthesizeSpeech } from "./gnani";
import { synthesizeDialogueAudio } from "./dialogue-synthesizer";
import { generateCampaignWithGemini } from "./llm-campaign";
import { ALL_VOICES } from "./voice-catalog";
import { getLanguageMode } from "./languages";

export function cleanCustomerName(name: string): string {
  if (!name) return "Valued Prospect";
  // Extract English name if available inside parenthesis, or strip parenthesis
  const match = name.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return name.replace(/[()]/g, "").trim();
}

/**
 * Extracts the complete, coherent speech of a sales call for TTS synthesis.
 * Ensures that full sales conversations, pitches, and objection responses
 * are synthesized in their entirety without cutting off after 5-10 seconds.
 */
export function extractFullCallSpeechText(
  prospect: { transcript?: string | null; name?: string; need?: string },
  voiceName: string = "Shivani",
  companyName: string = "Our Business",
  activeScript?: any
): string {
  const company = companyName || "Our Business";
  const voice = voiceName || "Shivani";

  // 1. If transcript is empty or minimal (e.g. queued lead), generate full script opening
  if (!prospect.transcript || prospect.transcript.trim().length < 15) {
    if (activeScript && activeScript.greeting) {
      const g = activeScript.greeting || "";
      const p = activeScript.pitch || "";
      const q = activeScript.question || "";
      const c = activeScript.closing || "ధన్యవాదాలు.";
      const cleanName = cleanCustomerName(prospect.name || "Customer");
      return `${g} ${p} ${q} ${c}`
        .replace(/\{name\}/g, cleanName)
        .replace(/\{company\}/g, company)
        .replace(/\{need\}/g, prospect.need || "services")
        .replace(/\s+/g, " ")
        .trim();
    }
    return `నమస్కారం ${cleanCustomerName(prospect.name || "")} గారు, నేను ${company} నుండి ${voice} మాట్లాడుతున్నాను. మీ ఎంక్వైరీ వివరాలు వాట్సాప్ పంపించాము. ధన్యవాదాలు.`;
  }

  // Return the full clean transcript with both agent and customer lines intact
  return prospect.transcript
    .replace(/^["']|["']$/g, "")
    .replace(/[\u0A80-\u0AFF]/g, "") // strip rogue stray unicode
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
}

export interface SectorDefinition {
  id: string;
  label: string;
  teluguLabel: string;
  defaultProspects: (company: string) => Omit<ColdCallProspect, "id">[];
  script: {
    greeting: string;
    pitch: string;
    question: string;
    closing: string;
  };
}

export const SECTORS: Record<string, SectorDefinition> = {
  digital_marketing: {
    id: "digital_marketing",
    label: "Digital Marketing & Agency",
    teluguLabel: "డిజిటల్ మార్కెటింగ్ & ఏజెన్సీ",
    script: {
      greeting: "నమస్కారం {name} గారు, నేను {company} డిజిటల్ మార్కెటింగ్ నుండి మాట్లాడుతున్నాను. బాగున్నారా?",
      pitch: "మీ బిజినెస్‌కి ప్రతిరోజూ క్వాలిటీ కస్టమర్ ఎంక్వైరీలు తీసుకురావడానికి మేము Google Ads, Meta Ads మరియు SEO క్యాంపెయిన్ ఆఫర్ చేస్తున్నాము.",
      question: "మీ బిజినెస్ గ్రోత్ ప్లాన్ కోసం రేపు ఉదయం 11:00 గంటలకు 10 నిమిషాల స్ట్రాటజీ కాల్ చేయగలరా?",
      closing: "చాలా సంతోషం అండి! మా గత క్లయింట్ల రిజల్ట్స్ కేస్ స్టడీస్ మరియు ఆఫర్ బ్రోచర్ మీ వాట్సాప్‌కి పంపించాము. రేపు కలుద్దాం!",
    },
    defaultProspects: (company: string) => [
      {
        name: "రాహుల్ వర్మ (Rahul Varma)",
        phone: "+91 98490 11223",
        need: "Google Ads & Meta Performance Marketing for D2C Store",
        notes: "Looking to scale monthly revenue from ₹2L to ₹10L",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 42,
        audio_url: "/audio/demo_call_1.wav",
        transcript: `నమస్కారం అండి, నేను ${company} నుండి మాట్లాడుతున్నాను. హలో అండి, మీ Instagram Ad చూసి ఎంక్వైరీ చేశాను. మా క్లాతింగ్ బ్రాండ్‌కి Google & Meta Ads ద్వారా సేల్స్ పెంచాలి. బడ్జెట్ ఎంత అవుతుంది? రాహుల్ గారు, మన దగ్గర స్టార్టప్ గ్రోత్ ప్యాకేజీ ఉంది. ROI 4X దాకా వస్తుంది. రేపు 11 గంటలకు ఆడిట్ రిపోర్ట్ తో జూమ్ కాల్ పెట్టుకుందామా? ఖచ్చితంగా సర్, రేపు 11 AM కి లింక్ వాట్సాప్ చేయండి. డీల్ కన్ఫర్మ్ చేసుకుందాం.`,
        key_quote: "రేపు 11 AM కి జూమ్ లింక్ వాట్సాప్ చేయండి, డీల్ కన్ఫర్మ్ చేసుకుందాం.",
        call_time: "Today 10:15 AM",
      },
      {
        name: "ప్రియాంక శర్మ (Priyanka Sharma)",
        phone: "+91 99887 22334",
        need: "E-commerce Website Redesign & SEO Ranking",
        notes: "Wants organic first page ranking on Google",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 36,
        audio_url: "/audio/demo_call_2.wav",
        transcript: `హలో ప్రియాంక గారూ, ${company} నుండి పిలుస్తున్నాం. మీరు వెబ్‌సైట్ ఎస్‌ఈఓ కోసం రిక్వెస్ట్ పెట్టారు కదా? అవునండి, మా జ్యువెలరీ పోర్టల్ కి ఆర్గానిక్ ట్రాఫిక్ పెరగాలి. టైమ్ ఎంత పడుతుంది? మేడం, 3 నెలల్లో టాప్ 5 కీవర్డ్స్ ర్యాంక్ చేయిస్తాం. పోర్ట్‌ఫోలియో పంపించమంటారా? అవును, వెంటనే మీ బెస్ట్ కేస్ స్టడీస్ వాట్సాప్ చేయండి, ఈ వీకెండ్ సైన్ అప్ చేస్తాం.`,
        key_quote: "వెంటనే మీ బెస్ట్ కేస్ స్టడీస్ వాట్సాప్ చేయండి, ఈ వీకెండ్ సైన్ అప్ చేస్తాం.",
        call_time: "Today 10:45 AM",
      },
      {
        name: "అజయ్ కుమార్ (Ajay Kumar)",
        phone: "+91 97000 33445",
        need: "Social Media Management & Instagram Reels",
        notes: "Local restaurant chain in Hyderabad",
        call_status: "closed",
        outcome: "lost",
        duration_seconds: 28,
        audio_url: "/audio/sample_recap.wav",
        transcript: `నమస్తే అజయ్ గారు, ${company} సోషల్ మీడియా ప్యాకేజ్ గురించి. ప్రస్తుతం మా దగ్గర ఇన్-హౌస్ టీమ్ ఉంది అండి, ప్రస్తుతానికి ఎక్స్‌టర్నల్ ఏజెన్సీ అవసరం లేదు. భవిష్యత్తులో చూస్తాం.`,
        key_quote: "ప్రస్తుతానికి ఎక్స్‌టర్నల్ ఏజెన్సీ అవసరం లేదు, భవిష్యత్తులో చూస్తాం.",
        call_time: "Today 11:10 AM",
      },
      {
        name: "స్నేహ లత (Sneha Latha)",
        phone: "+91 96111 44556",
        need: "B2B Lead Generation on LinkedIn & Cold Outreach",
        notes: "B2B SaaS software provider",
        call_status: "ongoing",
        outcome: "pending",
        duration_seconds: 24,
        audio_url: "/audio/demo_call_3.wav",
        transcript: `ఏజెంట్ ప్రస్తుతం స్నేహ లత గారితో లైవ్ డిజిటల్ మార్కెటింగ్ ప్రపోజల్ చర్చిస్తున్నారు...`,
        key_quote: "మాకు నెలకు కనీసం 30 క్వాలిఫైడ్ బిజినెస్ డెమోలు కావాలి.",
        call_time: "Now (Live Dialing)",
      },
      {
        name: "వెంకటేశ్వర రావు (Venkateshwara Rao)",
        phone: "+91 98480 55667",
        need: "Local Business Google My Business (GMB) Rank",
        notes: "Car repair workshop owner",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
      {
        name: "దీపికా నాయుడు (Deepika Naidu)",
        phone: "+91 94401 66778",
        need: "Influencer Marketing & Regional Telugu Collabs",
        notes: "Ethnic wear boutique",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
      {
        name: "సంతోష్ రెడ్డి (Santosh Reddy)",
        phone: "+91 91234 77889",
        need: "Performance Marketing & Funnel Optimization",
        notes: "EdTech startup",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
    ],
  },

  ecommerce: {
    id: "ecommerce",
    label: "E-Commerce & Online Stores",
    teluguLabel: "ఈ-కామర్స్ & ఆన్‌లైన్ స్టోర్స్",
    script: {
      greeting: "నమస్కారం {name} గారు, నేను {company} ఆన్‌లైన్ స్టోర్ నుండి మాట్లాడుతున్నాను.",
      pitch: "మీరు కార్ట్ లో ఉంచిన వస్తువుల కోసం ఈరోజు మా వద్ద ప్రత్యేక 30% రాయితీ మరియు ఫ్రీ డెలివరీ ఆఫర్ ఉంది.",
      question: "మీ ఆర్డర్ కన్ఫర్మ్ చేయడానికి మరియు డిస్కౌంట్ కూపన్ అప్లై చేయడానికి సహాయపడమంటారా?",
      closing: "చాలా ధన్యవాదాలు! మీ డిస్కౌంట్ లింక్ మరియు ట్రాకింగ్ వివరాలు మీ వాట్సాప్‌కి పంపించాము.",
    },
    defaultProspects: (company: string) => [
      {
        name: "మణికంఠ (Manikantha)",
        phone: "+91 94901 12345",
        need: "Abandoned Cart Checkout & 20% Discount Code",
        notes: "Cart value ₹4,500 pending since yesterday",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 32,
        audio_url: "/audio/demo_call_1.wav",
        transcript: `నమస్కారం అండి, ${company} నుండి మాట్లాడుతున్నాం. మీ కార్ట్‌లో రెండు ఐటమ్స్ ఉన్నాయి. ఈరోజు ఆర్డర్ చేస్తే ₹500 కూపన్ వస్తుంది. అవునా మేడం! అయితే లింక్ వెంటనే పంపించండి, ఇప్పుడే పేమెంట్ చేస్తాను. థాంక్యూ అండి.`,
        key_quote: "అయితే లింక్ వెంటనే పంపించండి, ఇప్పుడే పేమెంట్ చేస్తాను.",
        call_time: "Today 10:20 AM",
      },
      {
        name: "లావణ్య రెడ్డి (Lavanya Reddy)",
        phone: "+91 98480 23456",
        need: "Wholesale Bulk Order & Dealer Pricing",
        notes: "Wants 50 units for boutique retail",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 45,
        audio_url: "/audio/demo_call_2.wav",
        transcript: `హలో లావణ్య గారూ, ${company} హోల్‌సేల్ డెస్క్ నుండి. మీరు 50 పీసెస్ ఎంక్వైరీ పెట్టారు కదా? అవునండి, బల్క్ ప్రైసింగ్ ఎలా ఉంటుంది? మేడం, 35% మార్జిన్ ఇస్తున్నాం. కేటలాగ్ చూస్తారా? వాట్సాప్‌కి పంపండి, చూసి ఇవాళ సాయంత్రంలోపు అడ్వాన్స్ ఇస్తాను.`,
        key_quote: "కేటలాగ్ వాట్సాప్‌కి పంపండి, ఇవాళ సాయంత్రంలోపు అడ్వాన్స్ ఇస్తాను.",
        call_time: "Today 11:05 AM",
      },
      {
        name: "శ్రీధర్ రావు (Sridhar Rao)",
        phone: "+91 97000 34567",
        need: "Product Size Exchange & Fast Shipping",
        notes: "Size replacement query",
        call_status: "ongoing",
        outcome: "pending",
        duration_seconds: 18,
        audio_url: "/audio/demo_call_3.wav",
        transcript: `కస్టమర్‌తో ఎక్స్ఛేంజ్ పాలసీ వివరాలు మాట్లాడుతున్నారు...`,
        key_quote: "రేపటికల్లా ఎక్స్ఛేంజ్ ఐటమ్ డెలివరీ అవుతుందా?",
        call_time: "Now (Live Dialing)",
      },
      {
        name: "అరుణ కుమారి (Aruna Kumari)",
        phone: "+91 96111 45678",
        need: "Cash on Delivery Availability Query",
        notes: "Tier-2 town delivery inquiry",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
      {
        name: "ప్రవీణ్ కుమార్ (Praveen Kumar)",
        phone: "+91 91234 56789",
        need: "Festive Gift Hampers for Corporate Employees",
        notes: "Corporate gifting 100 boxes",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
    ],
  },

  real_estate: {
    id: "real_estate",
    label: "Real Estate & Housing",
    teluguLabel: "రియల్ ఎస్టేట్ & ప్రాపర్టీస్",
    script: {
      greeting: "నమస్తే {name} గారు, నేను {company} నుండి వెంకటేష్ మాట్లాడుతున్నాను.",
      pitch: "హైవేకి దగ్గరగా ఉన్న CRDA/HMDA అప్రూవ్డ్ ఓపెన్ ప్లాట్స్ మరియు ప్రీమియం విల్లాస్ పై ఈ వారం స్పెషల్ లాంచ్ ఆఫర్స్ ఉన్నాయి.",
      question: "ఈ శని లేదా ఆదివారం ఉచిత క్యాబ్ సౌకర్యంతో సైట్ విజిట్ ప్లాన్ చేద్దామా?",
      closing: "చాలా సంతోషం అండి, సైట్ లొకేషన్ మరియు లేఅవుట్ ప్లాన్ మీ వాట్సాప్‌కి పంపించాము.",
    },
    defaultProspects: (company: string) => [
      {
        name: "ఆనంద్ కుమార్ (Anand Kumar)",
        phone: "+91 98765 00103",
        need: "CRDA Approved Plot near Highway",
        notes: "Budget strictly capped at ₹25L",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 41,
        audio_url: "/audio/demo_call_3.wav",
        transcript: `హలో అండి, ${company} నుండి వెంకటేష్ మాట్లాడుతున్నాను. నమస్తే వెంకటేష్ గారు, విజయవాడ హైవే దగ్గర CRDA అప్రూవ్డ్ ఓపెన్ ప్లాట్స్ ఉన్నాయని చూశాను. Sq yard ప్రైస్ ఎంత నడుస్తోంది? అవునండి ఆనంద్ గారు, 150 మరియు 200 గజాల ప్లాట్స్ ఉన్నాయి. గజం ధర ₹18,000. నా బడ్జెట్ మొత్తం ₹25 లక్షల లోపు ఉండాలి. వీకెండ్ లో సైట్ విజిట్ చేయొచ్చా? ఖచ్చితంగా శనివారం ఉదయం 10 గంటలకి క్యాబ్ పంపిస్తాను. సరే శనివారం కలుద్దాం, బ్రోచర్ వాట్సాప్ చేయండి.`,
        key_quote: "నా బడ్జెట్ మొత్తం ₹25 లక్షల లోపు ఉండాలి, శనివారం సైట్ విజిట్ కి బ్రోచర్ వాట్సాప్ చేయండి.",
        call_time: "Today 11:10 AM",
      },
      {
        name: "వెంకట్రావు (Venkata Rao)",
        phone: "+91 98765 00105",
        need: "Commercial Shop Space on Main Road",
        notes: "Wants 800 sqft shop for medical agency",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 35,
        audio_url: "/audio/demo_call_1.wav",
        transcript: `నమస్తే వెంకట్రావు గారు, ${company} మెయిన్ రోడ్ కమర్షియల్ స్పేసెస్ వివరాలు. రేట్లు ఎలా ఉన్నాయి సర్? గ్రౌండ్ ఫ్లోర్ ₹60 per sqft అండి. రేపు సాయంత్రం 5 గంటలకి చూడగలరా? అవును, రేపు 5 PM కి నేరుగా వస్తాను. స్పేస్ రిజర్వ్ చేసి ఉంచండి.`,
        key_quote: "రేపు 5 PM కి నేరుగా వస్తాను, స్పేస్ రిజర్వ్ చేసి ఉంచండి.",
        call_time: "Today 11:45 AM",
      },
      {
        name: "శ్రీకాంత్ (Srikanth)",
        phone: "+91 98765 00108",
        need: "Gated Community 3BHK Villa Inquiry",
        notes: "Looking for possession in 6 months",
        call_status: "ongoing",
        outcome: "pending",
        duration_seconds: 20,
        audio_url: "/audio/demo_call_2.wav",
        transcript: `విల్లా లేఅవుట్ మరియు బ్యాంక్ లోన్ అర్హత గురించి చర్చిస్తున్నారు...`,
        key_quote: "ఎస్బీఐ హోమ్ లోన్ అప్రూవల్ ఉందా లేదా అనేది చూడాలి.",
        call_time: "Now (Live Dialing)",
      },
      {
        name: "చంద్రశేఖర్ (Chandrasekhar)",
        phone: "+91 94400 88990",
        need: "Farmland Plot with Sandalwood Plantation",
        notes: "Investment query",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
    ],
  },

  dental_clinic: {
    id: "dental_clinic",
    label: "Dental Clinic & Healthcare",
    teluguLabel: "డెంటల్ క్లినిక్ & హెల్త్‌కేర్",
    script: {
      greeting: "నమస్కారం {name} గారు, నేను {company} నుండి కాల్ చేస్తున్నాను.",
      pitch: "మీరు దంతాల సమస్య మరియు చెకప్ గురించి విచారించారు కదా. ఈ వారం మా సీనియర్ డాక్టర్ వద్ద ఉచిత కన్సల్టేషన్ మరియు ఎక్స్-రే సదుపాయం ఉంది.",
      question: "మీకు అనుకూలమైన సమయంలో రేపు అపాయింట్‌మెంట్ బుక్ చేయమంటారా?",
      closing: "చాలా సంతోషం అండి, డాక్టర్ గారి అపాయింట్‌మెంట్ కన్ఫర్మ్ చేశాము. క్లినిక్ లొకేషన్ వాట్సాప్‌కి పంపించాము.",
    },
    defaultProspects: (company: string) => [
      {
        name: "రమేష్ వర్మ (Ramesh Varma)",
        phone: "+91 98765 00101",
        need: "రూట్ కెనాల్ ట్రీట్మెంట్ (Root Canal Emergency)",
        notes: "Suffering from toothache since 2 days",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 38,
        audio_url: "/audio/demo_call_1.wav",
        transcript: `నమస్కారం అండి, ${company}. నేను మీకు ఎలా సహాయపడగలను? Hello Madam. నాకు గత రెండు రోజులుగా toothache చాలా ఎక్కువగా ఉంది. root canal treatment cost ఎంత అవుతుంది? అయ్యో బాధపడుతున్నారా రమేష్ గారు, మా డాక్టర్ గారు రేపు ఉదయం 11 గంటలకు available గా ఉన్నారు. సరే మేడం, రేపు 11 గంటలకు appointment బుక్ చేయండి. నా దవడ నొప్పి భరించలేకపోతున్నాను. ఖచ్చితంగా బుక్ చేశాను.`,
        key_quote: "నా దవడ నొప్పి భరించలేకపోతున్నాను, రేపు 11 గంటలకు appointment బుక్ చేయండి.",
        call_time: "Today 10:15 AM",
      },
      {
        name: "ప్రియాంక (Priyanka)",
        phone: "+91 98765 00107",
        need: "ఇన్విజిబుల్ క్లియర్ అలైనేర్స్ (Invisible Aligners)",
        notes: "Looking for teeth alignment without metal braces",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 40,
        audio_url: "/audio/demo_call_2.wav",
        transcript: `హలో ప్రియాంక గారూ, ${company} క్లినిక్ నుండి. ఇన్విజిబుల్ అలైనేర్స్ డెమో చూశారా? అవును మేడం, మెటల్ బ్రేసెస్ లేకుండా దంతాలు సరిచేసే ట్రీట్‌మెంట్ ఫీజు ఎంత ఉంటుంది? మన దగ్గర జీరో పర్సెంట్ ఈఎంఐ ఉంది అండి. రేపు 3 PM కి 3D స్కాన్ చేయించుకోగలరా? సరే మేడం, రేపు 3 గంటలకి క్లినిక్ కి వస్తాను. థాంక్స్.`,
        key_quote: "రేపు 3 PM కి 3D స్కాన్ కోసం క్లినిక్ కి వస్తాను.",
        call_time: "Today 11:30 AM",
      },
      {
        name: "కార్తీక్ (Karthik)",
        phone: "+91 98765 00106",
        need: "టీత్ వైట్నింగ్ & స్మైల్ డిజైనింగ్",
        notes: "Wedding coming up",
        call_status: "ongoing",
        outcome: "pending",
        duration_seconds: 19,
        audio_url: "/audio/demo_call_3.wav",
        transcript: `టీత్ వైట్నింగ్ ప్యాకేజీ గురించి చర్చిస్తున్నారు...`,
        key_quote: "పెళ్లికి వారం ముందు వైట్నింగ్ చేయించుకోవచ్చా?",
        call_time: "Now (Live Dialing)",
      },
      {
        name: "సునీత (Sunitha)",
        phone: "+91 98765 00109",
        need: "పిల్లల డెంటల్ చెకప్ & కేవిటీ ఫిల్లింగ్",
        notes: "6-year-old child dental checkup",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
    ],
  },

  coaching_edtech: {
    id: "coaching_edtech",
    label: "Coaching & EdTech",
    teluguLabel: "కోచింగ్ & ఎడ్యుకేషన్",
    script: {
      greeting: "నమస్కారం {name} గారు, నేను {company} అడ్మిషన్స్ డెస్క్ నుండి మాట్లాడుతున్నాను.",
      pitch: "ఐఐటీ జేఈఈ మరియు నీట్ పరీక్షల కోసం మన కొత్త బ్యాచ్ మొదలవుతోంది. స్కాలర్‌షిప్ టెస్ట్ లో 30% ఫీజు రాయితీ లభిస్తుంది.",
      question: "ఈ ఆదివారం ఉచిత డెమో క్లాస్ మరియు స్కాలర్‌షిప్ టెస్ట్ కోసం సీట్ రిజిస్టర్ చేద్దామా?",
      closing: "చాలా సంతోషం అండి, టెస్ట్ సిలబస్ మరియు మోడల్ పేపర్స్ వాట్సాప్‌కి పంపించాము.",
    },
    defaultProspects: (company: string) => [
      {
        name: "సురేష్ రెడ్డి (Suresh Reddy)",
        phone: "+91 98765 00102",
        need: "JEE Mains & Inter Coaching for son",
        notes: "Son scored 92% in 10th boards",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 44,
        audio_url: "/audio/demo_call_2.wav",
        transcript: `హలో, ${company} అడ్మిషన్స్ డెస్క్. చెప్పండి అండి. మేడం, నా కొడుకు టెన్త్ క్లాస్ కంప్లీట్ చేశాడు. ఇంటర్మీడియట్ తో పాటు JEE మెయిన్స్ కోచింగ్ ఫీజు ఎంత ఉంటుంది? సురేష్ గారు, మన దగ్గర టూ ఇయర్ ఇంటిగ్రేటెడ్ బ్యాచ్ ఉంది. ఈ వారం స్కాలర్‌షిప్ టెస్ట్ రాస్తే 25% discount వస్తుంది. ఫీజు కొంచెం ఎక్కువగానే ఉంది కానీ క్వాలిటీ ముఖ్యం. టెస్ట్ డేట్ ఎప్పుడు మేడం? ఈ ఆదివారం ఉదయం 10 గంటలకి అండి. సరే మేడం, శుక్రవారం లోపు రిజిస్ట్రేషన్ చేయిస్తాను.`,
        key_quote: "ఫీజు కొంచెం ఎక్కువగానే ఉంది కానీ క్వాలిటీ ముఖ్యం, శుక్రవారం లోపు రిజిస్ట్రేషన్ చేయిస్తాను.",
        call_time: "Today 10:45 AM",
      },
      {
        name: "మాధవి (Madhavi)",
        phone: "+91 98765 00104",
        need: "NEET Long Term Batch with Hostel",
        notes: "Daughter NEET repeat batch",
        call_status: "closed",
        outcome: "won",
        duration_seconds: 39,
        audio_url: "/audio/demo_call_1.wav",
        transcript: `నమస్తే మాధవి గారు, ${company} నీట్ లాంగ్ టర్మ్ బ్యాచ్ సీట్లు కొన్నే ఉన్నాయి. హాస్టల్ మరియు ఫుడ్ ఎలా ఉంటుంది సర్? మా క్యాంపస్ లో లేడీస్ హాస్టల్ సెక్యూరిటీతో ఉంది. రేపు విజిట్ చేయండి. సరే రేపు ఉదయం 10 కి హాస్టల్ చూడటానికి వస్తున్నాం.`,
        key_quote: "రేపు ఉదయం 10 కి హాస్టల్ చూడటానికి వస్తున్నాం, సీట్ హోల్డ్ చేయండి.",
        call_time: "Today 11:20 AM",
      },
      {
        name: "అరుణ్ (Arun)",
        phone: "+91 97000 88112",
        need: "Spoken English & Campus Placement Training",
        notes: "Final year BTech student",
        call_status: "ongoing",
        outcome: "pending",
        duration_seconds: 15,
        audio_url: "/audio/demo_call_3.wav",
        transcript: `డెమో క్లాస్ సమయం గురించి చర్చిస్తున్నారు...`,
        key_quote: "ఈవెనింగ్ బ్యాచ్ టైమింగ్స్ ఖాళీగా ఉన్నాయా?",
        call_time: "Now (Live Dialing)",
      },
      {
        name: "రాజేష్ (Rajesh)",
        phone: "+91 94401 22334",
        need: "Civils & Group-1 Foundation Batch",
        notes: "Degree completed candidate",
        call_status: "queued",
        outcome: "pending",
        duration_seconds: 0,
        call_time: "Queued for Forwarding Call",
      },
    ],
  },
};

/**
 * Creates sector-tailored campaign prospects in SQLite and syncs to Firebase
 */
export async function seedSectorCampaign(
  companyName: string = "Ishiva digital",
  sectorKeyOrCustom: string = "Digital Marketing & Agency",
  voiceName: string = "Shivani",
  languageModeId: string = "te-en"
): Promise<{ count: number; metrics: CampaignMetrics; prospects: ColdCallProspect[]; script?: any }> {
  const langMode = getLanguageMode(languageModeId);
  const voiceDef = ALL_VOICES.find(v => v.id.toLowerCase() === voiceName.toLowerCase()) || ALL_VOICES[0];
  const timbreLanguage = langMode.timbreLanguageCode || voiceDef.language || "te-IN";

  // Find matching sector or use digital_marketing / fallback
  let sector = SECTORS[sectorKeyOrCustom];
  if (!sector) {
    // Check if it matches label or custom
    const match = Object.values(SECTORS).find(s => 
      s.label.toLowerCase() === sectorKeyOrCustom.toLowerCase() ||
      s.id.toLowerCase() === sectorKeyOrCustom.toLowerCase()
    );
    sector = match || {
      id: "custom",
      label: sectorKeyOrCustom,
      teluguLabel: sectorKeyOrCustom,
      script: {
        greeting: `నమస్కారం {name} గారు, నేను ${companyName} నుండి మాట్లాడుతున్నాను. బాగున్నారా?`,
        pitch: `మీరు విచారించిన సర్వీస్ గురించి ప్రత్యేక ఆఫర్ మరియు డిస్కౌంట్ ఈ వారం మా వద్ద అందుబాటులో ఉంది.`,
        question: `మరిన్ని వివరాల కోసం రేపు ఉదయం 11:00 గంటలకు ఫోన్‌లో మాట్లాడగలరా?`,
        closing: `చాలా ధన్యవాదాలు! పూర్తి బ్రోచర్ మరియు వివరాలు మీ వాట్సాప్‌కి పంపించాము.`,
      },
      defaultProspects: (company: string) => [
        {
          name: "రమేష్ కుమార్ (Ramesh Kumar)",
          phone: "+91 98490 12345",
          need: `${sectorKeyOrCustom} ప్రీమియం సర్వీస్ ఎంక్వైరీ`,
          notes: "High intent customer inquiry",
          call_status: "closed",
          outcome: "won",
          duration_seconds: 37,
          audio_url: "/audio/demo_call_1.wav",
          transcript: `నమస్కారం అండి, ${company} నుండి కాల్ చేస్తున్నాం. మీరు మా సర్వీస్ వివరాల కోసం చూశారు కదా? అవునండి, ధర మరియు ప్యాకేజీ ఎలా ఉంటుంది? మన దగ్గర స్పెషల్ ఆఫర్ ఉంది సర్. రేపు 11 AM కి డీటెయిల్స్ పంపమంటారా? తప్పకుండా పంపించండి, డీల్ కన్ఫర్మ్ చేసుకుందాం.`,
          key_quote: "తప్పకుండా పంపించండి, డీల్ కన్ఫర్మ్ చేసుకుందాం.",
          call_time: "Today 10:15 AM",
        },
        {
          name: "ప్రియదర్శిని (Priyadarshini)",
          phone: "+91 99887 23456",
          need: `${sectorKeyOrCustom} కన్సల్టేషన్ & కోట్ రిక్వెస్ట్`,
          notes: "Looking for customized solution",
          call_status: "closed",
          outcome: "won",
          duration_seconds: 40,
          audio_url: "/audio/demo_call_2.wav",
          transcript: `హలో ప్రియదర్శిని గారు, ${company} కన్సల్టేషన్ డెస్క్ నుండి. పూర్తి కొటేషన్ రేపు సాయంత్రం లోపు పంపిస్తాం. సరే సర్, వాట్సాప్‌కి పంపండి వెంటనే చూస్తాను.`,
          key_quote: "వాట్సాప్‌కి కొటేషన్ పంపండి వెంటనే చూస్తాను.",
          call_time: "Today 11:00 AM",
        },
        {
          name: "విక్రమ్ వర్మ (Vikram Varma)",
          phone: "+91 97000 34567",
          need: `${sectorKeyOrCustom} సర్వీస్ ధర ఎంక్వైరీ`,
          notes: "Price comparison query",
          call_status: "closed",
          outcome: "lost",
          duration_seconds: 22,
          audio_url: "/audio/sample_recap.wav",
          transcript: `ధర ఎక్కువగా ఉందని చెప్పారు, ప్రస్తుతం అవసరం లేదని తెలియజేశారు.`,
          key_quote: "ధర కొంచెం ఎక్కువ అనిపిస్తుంది, తర్వాత ఆలోచిస్తాను.",
          call_time: "Today 11:30 AM",
        },
        {
          name: "సురేఖ (Surekha)",
          phone: "+91 96111 45678",
          need: `${sectorKeyOrCustom} అర్జెంట్ సర్వీస్ బుకింగ్`,
          notes: "Live call in progress",
          call_status: "ongoing",
          outcome: "pending",
          duration_seconds: 25,
          audio_url: "/audio/demo_call_3.wav",
          transcript: `ఏజెంట్ ప్రస్తుతం సురేఖ గారితో లైవ్ సంభాషణలో ఉన్నారు...`,
          key_quote: "ఈ శనివారంలోపు సర్వీస్ పూర్తి చేయగలరా?",
          call_time: "Now (Live Dialing)",
        },
        {
          name: "వెంకటేశ్ (Venkatesh)",
          phone: "+91 91234 56789",
          need: `${sectorKeyOrCustom} వీక్లీ ఫాలో-అప్`,
          notes: "Pending call",
          call_status: "queued",
          outcome: "pending",
          duration_seconds: 0,
          call_time: "Queued for Forwarding Call",
        },
      ],
    };
  }

  // 1. Attempt dynamic LLM campaign generation via Gemini 2.5 Flash
  let rawProspects: Omit<ColdCallProspect, "id">[] | null = null;
  let activeScript: any = sector.script;

  try {
    const llmCampaign = await generateCampaignWithGemini(companyName, sectorKeyOrCustom, voiceName, languageModeId);
    if (llmCampaign && llmCampaign.prospects && llmCampaign.prospects.length >= 4) {
      rawProspects = llmCampaign.prospects.map((p) => ({
        ...p,
        name: cleanCustomerName(p.name),
      }));
      activeScript = llmCampaign.script;
    }
  } catch (llmErr) {
    console.warn("Dynamic campaign generation failed, using sector fallback:", llmErr);
  }

  if (!rawProspects) {
    rawProspects = sector.defaultProspects(companyName).map((p) => ({
      ...p,
      name: cleanCustomerName(p.name),
    }));
  }

  // 2. Synthesize authentic full call speech for the first featured lead
  // Additional leads synthesize on-demand via /api/call-audio to avoid 429 concurrency bottlenecks
  let upfrontSynthesized = 0;
  for (let i = 0; i < rawProspects.length; i++) {
    const p = rawProspects[i];
    // Strip any legacy demo audio paths so stale voices are never played
    if (p.audio_url?.includes("demo_call") || p.audio_url?.includes("sample_recap")) {
      p.audio_url = "";
    }

    if ((p.call_status === "closed" || p.call_status === "ongoing") && !p.audio_url && upfrontSynthesized < 1) {
      try {
        const textToSpeak = extractFullCallSpeechText(p, voiceDef.name, companyName, activeScript);
        const synthRes = await synthesizeDialogueAudio({
          transcript: textToSpeak,
          customerName: p.name,
          agentVoiceId: voiceDef.id,
          companyName: companyName,
          languageCode: timbreLanguage,
        });
        p.audio_url = synthRes.audioUrl;
        upfrontSynthesized++;
      } catch (synthErr) {
        console.warn(`Upfront full synthesis for ${p.name} failed:`, synthErr);
        p.audio_url = "";
      }
    }
  }

  // 3. Clear existing campaign table and regenerate fresh leads
  db.prepare("DELETE FROM cold_call_campaigns").run();

  const insert = db.prepare(`
    INSERT INTO cold_call_campaigns (
      id, name, phone, need, notes, call_status, outcome, duration_seconds, transcript, audio_url, key_quote, call_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const prospects: ColdCallProspect[] = [];

  for (let i = 0; i < rawProspects.length; i++) {
    const p = rawProspects[i];
    const id = `prospect_${Date.now()}_${i}`;
    const cleanName = cleanCustomerName(p.name);

    insert.run(
      id,
      cleanName,
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

    prospects.push({ id, ...p, name: cleanName });
  }

  // Update business_name, business_type, voice, and active_script in settings
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('business_name', ?)").run(companyName);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('business_type', ?)").run(sector.label || sectorKeyOrCustom);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('voice', ?)").run(voiceName);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('language', ?)").run(languageModeId);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('timbre_language', ?)").run(timbreLanguage);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_script', ?)").run(JSON.stringify(activeScript));

  // 4. Synchronize campaign calls and leads into primary storage for /calls and /leads
  syncCampaignCallsToDb(companyName, timbreLanguage);

  const metrics = calculateCampaignMetrics(prospects);

  // Sync to Firebase Realtime Database
  syncRealtimeDb("campaign/prospects", prospects);
  syncRealtimeDb("campaign/metrics", metrics);

  return {
    count: prospects.length,
    metrics,
    prospects,
    script: activeScript,
  };
}

/**
 * Synchronizes active outbound campaign recordings directly into calls and leads tables.
 * This guarantees that Recordings & Transcripts (/calls) and Lead Details (/leads/[id])
 * immediately reflect the current business domain, voice persona, and full-length synthesized audio
 * rather than showing older stale demo versions.
 */
export function syncCampaignCallsToDb(companyName?: string, languageCode?: string) {
  try {
    const company = companyName || (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || "Our Business";
    const lang = languageCode || (db.prepare("SELECT value FROM settings WHERE key = 'timbre_language'").get() as any)?.value || "te-IN";

    // 1. Remove obsolete demo placeholder calls
    db.prepare("DELETE FROM calls WHERE id LIKE 'demo_call_%'").run();
    db.prepare("DELETE FROM leads WHERE call_id LIKE 'demo_call_%'").run();

    // 2. Fetch all campaign prospects with call activity (closed or ongoing)
    const prospects = db.prepare("SELECT * FROM cold_call_campaigns WHERE call_status IN ('closed', 'ongoing')").all() as any[];

    const insertCall = db.prepare(`
      INSERT OR REPLACE INTO calls (
        id, filename, original_name, file_path, file_hash, duration_seconds,
        language_code, status, transcript, detected_language, audio_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertLead = db.prepare(`
      INSERT OR REPLACE INTO leads (
        id, call_id, customer_name, need, budget, objections, urgency,
        next_step, follow_up_date, key_quote, follow_up_message, status, audio_url,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const p of prospects) {
      const cleanName = cleanCustomerName(p.name);
      const resolvedAudioUrl = p.audio_url || `/api/call-audio?prospectId=${encodeURIComponent(p.id)}`;
      const filename = p.audio_url ? p.audio_url.split("/").pop() || `${p.id}.wav` : `${p.id}.wav`;
      const filePath = p.audio_url ? path.join(process.cwd(), "public", p.audio_url.replace(/^\//, "")) : "";

      insertCall.run(
        p.id,
        filename,
        `${cleanName} - ${company} Outbound Call.wav`,
        filePath,
        `campaign_${p.id}`,
        p.duration_seconds || 35,
        lang,
        p.call_status === "closed" ? "completed" : "in_progress",
        p.transcript || "",
        lang,
        resolvedAudioUrl
      );

      insertLead.run(
        `lead_${p.id}`,
        p.id,
        cleanName,
        p.need,
        p.outcome === "won" ? "High Intent / Qualified" : "Standard Inquirer",
        JSON.stringify([p.key_quote || "Standard inquiry"]),
        p.outcome === "won" ? "high" : "medium",
        p.notes || "Follow-up catalog sent via WhatsApp",
        p.call_time || "Today",
        p.key_quote || "",
        `నమస్కారం ${cleanName} గారు, ${company} నుండి మా సంభాషణ వివరాలు పంపిస్తున్నాము. ధన్యవాదాలు!`,
        p.outcome === "won" ? "qualified" : "contacted",
        resolvedAudioUrl
      );
    }
  } catch (err) {
    console.warn("Failed to sync campaign calls to SQLite storage:", err);
  }
}

