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
    persona: "Warm, Empathetic Counselor",
    description: "Gentle, reassuring tone. Admissions Officer & Parent Desk Counselor for Aditya University.",
    sampleText: "నమస్కారం అండి! ఆదిత్య యూనివర్సిటీ సూరంపాలెం క్యాంపస్ B.Tech అడ్మిషన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను. మీకు ఎలా సహాయపడగలను?",
  },
  {
    id: "Lakshmi",
    name: "Lakshmi",
    gender: "Female",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Expressive, Academic Lead",
    description: "Lively academic counselor tone. Best for curriculum explanations and Technical Hub live coding.",
    sampleText: "హలో అండి, ఆదిత్య యూనివర్సిటీ టెక్నికల్ హబ్ లో ఫస్ట్ ఇయర్ నుండే అమెజాన్, సిస్కో లైవ్ కోడింగ్ సర్టిఫికేషన్స్ అందిస్తున్నాము.",
  },
  {
    id: "Avinash",
    name: "Avinash",
    gender: "Male",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Authoritative Telugu Father / Uncle",
    description: "Mature, deliberate pacing. Authentic Telugu parent voice inquiring about engineering seats.",
    sampleText: "నమస్తే అండి, మా అబ్బాయి B.Tech అడ్మిషన్ కోసం కాల్ చేశాను. నాక్ A++ గుర్తింపు మరియు క్యాంపస్ ప్లేస్‌మెంట్స్ వివరాలు చెప్పగలరా?",
  },
  {
    id: "Prakash",
    name: "Prakash",
    gender: "Male",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Resonant, Telugu Father / Uncle",
    description: "Deep, persuasive voice. Authentic parent inquiring about merit scholarships and rankings.",
    sampleText: "నమస్కారం అండి, మా అబ్బాయికి ఇంటర్ లో 954 మార్కులు వచ్చాయి. ఆదిత్య యూనివర్సిటీలో 25% మెరిట్ స్కాలర్‌షిప్ లభిస్తుందా సర్?",
  },
  {
    id: "Shubham",
    name: "Shubham",
    gender: "Male",
    model: "timbre-v3.0",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Energetic Admissions Officer",
    description: "Dynamic and enthusiastic. Best for campus tours, lab demonstrations, and placement statistics.",
    sampleText: "నమస్కారం సర్, ఆదిత్య యూనివర్సిటీ సూరంపాలెం క్యాంపస్ లో 180 ఎకరాల విస్తీర్ణంలో అత్యాధునిక ఇన్నోవేషన్ ల్యాబ్స్ మరియు నాక్ A++ గుర్తింపు ఉన్నాయి.",
  },
  {
    id: "Lavanya",
    name: "Lavanya",
    gender: "Female",
    model: "timbre-v2.5",
    language: "te-IN",
    languageLabel: "Telugu",
    persona: "Warm Telugu Mother / Aunty",
    description: "Authentic Telugu mother voice inquiring about girl student hostel safety and Data Science syllabus.",
    sampleText: "నమస్తే శివాని గారు, మా అమ్మాయి కోసం B.Tech ECE కరికులం మరియు సూరంపాలెం గర్ల్స్ హాస్టల్ భద్రత వివరాలు తెలుసుకోవడానికి కాల్ చేశాను మేడం.",
  },

  // --- Hindi (हिन्दी) ---
  {
    id: "Kalpana",
    name: "Kalpana",
    gender: "Female",
    model: "timbre-v3.0",
    language: "hi-IN",
    languageLabel: "Hindi",
    persona: "Empathetic, Composed Mother",
    description: "Mature and composed voice for academic support and admissions inquiries.",
    sampleText: "नमस्ते! आदित्य यूनिवर्सिटी में बी.टेक एडमिशन और हॉस्टल सुविधाओं की पूरी जानकारी के लिए आपका स्वागत है।",
  },
  {
    id: "Deepak",
    name: "Deepak",
    gender: "Male",
    model: "timbre-v2.5",
    language: "hi-IN",
    languageLabel: "Hindi",
    persona: "Clear, Corporate",
    description: "Authoritative Hindi voice with accurate academic pronunciation.",
    sampleText: "नमस्कार! आदित्य यूनिवर्सिटी बी.टेक कंप्यूटर साइंस और एआई इंजीनियरिंग के बारे में हम आपकी पूरी सहायता करेंगे।",
  },
  {
    id: "Suhana",
    name: "Suhana",
    gender: "Female",
    model: "timbre-v2.5",
    language: "hi-IN",
    languageLabel: "Hindi",
    persona: "Gentle, Friendly Mother",
    description: "Warm Hindi voice with natural cadence, ideal for campus visits and scholarship bookings.",
    sampleText: "नमस्ते जी, आदित्य यूनिवर्सिटी सुरमपालेम कैंपस विज़िट और काउंसलिंग के लिए आप शनिवार को आ सकते हैं।",
  },

  // --- Indian English ---
  {
    id: "Riyaa",
    name: "Riyaa",
    gender: "Female",
    model: "timbre-v3.0",
    language: "en-IN",
    languageLabel: "Indian English",
    persona: "Confident Admissions Officer",
    description: "Sharp, confident counselor tone for student inquiries and program brochures.",
    sampleText: "Hello! Welcome to Aditya University B.Tech Admissions Desk. How can I assist you with programs, fees, and campus tours today?",
  },
  {
    id: "Harshad",
    name: "Harshad",
    gender: "Male",
    model: "timbre-v3.0",
    language: "en-IN",
    languageLabel: "Indian English",
    persona: "Executive Admissions Director",
    description: "Executive-level authority and clear articulation for university rankings and industry partnerships.",
    sampleText: "Good morning. Reaching out from Aditya University Admissions Office regarding your B.Tech engineering inquiry and campus placements.",
  },
  {
    id: "Kaveri",
    name: "Kaveri",
    gender: "Female",
    model: "timbre-v2.5",
    language: "en-IN",
    languageLabel: "Indian English",
    persona: "Polished, Academic Guide",
    description: "Crisp Indian English diction with natural student counseling cadence.",
    sampleText: "Hello, thank you for inquiring about Aditya University. We have received your B.Tech Computer Science admission request.",
  },

  // --- Hinglish (Code-Mixed Hindi + English) ---
  {
    id: "Devansh",
    name: "Devansh",
    gender: "Male",
    model: "timbre-v3.0",
    language: "hi-en",
    languageLabel: "Hinglish",
    persona: "Conversational, Modern Counselor",
    description: "Relatable bilingual conversation for admissions counseling and tech hub inquiries.",
    sampleText: "Hello! Aditya University B.Tech admissions ke regarding call kiya hai, aapko curriculum details WhatsApp kar rahe hain.",
  },
  {
    id: "Poorvi",
    name: "Poorvi",
    gender: "Female",
    model: "timbre-v2.5",
    language: "hi-en",
    languageLabel: "Hinglish",
    persona: "Natural, Conversational Guide",
    description: "Specialized for natural code-mixed Hindi-English student conversations.",
    sampleText: "Hello ji! Aditya University Surampalem campus visit aur scholarship verification ke details hum share kar rahe hain.",
  },

  // --- Tamil (தமிழ்) ---
  {
    id: "Asmita",
    name: "Asmita",
    gender: "Female",
    model: "timbre-v2.5",
    language: "ta-IN",
    languageLabel: "Tamil",
    persona: "Polished, Academic",
    description: "Smooth, articulate Tamil voice for regional student admissions and counseling.",
    sampleText: "வணக்கம்! ஆதித்யா பல்கலைக்கழகம் பி.டெக் சேர்க்கை மற்றும் வளாக விவரங்களுக்கு உங்களை வரவேற்கிறோம்.",
  },

  // --- Kannada (ಕನ್ನಡ) ---
  {
    id: "Vasudha",
    name: "Vasudha",
    gender: "Female",
    model: "timbre-v3.0",
    language: "kn-IN",
    languageLabel: "Kannada",
    persona: "Soft, Respectful Counselor",
    description: "Gentle and respectful tone for B.Tech admission consultations.",
    sampleText: "ನಮಸ್ಕಾರ! ಆದಿತ್ಯ ವಿಶ್ವವಿದ್ಯಾಲಯದ ಬಿ.ಟೆಕ್ ಪ್ರವೇಶ ಮತ್ತು ಪಠ್ಯಕ್ರಮದ ವಿವರಗಳಿಗೆ ಸ್ವಾಗತ.",
  },

  // --- Marathi (मराठी) ---
  {
    id: "Varuni",
    name: "Varuni",
    gender: "Female",
    model: "timbre-v2.5",
    language: "mr-IN",
    languageLabel: "Marathi",
    persona: "Professional, Warm Counselor",
    description: "Warm, authentic Marathi voice for engineering inquiries.",
    sampleText: "नमस्कार! आदित्य युनिव्हर्सिटी बी.टेक ॲडमिशन आणि प्लेसमेंट माहितीसाठी आम्ही संपर्क साधला आहे.",
  },

  // --- Bengali (বাংলা) ---
  {
    id: "Lehara",
    name: "Lehara",
    gender: "Female",
    model: "timbre-v2.5",
    language: "bn-IN",
    languageLabel: "Bengali",
    persona: "Melodic, Engaging Guide",
    description: "Melodic Bengali accent ideal for educational admissions.",
    sampleText: "নমস্কার! আদিত্য ইউনিভার্সিটি বি.টেক ভর্তি এবং স্কলারশিপ সংক্রান্ত তথ্যের জন্য আপনাকে স্বাগতম।",
  },

  // --- Gujarati (ગુજરાતી) ---
  {
    id: "Chetana",
    name: "Chetana",
    gender: "Female",
    model: "timbre-v3.0",
    language: "gu-IN",
    languageLabel: "Gujarati",
    persona: "Energetic, Welcoming Counselor",
    description: "Friendly and welcoming tone for prospective students and parents.",
    sampleText: "નમસ્તે! આદિત્ય યુનિવર્સિટી બી.ટેક એડમિશન અને હોસ્ટેલ માહિતી માટે તમારું સ્વાગત છે.",
  },
];
