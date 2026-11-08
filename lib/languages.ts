export interface LanguageMode {
  id: string;
  label: string;
  name: string;
  timbreLanguageCode: string;
  defaultVoice: string;
  promptDescription: string;
  samplePhrase: string;
}

export const LANGUAGE_MODES: LanguageMode[] = [
  {
    id: "te-en",
    label: "Telugu + English (Combined / కోడ్-మిక్స్డ్)",
    name: "Telugu + English Combined",
    timbreLanguageCode: "te-IN",
    defaultVoice: "Shivani",
    promptDescription: "Natural High-English Telugu (code-mixed conversational Telugu with English business terms like ROI, budget, meeting, Zoom call, proposal, brochure). Example: 'Hello {name} గారు, నేను {company} నుండి కాల్ చేస్తున్నాను. బాగున్నారా?'",
    samplePhrase: "Hello {name} గారు, నేను {company} నుండి కాల్ చేస్తున్నాను.",
  },
  {
    id: "te-IN",
    label: "Pure Telugu (కేవలం తెలుగు)",
    name: "Pure Telugu",
    timbreLanguageCode: "te-IN",
    defaultVoice: "Shivani",
    promptDescription: "Pure authentic Telugu without unnecessary English words. Example: 'నమస్కారం {name} గారు, నేను {company} నుండి మాట్లాడుతున్నాను. మీరు బాగున్నారా?'",
    samplePhrase: "నమస్కారం {name} గారు, నేను {company} నుండి మాట్లాడుతున్నాను.",
  },
  {
    id: "hi-en",
    label: "Hindi + English (Hinglish / हिंग्लिश)",
    name: "Hindi + English Combined (Hinglish)",
    timbreLanguageCode: "hi-en",
    defaultVoice: "Devansh",
    promptDescription: "Conversational Hinglish (code-mixed Hindi + English popular in metro cities). Example: 'Hello {name} ji, main {company} se baat kar raha hoon. Aapne inquiry ki thi, kal meeting schedule kar sakte hain?'",
    samplePhrase: "Hello {name} ji, main {company} se baat kar raha hoon.",
  },
  {
    id: "hi-IN",
    label: "Pure Hindi (शुद्ध हिन्दी)",
    name: "Pure Hindi",
    timbreLanguageCode: "hi-IN",
    defaultVoice: "Kalpana",
    promptDescription: "Clear, professional Hindi. Example: 'नमस्ते {name} जी, मैं {company} से बात कर रही हूँ। आपकी व्यावसायिक पूछताछ के संबंध में हम आपसे संपर्क कर रहे हैं।'",
    samplePhrase: "नमस्ते {name} जी, मैं {company} से बात कर रही हूँ।",
  },
  {
    id: "en-IN",
    label: "Indian English (Corporate English)",
    name: "Indian English",
    timbreLanguageCode: "en-IN",
    defaultVoice: "Riyaa",
    promptDescription: "Professional Indian English for sales and consultations. Example: 'Hello {name}, this is calling from {company}. I hope you are having a productive day.'",
    samplePhrase: "Hello {name}, this is calling from {company}.",
  },
  {
    id: "ta-IN",
    label: "Tamil (தமிழ்)",
    name: "Tamil",
    timbreLanguageCode: "ta-IN",
    defaultVoice: "Asmita",
    promptDescription: "Natural commercial Tamil. Example: 'வணக்கம் {name} அவர்களே, நான் {company}-லிருந்து அழைக்கிறேன். நலமாக இருக்கிறீர்களா?'",
    samplePhrase: "வணக்கம் {name} அவர்களே, நான் {company}-லிருந்து அழைக்கிறேன்.",
  },
  {
    id: "mr-IN",
    label: "Marathi (मराठी)",
    name: "Marathi",
    timbreLanguageCode: "mr-IN",
    defaultVoice: "Varuni",
    promptDescription: "Natural commercial Marathi. Example: 'नमस्कार {name}, मी {company} कडून बोलत आहे. आपल्या सेवेच्या चौकशीबद्दल माहिती देण्यासाठी हा कॉल आहे.'",
    samplePhrase: "नमस्कार {name}, मी {company} कडून बोलत आहे.",
  },
  {
    id: "kn-IN",
    label: "Kannada (ಕನ್ನಡ)",
    name: "Kannada",
    timbreLanguageCode: "kn-IN",
    defaultVoice: "Vasudha",
    promptDescription: "Warm conversational Kannada. Example: 'ನಮಸ್ಕಾರ {name} ಅವರೇ, ನಾನು {company} ಇಂದ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ಹೇಗಿದ್ದೀರಿ?'",
    samplePhrase: "ನಮಸ್ಕಾರ {name} ಅವರೇ, ನಾನು {company} ಇಂದ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ.",
  },
  {
    id: "bn-IN",
    label: "Bengali (বাংলা)",
    name: "Bengali",
    timbreLanguageCode: "bn-IN",
    defaultVoice: "Lehara",
    promptDescription: "Melodic conversational Bengali. Example: 'নমস্কার {name}, আমি {company} থেকে কথা বলছি। আপনার অনুসন্ধান সম্পর্কে বিস্তারিত তথ্য জানাতে এই কল।'",
    samplePhrase: "নমস্কার {name}, আমি {company} থেকে কথা বলছি।",
  },
  {
    id: "gu-IN",
    label: "Gujarati (ગુજરાતી)",
    name: "Gujarati",
    timbreLanguageCode: "gu-IN",
    defaultVoice: "Chetana",
    promptDescription: "Warm commercial Gujarati. Example: 'નમસ્તે {name}, હું {company} માંથી વાત કરું છું. તમારા ઓર્ડર અને સેવા વિશે વાત કરવા માટે ફોન કર્યો છે.'",
    samplePhrase: "નમસ્તે {name}, હું {company} માંથી વાત કરું છું.",
  },
];

export function getLanguageMode(id: string): LanguageMode {
  return (
    LANGUAGE_MODES.find(
      (m) => m.id.toLowerCase() === id.toLowerCase() || m.timbreLanguageCode.toLowerCase() === id.toLowerCase()
    ) || LANGUAGE_MODES[0]
  );
}

