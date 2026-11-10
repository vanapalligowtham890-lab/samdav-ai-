import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { synthesizeDialogueAudio } from "@/lib/dialogue-synthesizer";

export async function GET() {
  try {
    const dialogues = [
      {
        filename: "aditya_counseling_call_1.wav",
        customerName: "Srinivasa Rao",
        transcript: `Counselor: నమస్కారం అండి, ఆదిత్య యూనివర్సిటీ సూరంపాలెం క్యాంపస్ అడ్మిషన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను. శ్రీనివాస రావు గారేనా అండి?
Parent: నమస్తే మేడం, అవునండి. మా అబ్బాయి సాయి తేజ కి EAPCET లో 14,200 ర్యాంక్ వచ్చింది. సూరంపాలెం క్యాంపస్ లో B.Tech CSE AI&ML సీట్ కన్ఫర్మ్ అవుతుందా?
Counselor: తప్పకుండా శ్రీనివాస రావు గారు! మీ ర్యాంక్ కి CSE AI&ML సీట్ ఖచ్చితంగా కన్ఫర్మ్ అవుతుంది. మన ఆదిత్య టెక్నికల్ హబ్ లో అమెజాన్, సిస్కో టాప్ MNC లతో 3000 కు పైగా ప్లేస్‌మెంట్స్ వచ్చాయి.
Parent: చాలా మంచి విషయం మేడం. బాయ్స్ హాస్టల్ సౌకర్యాలు మరియు ఫీజు వివరాలు ఎలా ఉన్నాయి?
Counselor: హైజీనిక్ ఫుడ్, AC మరియు Non-AC హాస్టల్స్, మరియు పూర్తి రక్షణతో కూడిన సెక్యూరిటీ ఉన్నాయి సర్. రేపు ఉదయం 10 గంటలకి నేరుగా క్యాంపస్ కి వచ్చి అడ్మిషన్ ఫారమ్ పూర్తి చేయవచ్చు.
Parent: చాలా సంతోషం మేడం! రేపు ఉదయం ఒరిజినల్ సర్టిఫికెట్స్ తో తప్పకుండా వస్తాం. థాంక్యూ!
Counselor: ధన్యవాదాలు శ్రీనివాస రావు గారు! రేపు క్యాంపస్ లో కలుద్దాం.`,
      },
      {
        filename: "aditya_counseling_call_2.wav",
        customerName: "Lakshmi Narayana",
        transcript: `Counselor: హలో లక్ష్మీ నారాయణ గారూ, ఆదిత్య యూనివర్సిటీ పేరెంట్ హెల్ప్‌లైన్ డెస్క్ నుండి శివాని. బాగున్నారా అండి?
Parent: నమస్తే మేడం. అమ్మాయి హరిణి B.Tech ECE కోర్సు గురించి ఎంక్వైరీ చేశాను. ఈసీఈ వాళ్ళకి సాఫ్ట్‌వేర్ కోడింగ్ ట్రైనింగ్ కూడా ఇస్తారా?
Counselor: అవును సర్! మన ఆదిత్య టెక్నికల్ హబ్ లో ఫస్ట్ ఇయర్ నుండే గ్లోబల్ సర్టిఫికేషన్స్ మరియు ఫుల్-స్టాక్ కోడింగ్ ప్రాక్టీస్ ఉంటుంది.
Parent: అది చాలా మంచిదండి. మరి గర్ల్స్ హాస్టల్ భద్రత ఎలా ఉంటుంది మేడం?
Counselor: బయోమెట్రిక్ ఎంట్రీ, రెసిడెంట్ లేడీ వార్డెన్స్ మరియు సిసిటివి నిఘా భద్రత ఉంది సర్. క్యాంపస్ లో అమ్మాయిల భద్రతకు అత్యున్నత ప్రాధాన్యత ఉంటుంది.
Parent: చాలా సంతృప్తిగా ఉంది మేడం! వెంటనే అడ్మిషన్ ప్రొసీజర్ మరియు ఫీజు లింక్ వాట్సాప్ చేయండి.
Counselor: తప్పకుండా లక్ష్మీ నారాయణ గారు! ఇప్పుడే మీ వాట్సాప్ కి వివరాలు పంపిస్తున్నాను. ధన్యవాదాలు!`,
      },
      {
        filename: "aditya_counseling_call_3.wav",
        customerName: "Venkata Ramana",
        transcript: `Counselor: నమస్కారం వెంకట రమణ గారు, ఆదిత్య యూనివర్సిటీ స్కాలర్‌షిప్ సెల్ నుండి శివాని. మీ అబ్బాయి కార్తీక్ ఇంటర్మీడియట్ లో 954 మార్కులు సాధించినందుకు అభినందనలు.
Parent: థాంక్యూ మేడం! ఇంటర్ లో 95% వచ్చిన విద్యార్థులకు ఆదిత్యలో ఫీజు రాయితీ ఉంటుందా?
Counselor: ఖచ్చితంగా సర్! 95% పైన మార్కులు వచ్చిన విద్యార్థులకు ట్యూషన్ ఫీజులో 25% మెరిట్ స్కాలర్‌షిప్ లభిస్తుంది.
Parent: చాలా మంచి అవకాశం అండి! డాక్యుమెంట్ వెరిఫికేషన్ కి ఎప్పుడు రావాలి మేడం?
Counselor: ఈ గురువారం ఉదయం 10 గంటలకి ఒరిజినల్ మార్క్స్ మెమో మరియు ఆధార్ కార్డుతో సూరంపాలెం క్యాంపస్ కి రండి సర్.
Parent: సరే మేడం, గురువారం ఉదయం కార్తీక్ తో కలిసి తప్పకుండా వస్తాను.
Counselor: ధన్యవాదాలు వెంకట రమణ గారు! గురువారం క్యాంపస్ లో కలుద్దాం.`,
      },
      {
        filename: "aditya_counseling_call_4.wav",
        customerName: "Prasad Varma",
        transcript: `Counselor: నమస్కారం ప్రసాద్ వర్మ గారు, ఆదిత్య యూనివర్సిటీ అడ్మిషన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను.
Parent: నమస్తే అండి మేడం. మా అబ్బాయి తరుణ్ కి B.Tech Data Science మరియు Core CSE లలో దేంట్లో ఎక్కువ ప్లేస్‌మెంట్ అవకాశాలు ఉంటాయి?
Counselor: ప్రసాద్ గారు, రెండింటికీ అమెజాన్, టీసీఎస్, కాగ్నిజెంట్ కంపెనీలలో సమానంగా 3000 కు పైగా ప్లేస్‌మెంట్ డ్రైవ్స్ ఉంటాయి. డేటా సైన్స్ లో ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ప్రాజెక్ట్స్ అదనంగా ఉంటాయి.
Parent: చాలా స్పష్టంగా చెప్పారు మేడం. ఫీజు స్ట్రక్చర్ మరియు క్యాంపస్ హాస్టల్ వివరాలు వాట్సాప్ చేస్తారా?
Counselor: తప్పకుండా సర్! పూర్తి బ్రోచర్ మరియు ఫీజు వివరాలు మీ వాట్సాప్‌కి ఇప్పుడే పంపుతున్నాను.
Parent: చాలా థాంక్స్ మేడం. వివరాలు చూసి వెంటనే సీట్ బుకింగ్ చేసుకుంటాం.
Counselor: ధన్యవాదాలు ప్రసాద్ వర్మ గారు! Have a great day.`,
      },
    ];

    const results = [];
    const publicAudioDir = path.join(process.cwd(), "public", "audio");

    for (const d of dialogues) {
      const res = await synthesizeDialogueAudio({
        transcript: d.transcript,
        customerName: d.customerName,
        agentVoiceId: "Shivani",
        companyName: "Aditya University",
        languageCode: "te-IN",
      });

      // Also copy or symlink to exact explicit filename
      const generatedPath = path.join(process.cwd(), "public", res.audioUrl.replace(/^\//, ""));
      const targetPath = path.join(publicAudioDir, d.filename);

      if (fs.existsSync(generatedPath)) {
        fs.copyFileSync(generatedPath, targetPath);
      }

      results.push({
        filename: d.filename,
        generatedUrl: res.audioUrl,
        targetUrl: `/audio/${d.filename}`,
        size: fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
