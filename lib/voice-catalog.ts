export interface VoiceDefinition {
  id: string;
  name: string;
  gender: "Female" | "Male";
  model: "timbre-v3.0" | "timbre-v2.5";
  language: string; // e.g. "te-IN", "en-IN", "hi-IN", "hi-en", "ta-IN", "kn-IN", "mr-IN", "bn-IN", "gu-IN"
  languageLabel: string;
  persona: string;
  description: string;
  sampleText: string;
}

export const ALL_VOICES: VoiceDefinition[] = [
  // --- Telugu (తెలుగు) ---
  {
    id: "Shivani",
    name: "Shivani",
    gender: "Female",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Warm, Empathetic",
    description: "Gentle, reassuring tone. Ideal for dental clinics, healthcare, and patient care.",
    sampleText: "నమస్కారం అండి, స్మైల్ డెంటల్ కేర్ నుండి కాల్ చేస్తున్నాను. మీకు ఎలా సహాయపడగలను?",
  },
  {
    id: "Lakshmi",
    name: "Lakshmi",
    gender: "Female",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Expressive, Energetic",
    description: "Lively, expressive narrative tone. Great for coaching academies and education.",
    sampleText: "హలో అండి, విజేత అకాడమీ నుండి మాట్లాడుతున్నాం. మా స్కాలర్‌షిప్ టెస్ట్ వివరాలు ఇక్కడ ఉన్నాయి.",
  },
  {
    id: "Avinash",
    name: "Avinash",
    gender: "Male",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Professional, Firm",
    description: "Firm, deliberate pacing. Ideal for real estate, banking, and open plots inquiries.",
    sampleText: "నమస్తే అండి, శ్రీ సాయి ప్రాపర్టీస్ నుండి వెంకటేష్ మాట్లాడుతున్నాను. హైవే ప్లాట్స్ వివరాలు చూడండి.",
  },
  {
    id: "Shubham",
    name: "Shubham",
    gender: "Male",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Energetic, Young",
    description: "Dynamic and enthusiastic. Best for two-wheeler showrooms, festive offers, and retail.",
    sampleText: "నమస్కారం సర్, శ్రీనివాస హోండా నుండి కిషోర్ మాట్లాడుతున్నాను. ఆక్టివా ఆఫర్స్ వివరాలు పంపుతున్నాను.",
  },

  // --- Hindi (हिन्दी) ---
  {
    id: "Kalpana",
    name: "Kalpana",
    gender: "Female",
    model: "timbre-v3.0",
    language: "hi-IN",
    languageLabel: "Hindi",
    persona: "Empathetic, Composed",
    description: "Mature and composed voice for customer support and boutique appointments.",
    sampleText: "नमस्ते! आपकी हाल की पूछताछ के लिए हम आपसे संपर्क कर रहे हैं। क्या आप दो मिनट बात कर सकते हैं?",
  },
  {
    id: "Deepak",
    name: "Deepak",
    gender: "Male",
    model: "timbre-v2.5",
    language: "hi-IN",
    languageLabel: "Hindi",
    persona: "Clear, Corporate",
    description: "Authoritative Hindi voice with accurate corporate pronunciation.",
    sampleText: "नमस्कार! आपकी व्यावसायिक पूछताछ के संबंध में हम आपको यह जानकारी दे रहे हैं।",
  },
  {
    id: "Suhana",
    name: "Suhana",
    gender: "Female",
    model: "timbre-v2.5",
    language: "hi-IN",
    languageLabel: "Hindi",
    persona: "Gentle, Friendly",
    description: "Warm Hindi voice with natural cadence, ideal for patient outreach and bookings.",
    sampleText: "नमस्ते जी, हम आपके अपॉइंटमेंट कन्फर्मेशन के सिलसिले में संपर्क कर रहे हैं।",
  },

  // --- Indian English ---
  {
    id: "Riyaa",
    name: "Riyaa",
    gender: "Female",
    model: "timbre-v3.0",
    language: "en-IN",
    languageLabel: "Indian English",
    persona: "Confident, Lively",
    description: "Sharp, confident outbound sales tone. Perfect for high-velocity sales prospecting.",
    sampleText: "Hello there! Calling from your local business associate regarding your inquiry today.",
  },
  {
    id: "Harshad",
    name: "Harshad",
    gender: "Male",
    model: "timbre-v3.0",
    language: "en-IN",
    languageLabel: "Indian English",
    persona: "Corporate, Authoritative",
    description: "Executive-level authority and clear articulation for commercial inquiries.",
    sampleText: "Good morning. I am reaching out to confirm your scheduled consultation with our specialists.",
  },
  {
    id: "Kaveri",
    name: "Kaveri",
    gender: "Female",
    model: "timbre-v2.5",
    language: "en-IN",
    languageLabel: "Indian English",
    persona: "Polished, Professional",
    description: "Crisp Indian English diction with natural customer support cadence.",
    sampleText: "Hello, thank you for reaching out to us. We have received your consultation request.",
  },

  // --- Hinglish (Code-Mixed Hindi + English) ---
  {
    id: "Devansh",
    name: "Devansh",
    gender: "Male",
    model: "timbre-v3.0",
    language: "hi-en",
    languageLabel: "Hinglish",
    persona: "Conversational, Modern",
    description: "Relatable, casual bilingual conversation for young urban shoppers and fintech.",
    sampleText: "Hey there! Quick follow up regarding your service booking for this weekend.",
  },
  {
    id: "Poorvi",
    name: "Poorvi",
    gender: "Female",
    model: "timbre-v2.5",
    language: "hi-en",
    languageLabel: "Hinglish",
    persona: "Natural, Conversational",
    description: "Specialized for natural code-mixed Hindi-English conversations.",
    sampleText: "Hello ji! Aapki query ke regarding call kiya hai, kya aap do minute baat kar sakte hain?",
  },

  // --- Tamil (தமிழ்) ---
  {
    id: "Asmita",
    name: "Asmita",
    gender: "Female",
    model: "timbre-v2.5",
    language: "ta-IN",
    languageLabel: "Tamil",
    persona: "Polished, Refined",
    description: "Smooth, articulate Tamil voice for customer consultations and bookings.",
    sampleText: "வணக்கம்! உங்கள் சேவை முன்பதிவு பற்றிய விவரங்களை உறுதிப்படுத்த அழைக்கிறோம்.",
  },
  {
    id: "Prakash",
    name: "Prakash",
    gender: "Male",
    model: "timbre-v3.0",
    language: "ta-IN",
    languageLabel: "Tamil",
    persona: "Resonant, Trustworthy",
    description: "Deep, persuasive voice for advisory, real estate, and financial planning.",
    sampleText: "வணக்கம், உங்கள் முதலீட்டு விபரங்களை உங்களுக்கு வழங்க அழைக்கிறேன்.",
  },

  // --- Kannada (ಕನ್ನಡ) ---
  {
    id: "Vasudha",
    name: "Vasudha",
    gender: "Female",
    model: "timbre-v3.0",
    language: "kn-IN",
    languageLabel: "Kannada",
    persona: "Soft, Respectful",
    description: "Gentle and respectful tone for local retail, clinics, and customer services.",
    sampleText: "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಸೇವಾ ವಿಚಾರಣೆಯ ಬಗ್ಗೆ ಮಾತನಾಡಲು ನಾವು ಕರೆ ಮಾಡಿದ್ದೇವೆ.",
  },
  {
    id: "Lavanya",
    name: "Lavanya",
    gender: "Female",
    model: "timbre-v2.5",
    language: "kn-IN",
    languageLabel: "Kannada",
    persona: "Crisp, Clear",
    description: "Clear articulation for appointments and educational programs.",
    sampleText: "ಹಲೋ, ನಿಮ್ಮ ಮುಂಬರುವ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಲು ಈ ಕರೆ.",
  },

  // --- Marathi (मराठी) ---
  {
    id: "Varuni",
    name: "Varuni",
    gender: "Female",
    model: "timbre-v2.5",
    language: "mr-IN",
    languageLabel: "Marathi",
    persona: "Professional, Warm",
    description: "Warm, authentic Marathi voice for customer follow-ups and inquiries.",
    sampleText: "नमस्कार! आपल्या सेवेच्या चौकशीबद्दल माहिती देण्यासाठी आम्ही संपर्क साधला आहे.",
  },

  // --- Bengali (বাংলা) ---
  {
    id: "Lehara",
    name: "Lehara",
    gender: "Female",
    model: "timbre-v2.5",
    language: "bn-IN",
    languageLabel: "Bengali",
    persona: "Melodic, Engaging",
    description: "Melodic Bengali accent ideal for education, boutique, and lifestyle retail.",
    sampleText: "নমস্কার! আপনার অনুসন্ধান সম্পর্কে বিস্তারিত তথ্য জানাতে আমরা যোগাযোগ করছি।",
  },

  // --- Gujarati (ગુજરાતી) ---
  {
    id: "Chetana",
    name: "Chetana",
    gender: "Female",
    model: "timbre-v3.0",
    language: "gu-IN",
    languageLabel: "Gujarati",
    persona: "Energetic, Welcoming",
    description: "Friendly and welcoming tone for business deals and trade orders.",
    sampleText: "નમસ્તે! તમારા તાજેતરના ઓર્ડર અને સેવા માટે અમે તમારો સંપર્ક કરી રહ્યા છીએ.",
  },
];
