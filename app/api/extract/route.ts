import { NextRequest, NextResponse } from "next/server";
import { extractLeadFromTranscript } from "@/lib/llm";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, callId } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing or invalid transcript" }, { status: 400 });
    }

    const leadData = await extractLeadFromTranscript(transcript, callId);

    // If callId provided, also update key_quote in calls if not set
    if (callId && leadData.keyQuote) {
      db.prepare(`
        UPDATE calls SET status = 'completed' WHERE id = ?
      `).run(callId);
    }

    return NextResponse.json({
      success: true,
      lead: leadData,
    });
  } catch (error: any) {
    console.error("Extract API Error:", error);
    return NextResponse.json({ error: error.message || "Lead extraction failed" }, { status: 500 });
  }
}

