export interface SyntheticCallData {
  id: string;
  business: string;
  category: string;
  customerName: string;
  duration: number;
  transcript: string;
  lead: {
    customerName: string;
    need: string;
    budget: string;
    objections: string[];
    urgency: "low" | "medium" | "high";
    nextStep: string;
    followUpDate: string;
    keyQuote: string;
    followUpMessage: string;
  };
}

export const SYNTHETIC_CALLS: SyntheticCallData[] = [
  {
    id: "demo_call_1",
    business: "ఆదిత్య యూనివర్సిటీ (Aditya University)",
    category: "B.Tech Admissions Desk",
    customerName: "శ్రీనివాస రావు (Srinivasa Rao - Father of Sai Teja)",
    duration: 44,
    transcript: `Counselor: నమస్కారం అండి, ఆదిత్య యూనివర్సిటీ సూరంపాలెం క్యాంపస్ అడ్మిషన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను. శ్రీనివాస రావు గారేనా అండి?
Parent: నమస్తే మేడం, అవునండి. మా అబ్బాయి సాయి తేజ కి EAPCET లో 14,200 ర్యాంక్ వచ్చింది. సూరంపాలెం క్యాంపస్ లో B.Tech CSE AI&ML సీట్ కన్ఫర్మ్ అవుతుందా?
Counselor: తప్పకుండా శ్రీనివాస రావు గారు! మీ ర్యాంక్ కి CSE AI&ML సీట్ ఖచ్చితంగా కన్ఫర్మ్ అవుతుంది. మన ఆదిత్య టెక్నికల్ హబ్ లో అమెజాన్, సిస్కో టాప్ MNC లతో 3000 కు పైగా ప్లేస్‌మెంట్స్ వచ్చాయి.
Parent: చాలా మంచి విషయం మేడం. బాయ్స్ హాస్టల్ సౌకర్యాలు మరియు ఫీజు వివరాలు ఎలా ఉన్నాయి?
Counselor: హైజీనిక్ ఫుడ్, AC మరియు Non-AC హాస్టల్స్, మరియు 24/7 సెక్యూరిటీ ఉన్నాయి సర్. రేపు ఉదయం 10 గంటలకి నేరుగా క్యాంపస్ కి వచ్చి అడ్మిషన్ ఫారమ్ పూర్తి చేయవచ్చు.
Parent: చాలా సంతోషం మేడం! రేపు ఉదయం ఒరిజినల్ సర్టిఫికెట్స్ తో తప్పకుండా వస్తాం. థాంక్యూ!
Counselor: ధన్యవాదాలు శ్రీనివాస రావు గారు! రేపు క్యాంపస్ లో కలుద్దాం.`,
    lead: {
      customerName: "శ్రీనివాస రావు (Srinivasa Rao - Father of Sai Teja)",
      need: "B.Tech CSE (AI & Machine Learning) Seat Confirmation · 14,200 EAPCET Rank",
      budget: "Standard B.Tech Fee (Convenor Quota)",
      objections: ["హాస్టల్ సెక్యూరిటీ & హైజీనిక్ ఫుడ్ ఎంక్వైరీ"],
      urgency: "high",
      nextStep: "రేపు ఉదయం 10:00 కి ఒరిజినల్ సర్టిఫికెట్స్ తో క్యాంపస్ విజిట్ & సీట్ కన్ఫర్మేషన్",
      followUpDate: "రేపు ఉదయం 10:00 గంటలకు (Tomorrow 10 AM)",
      keyQuote: "మా అబ్బాయికి 14,200 ర్యాంక్ వచ్చింది, రేపు ఉదయం 10 గంటలకి నేరుగా క్యాంపస్ కి వచ్చి అడ్మిషన్ ఫారమ్ పూర్తి చేస్తాం.",
      followUpMessage: "నమస్తే శ్రీనివాస రావు గారు, ఆదిత్య యూనివర్సిటీ సూరంపాలెం క్యాంపస్ లో B.Tech CSE AI&ML సీట్ రిజర్వేషన్ వివరాలు మరియు లొకేషన్ పంపాము.",
    }
  },
  {
    id: "demo_call_2",
    business: "ఆదిత్య యూనివర్సిటీ (Aditya University)",
    category: "B.Tech Admissions Desk",
    customerName: "లక్ష్మీ నారాయణ (Lakshmi Narayana - Father of Harini)",
    duration: 40,
    transcript: `Counselor: హలో లక్ష్మీ నారాయణ గారూ, ఆదిత్య యూనివర్సిటీ పేరెంట్ హెల్ప్‌లైన్ డెస్క్ నుండి శివాని. బాగున్నారా అండి?
Parent: నమస్తే మేడం. అమ్మాయి హరిణి B.Tech ECE కోర్సు గురించి ఎంక్వైరీ చేశాను. ఈసీఈ వాళ్ళకి సాఫ్ట్‌వేర్ కోడింగ్ ట్రైనింగ్ కూడా ఇస్తారా?
Counselor: అవును సర్! మన ఆదిత్య టెక్నికల్ హబ్ లో ఫస్ట్ ఇయర్ నుండే గ్లోబల్ సర్టిఫికేషన్స్ మరియు ఫుల్-స్టాక్ కోడింగ్ ప్రాక్టీస్ ఉంటుంది.
Parent: అది చాలా మంచిదండి. మరి గర్ల్స్ హాస్టల్ భద్రత ఎలా ఉంటుంది మేడం?
Counselor: బయోమెట్రిక్ ఎంట్రీ, రెసిడెంట్ లేడీ వార్డెన్స్ మరియు 24/7 సిసిటివి సెక్యూరిటీ ఉంది సర్. క్యాంపస్ లో అమ్మాయిల భద్రతకు అత్యున్నత ప్రాధాన్యత ఉంటుంది.
Parent: చాలా సంతృప్తిగా ఉంది మేడం! వెంటనే అడ్మిషన్ ప్రొసీజర్ మరియు ఫీజు లింక్ వాట్సాప్ చేయండి.
Counselor: తప్పకుండా లక్ష్మీ నారాయణ గారు! ఇప్పుడే మీ వాట్సాప్ కి వివరాలు పంపిస్తున్నాను. ధన్యవాదాలు!`,
    lead: {
      customerName: "లక్ష్మీ నారాయణ (Lakshmi Narayana - Father of Harini)",
      need: "B.Tech ECE Admission, Technical Hub Software Coding & Girls Hostel 24/7 Security",
      budget: "Standard B.Tech Fee Structure",
      objections: ["గర్ల్స్ హాస్టల్ రక్షణ & బయోమెట్రిక్ వెరిఫికేషన్"],
      urgency: "high",
      nextStep: "అడ్మిషన్ రిజిస్ట్రేషన్ ప్రొసీజర్ మరియు ఫీజు పేమెంట్ లింక్ వాట్సాప్ చేయాలి",
      followUpDate: "Today Evening 5:00 PM",
      keyQuote: "హాస్టల్ సెక్యూరిటీ మరియు టెక్నికల్ హబ్ ట్రైనింగ్ బాగున్నాయి, అడ్మిషన్ లింక్ వాట్సాప్ చేయండి.",
      followUpMessage: "నమస్కారం లక్ష్మీ నారాయణ గారు, ఆదిత్య యూనివర్సిటీ B.Tech ECE మరియు గర్ల్స్ హాస్టల్ బ్రోచర్ పంపాము.",
    }
  },
  {
    id: "demo_call_3",
    business: "ఆదిత్య యూనివర్సిటీ (Aditya University)",
    category: "B.Tech Admissions Desk",
    customerName: "వెంకట రమణ (Venkata Ramana - Father of Karthik)",
    duration: 38,
    transcript: `Counselor: నమస్కారం వెంకట రమణ గారు, ఆదిత్య యూనివర్సిటీ స్కాలర్‌షిప్ సెల్ నుండి శివాని. మీ అబ్బాయి కార్తీక్ ఇంటర్మీడియట్ లో 954 మార్కులు సాధించినందుకు అభినందనలు.
Parent: థాంక్యూ మేడం! ఇంటర్ లో 95% వచ్చిన విద్యార్థులకు ఆదిత్యలో ఫీజు రాయితీ ఉంటుందా?
Counselor: ఖచ్చితంగా సర్! 95% పైన మార్కులు వచ్చిన విద్యార్థులకు ట్యూషన్ ఫీజులో 25% మెరిట్ స్కాలర్‌షిప్ లభిస్తుంది.
Parent: చాలా మంచి అవకాశం అండి! డాక్యుమెంట్ వెరిఫికేషన్ కి ఎప్పుడు రావాలి మేడం?
Counselor: ఈ గురువారం ఉదయం 10 గంటలకి ఒరిజినల్ మార్క్స్ మెమో మరియు ఆధార్ కార్డుతో సూరంపాలెం క్యాంపస్ కి రండి సర్.
Parent: సరే మేడం, గురువారం ఉదయం కార్తీక్ తో కలిసి తప్పకుండా వస్తాను.
Counselor: ధన్యవాదాలు వెంకట రమణ గారు! గురువారం క్యాంపస్ లో కలుద్దాం.`,
    lead: {
      customerName: "వెంకట రమణ (Venkata Ramana - Father of Karthik)",
      need: "25% Merit Scholarship on 954/1000 Intermediate Marks & B.Tech Admission",
      budget: "25% Merit Fee Concession Applied",
      objections: ["డాక్యుమెంట్ వెరిఫికేషన్ టైమ్‌లైన్"],
      urgency: "high",
      nextStep: "గురువారం ఉదయం 10:00 కి ఒరిజినల్ సర్టిఫికెట్స్ తో స్కాలర్‌షిప్ వెరిఫికేషన్",
      followUpDate: "గురువారం ఉదయం 10:00 గంటలకు (Thursday 10 AM)",
      keyQuote: "95% మార్కులకు 25% ఫీజు రాయితీ ఇస్తామన్నారు, గురువారం ఒరిజినల్ సర్టిఫికెట్స్ తో వస్తాను.",
      followUpMessage: "నమస్కారం వెంకట రమణ గారు, కార్తీక్ 25% మెరిట్ స్కాలర్‌షిప్ డాక్యుమెంట్ వెరిఫికేషన్ గురువారం ఉదయం 10 గంటలకి సూరంపాలెం క్యాంపస్ లో ఏర్పాటు చేయబడింది.",
    }
  },
  {
    id: "demo_call_4",
    business: "ఆదిత్య యూనివర్సిటీ (Aditya University)",
    category: "B.Tech Admissions Desk",
    customerName: "ప్రసాద్ వర్మ (Prasad Varma - Father of Tarun)",
    duration: 36,
    transcript: `Counselor: నమస్కారం ప్రసాద్ వర్మ గారు, ఆదిత్య యూనివర్సిటీ 24/7 అడ్మిషన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను.
Parent: నమస్తే అండి మేడం. మా అబ్బాయి తరుణ్ కి B.Tech Data Science మరియు Core CSE లలో దేంట్లో ఎక్కువ ప్లేస్‌మెంట్ అవకాశాలు ఉంటాయి?
Counselor: ప్రసాద్ గారు, రెండింటికీ అమెజాన్, టీసీఎస్, కాగ్నిజెంట్ కంపెనీలలో సమానంగా 3000 కు పైగా ప్లేస్‌మెంట్ డ్రైవ్స్ ఉంటాయి. డేటా సైన్స్ లో ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ప్రాజెక్ట్స్ అదనంగా ఉంటాయి.
Parent: చాలా స్పష్టంగా చెప్పారు మేడం. ఫీజు స్ట్రక్చర్ మరియు క్యాంపస్ హాస్టల్ వివరాలు వాట్సాప్ చేస్తారా?
Counselor: తప్పకుండా సర్! పూర్తి బ్రోచర్ మరియు ఫీజు వివరాలు మీ వాట్సాప్‌కి ఇప్పుడే పంపుతున్నాను.
Parent: చాలా థాంక్స్ మేడం. వివరాలు చూసి వెంటనే సీట్ బుకింగ్ చేసుకుంటాం.
Counselor: ధన్యవాదాలు ప్రసాద్ వర్మ గారు! Have a great day.`,
    lead: {
      customerName: "ప్రసాద్ వర్మ (Prasad Varma - Father of Tarun)",
      need: "B.Tech Data Science vs Core CSE Placement Prospects & Syllabus Inquiry",
      budget: "Standard 4-Year B.Tech Fee",
      objections: ["టాప్ MNC ప్లేస్‌మెంట్ రికార్డులు & కెరీర్ స్కోప్"],
      urgency: "medium",
      nextStep: "డేటా సైన్స్ కోర్సు సిలబస్ మరియు అమెజాన్, టీసీఎస్ ప్లేస్‌మెంట్ రిపోర్ట్ వాట్సాప్ చేయాలి",
      followUpDate: "Tomorrow 11:30 AM",
      keyQuote: "డేటా సైన్స్ మరియు కంప్యూటర్ సైన్స్ ప్లేస్‌మెంట్ వివరాలు చూసి వెంటనే సీట్ బుకింగ్ చేసుకుంటాం.",
      followUpMessage: "నమస్కారం ప్రసాద్ వర్మ గారు, ఆదిత్య యూనివర్సిటీ డేటా సైన్స్ ప్లేస్‌మెంట్ బ్రోచర్ మరియు కంపెనీల లిస్ట్ పంపాము.",
    }
  }
];
