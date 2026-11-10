export interface VirtualScript {
  id: string;
  name: string;
  language: string;
  recommendedVoice: string;
  greeting: string;
  pitch: string;
  question: string;
  objectionResponse: string;
  closing: string;
}

export const DEFAULT_VIRTUAL_SCRIPTS: Record<string, VirtualScript> = {
  aditya_admissions: {
    id: "aditya_admissions",
    name: "Aditya University - 24/7 B.Tech Admissions & Parent Desk",
    language: "te-IN",
    recommendedVoice: "Shivani",
    greeting: "నమస్కారం {name} గారు, నేను ఆదిత్య యూనివర్సిటీ 24/7 అడ్మిషన్స్ & పేరెంట్ హెల్ప్‌లైన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను. బాగున్నారా?",
    pitch: "మీరు {need} గురించి వివరాలు తెలుసుకోవడానికి రిక్వెస్ట్ చేశారు కదా. మా సూరంపాలెం క్యాంపస్ లో 4-సంవత్సరాల B.Tech కోర్సులు (CSE, AI&ML, Data Science, ECE), టెక్నికల్ హబ్ మరియు స్కాలర్‌షిప్స్ అందుబాటులో ఉన్నాయి.",
    question: "మీ అబ్బాయి లేదా అమ్మాయి EAPCET ర్యాంక్ లేదా ఇంటర్ మార్కుల ఆధారంగా ఫీజు రాయితీ మరియు సీట్ కన్ఫర్మ్ చేసుకోవడానికి ఈ శనివారం క్యాంపస్ విజిట్ చేయగలరా?",
    objectionResponse: "హాస్టల్ భద్రత మరియు ఫీజుల గురించి నిశ్చింతగా ఉండండి, బాయ్స్ మరియు గర్ల్స్ కి 24/7 సెక్యూరిటీతో AC మరియు Non-AC హాస్టల్స్, మెరిట్ స్కాలర్‌షిప్స్ ఉన్నాయి.",
    closing: "చాలా సంతోషం అండి! ఆదిత్య యూనివర్సిటీ B.Tech బ్రోచర్, ప్లేస్‌మెంట్ రికార్డులు (3000+ Placements) మరియు హాస్టల్ వివరాలు మీ వాట్సాప్‌కి పంపించాము. ధన్యవాదాలు!",
  },
  telugu_high_english: {
    id: "telugu_high_english",
    name: "High-English Telugu Sales Agent",
    language: "te-IN",
    recommendedVoice: "Shivani",
    greeting: "Hello {name} గారు, నేను {company} నుండి కాల్ చేస్తున్నాను. బాగున్నారా?",
    pitch: "మీరు {need} గురించి ఎంక్వైరీ చేశారు కదా. మీ బిజినెస్ కి బెస్ట్ ROI వచ్చేలా మా దగ్గర స్పెషల్ గ్రోత్ ఆఫర్ ఉంది.",
    question: "ఒక 5 నిమిషాల quick demo లేదా strategy discussion కోసం రేపు morning 11 AM కి Zoom call plan చేసుకుందామా?",
    objectionResponse: "Budget & implementation గురించి అస్సలు worry అవ్వకండి, flexible monthly plans & free support ఉన్నాయి.",
    closing: "Great అండి! Case studies & quotation మీ WhatsApp కి send చేశాను. రేపు morning 11 AM కి call లో కలుద్దాం. Thank you!",
  },
  telugu_general: {
    id: "telugu_general",
    name: "Telugu Sales & Consultation",
    language: "te-IN",
    recommendedVoice: "Shivani",
    greeting: "నమస్కారం {name} గారు, నేను {company} నుండి మాట్లాడుతున్నాను. మీరు బాగున్నారా?",
    pitch: "మీరు {need} గురించి చూశారు కదా. ఈ వారం మా దగ్గర స్పెషల్ ఆఫర్ మరియు ఫ్రీ కన్సల్టేషన్ నడుస్తోంది.",
    question: "దీనిపై మరింత సమాచారం కోసం రేపు ఉదయం 11:00 గంటలకు 5 నిమిషాలు మాట్లాడగలరా?",
    objectionResponse: "ధర విషయంలో ఎటువంటి ఆందోళన వద్దు, మా దగ్గర అనుకూలమైన EMI మరియు ఫ్లెక్సిబుల్ స్లాట్స్ ఉన్నాయి.",
    closing: "చాలా సంతోషం అండి, మీ అపాయింట్‌మెంట్ కన్ఫర్మ్ చేశాను. పూర్తి వివరాలు మరియు లొకేషన్ మీ వాట్సాప్‌కి పంపాము. ధన్యవాదాలు!",
  },
  hindi_sales: {
    id: "hindi_sales",
    name: "Hindi Customer Outreach",
    language: "hi-IN",
    recommendedVoice: "Kalpana",
    greeting: "नमस्ते {name} जी, मैं {company} से बात कर रही हूँ। आशा है आप अच्छे होंगे।",
    pitch: "आपने हाल ही में {need} के बारे में जानकारी माँगी थी। इस हफ़्ते हमारे यहाँ विशेष छूट और मुफ़्त परामर्श उपलब्ध है।",
    question: "क्या कल सुबह 11 बजे हमारे विशेषज्ञ से 5 मिनट की बातचीत आपके लिए सुविधाजनक रहेगी?",
    objectionResponse: "बजट और समय को लेकर निश्चिंत रहें, हमारे पास आसान किश्तें और सुविधाजनक समय उपलब्ध हैं।",
    closing: "बहुत-बहुत धन्यवाद! आपका समय सुरक्षित कर लिया गया है और विवरण आपके व्हाट्सएप पर भेज दिए गए हैं।",
  },
  english_consultative: {
    id: "english_consultative",
    name: "Indian English Consultative Outreach",
    language: "en-IN",
    recommendedVoice: "Riyaa",
    greeting: "Hello {name}, this is calling from {company}. I hope you are having a productive day.",
    pitch: "We received your inquiry regarding {need}. We currently have an exclusive package and priority onboarding available this week.",
    question: "Would you be available for a brief 5-minute walkthrough tomorrow around 11 AM?",
    objectionResponse: "We completely understand your budget considerations. We have flexible instalment and trial options available.",
    closing: "Wonderful! We have booked your consultation slot and sent the confirmation brochure to your WhatsApp. Have a great day!",
  },
  hinglish_retail: {
    id: "hinglish_retail",
    name: "Hinglish Conversational",
    language: "hi-en",
    recommendedVoice: "Devansh",
    greeting: "Namaste {name} ji, main {company} se baat kar raha hoon. Kaise hain aap?",
    pitch: "Aapne {need} ke baare me inquiry ki thi. Is festival season me hamare paas special discount chal raha hai.",
    question: "Kya aap kal lunch ke baad 2 baje test drive ya store visit ke liye free hain?",
    objectionResponse: "Budget ki koi tension nahi hai, zero down payment aur zero percent interest options available hain.",
    closing: "Bahut badhiya! Aapka slot reserve ho gaya hai aur catalogue WhatsApp pe share kar diya hai. Thank you!",
  },
  tamil_outreach: {
    id: "tamil_outreach",
    name: "Tamil Business Outreach",
    language: "ta-IN",
    recommendedVoice: "Asmita",
    greeting: "வணக்கம் {name} அவர்களே, நான் {company}-லிருந்து அழைக்கிறேன். நலமாக இருக்கிறீர்களா?",
    pitch: "நீங்கள் {need} பற்றி விசாரித்திருந்தீர்கள். இந்த வாரம் சிறப்பு தள்ளுபடி சலுகை வழங்கப்படுகிறது.",
    question: "நாளை காலை 11 மணிக்கு எங்கள் ஆலோசகருடன் பேச முடியுமா?",
    objectionResponse: "கட்டணம் பற்றி கவலை வேண்டாம், எங்களிடம் எளிய தவணை முறைகள் உள்ளன.",
    closing: "மிக்க நன்றி! உங்கள் முன்பதிவு உறுதியானது, விவரங்கள் வாட்ஸ்அப்பில் அனுப்பப்பட்டுள்ளன.",
  },
  kannada_outreach: {
    id: "kannada_outreach",
    name: "Kannada Customer Outreach",
    language: "kn-IN",
    recommendedVoice: "Vasudha",
    greeting: "ನಮಸ್ಕಾರ {name} ಅವರೇ, ನಾನು {company} ಇಂದ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ಹೇಗಿದ್ದೀರಿ?",
    pitch: "ನೀವು {need} ಬಗ್ಗೆ ವಿಚಾರಿಸಿದ್ದೀರಿ. ಈ ವಾರ ನಮ್ಮಲ್ಲಿ ವಿಶೇಷ ರಿಯಾಯಿತಿ ಮತ್ತು ಉಚಿತ ಸಲಹೆ ಲಭ್ಯವಿದೆ.",
    question: "ನಾಳೆ ಬೆಳಿಗ್ಗೆ 11 ಗಂಟೆಗೆ ನಮ್ಮ ತಜ್ಞರೊಂದಿಗೆ ಮಾತನಾಡಲು ಸಮಯವಾಗುತ್ತದೆಯೇ?",
    objectionResponse: "ಖರ್ಚಿನ ಬಗ್ಗೆ ಚಿಂತಿಸಬೇಡಿ, ನಮ್ಮಲ್ಲಿ ಸುಲಭ ಕಂತುಗಳ ವ್ಯವಸ್ಥೆಯಿದೆ.",
    closing: "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಸಮಯವನ್ನು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ ಮತ್ತು ವಿವರಗಳನ್ನು ವಾಟ್ಸಾಪ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.",
  },
};

/**
 * Replace placeholders like {name}, {company}, {need} in a script template
 */
export function renderScript(
  template: string,
  variables: { name: string; company: string; need: string }
): string {
  return template
    .replace(/\{name\}/g, variables.name || "Customer")
    .replace(/\{company\}/g, variables.company || "Our Business")
    .replace(/\{need\}/g, variables.need || "your service inquiry");
}
