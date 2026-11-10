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
        transcript: `నమస్కారం శ్రీనివాస రావు గారు, ఆదిత్య యూనివర్సిటీ అడ్మిషన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను. నమస్తే మేడం, మా అబ్బాయి సాయి తేజ కి EAPCET లో 14,200 ర్యాంక్ వచ్చింది. సూరంపాలెం క్యాంపస్ లో B.Tech CSE AI&ML సీట్ దొరుకుతుందా? తప్పకుండా శ్రీనివాస రావు గారు! మీ ర్యాంక్ కి CSE AI&ML సీట్ కన్ఫర్మ్ అవుతుంది. మన వద్ద అమెజాన్, సిస్కో కంపెనీలతో 3000 కు పైగా ప్లేస్‌మెంట్స్ వచ్చాయి. బాయ్స్ హాస్టల్ సౌకర్యాలు మరియు ఫీజు వివరాలు ఎలా ఉన్నాయి మేడం? AC మరియు Non-AC హాస్టల్స్, హైజీనిక్ ఫుడ్ మరియు 24/7 సెక్యూరిటీ ఉన్నాయి సర్. చాలా సంతోషం మేడం! రేపు ఉదయం 10 గంటలకి నేరుగా క్యాంపస్ కి వచ్చి అడ్మిషన్ ఫారమ్ పూర్తి చేస్తాం.`,
      },
      {
        filename: "aditya_counseling_call_2.wav",
        customerName: "Lakshmi Narayana",
        transcript: `హలో లక్ష్మీ నారాయణ గారూ, ఆదిత్య యూనివర్సిటీ పేరెంట్ హెల్ప్‌లైన్ డెస్క్ నుండి. అమ్మాయి హరిణి B.Tech ECE కోర్సు గురించి ఎంక్వైరీ చేశారు కదా? అవునండి, మా అమ్మాయికి ఈసీఈ తో పాటు సాఫ్ట్‌వేర్ కోడింగ్ ట్రైనింగ్ కూడా ఇస్తారా? అవును సర్! మన ఆదిత్య టెక్నికల్ హబ్ లో ఫస్ట్ ఇయర్ నుండే గ్లోబల్ సర్టిఫికేషన్స్ మరియు కోడింగ్ ప్రాక్టీస్ ఉంటుంది. గర్ల్స్ హాస్టల్ భద్రత ఎలా ఉంటుంది? బయోమెట్రిక్ ఎంట్రీ, లేడీ వార్డెన్స్ మరియు రౌండ్-ది-క్లాక్ సెక్యూరిటీ ఉంది సర్. చాలా సంతృప్తిగా ఉంది మేడం, వెంటనే అడ్మిషన్ ప్రొసీజర్ మరియు ఫీజు లింక్ వాట్సాప్ చేయండి.`,
      },
      {
        filename: "aditya_counseling_call_3.wav",
        customerName: "Venkata Ramana",
        transcript: `నమస్కారం వెంకట రమణ గారు, ఆదిత్య యూనివర్సిటీ స్కాలర్‌షిప్ సెల్ నుండి. మీ అబ్బాయి ఇంటర్మీడియట్ లో 954 మార్కులు సాధించినందుకు అభినందనలు. థాంక్యూ మేడం! ఇంటర్ లో 95% వచ్చిన విద్యార్థులకు ఆదిత్యలో ఫీజు రాయితీ ఉంటుందా? ఖచ్చితంగా సర్! 95% పైన మార్కులు వచ్చిన వారికి ట్యూషన్ ఫీజులో 25% మెరిట్ స్కాలర్‌షిప్ లభిస్తుంది. చాలా మంచి అవకాశం అండి! డాక్యుమెంట్ వెరిఫికేషన్ కి ఎప్పుడు రావాలి? ఈ గురువారం ఒరిజినల్ సర్టిఫికెట్స్ తో క్యాంపస్ కి రండి సర్. సరే మేడం, గురువారం తప్పకుండా వస్తాను.`,
      },
      {
        filename: "aditya_counseling_call_4.wav",
        customerName: "Prasad Varma",
        transcript: `నమస్కారం ప్రసాద్ వర్మ గారు, ఆదిత్య యూనివర్సిటీ 24/7 అడ్మిషన్ డెస్క్ నుండి శివాని మాట్లాడుతున్నాను. నమస్తే అండి, మా అబ్బాయికి B.Tech Data Science మరియు Core CSE లలో దేంట్లో ఎక్కువ ప్లేస్‌మెంట్స్ వస్తాయి? ప్రసాద్ గారు, మన వద్ద రెండింటికీ అమెజాన్, టీసీఎస్ టాప్ MNC కంపెనీలలో సమానంగా 3000 కు పైగా ప్లేస్‌మెంట్ డ్రైవ్స్ ఉంటాయి. చాలా మంచి సమాచారం అండి, వివరాలు వాట్సాప్ చేయండి.`,
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
