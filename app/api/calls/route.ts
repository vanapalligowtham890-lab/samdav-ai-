import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { syncCampaignCallsToDb } from "@/lib/sector-campaigns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      let call = db.prepare("SELECT * FROM calls WHERE id = ?").get(id) as any;
      let lead = db.prepare("SELECT * FROM leads WHERE call_id = ? OR id = ?").get(id, id) as any;

      if (!call) {
        // Fallback check against cold_call_campaigns
        const prospect = db.prepare("SELECT * FROM cold_call_campaigns WHERE id = ?").get(id) as any;
        if (prospect) {
          call = {
            id: prospect.id,
            original_name: `${prospect.name} (${prospect.need})`,
            filename: prospect.audio_url ? prospect.audio_url.split("/").pop() : `${prospect.id}.wav`,
            file_path: "",
            duration_seconds: prospect.duration_seconds || 35,
            language_code: "te-IN",
            status: prospect.call_status === "closed" ? "completed" : "in_progress",
            transcript: prospect.transcript,
            audio_url: prospect.audio_url,
            created_at: prospect.call_time || "Today",
          };
          lead = {
            id: `lead_${prospect.id}`,
            call_id: prospect.id,
            customer_name: prospect.name,
            need: prospect.need,
            budget: prospect.outcome === "won" ? "High Intent / Qualified" : "Standard Inquirer",
            urgency: prospect.outcome === "won" ? "high" : "medium",
            key_quote: prospect.key_quote,
            audio_url: prospect.audio_url,
            transcript: prospect.transcript,
            follow_up_message: `నమస్కారం ${prospect.name} గారు, మా సంభాషణ ప్రకారం వివరాలు పంపిస్తున్నాము. ధన్యవాదాలు!`,
          };
        }
      }

      if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
      return NextResponse.json({ call, lead });
    }

    // Check if calls table needs initial sync from active campaign
    const hasActiveCalls = db.prepare("SELECT count(*) as c FROM calls WHERE id NOT LIKE 'demo_call_%'").get() as any;
    if (!hasActiveCalls || hasActiveCalls.c === 0) {
      syncCampaignCallsToDb();
    }

    const calls = db.prepare(`
      SELECT 
        c.*, 
        COALESCE(NULLIF(c.audio_url, ''), NULLIF(l.audio_url, ''), '/audio/' || c.filename) as audio_url,
        l.customer_name, 
        l.need, 
        l.budget, 
        l.urgency, 
        l.key_quote, 
        COALESCE(l.id, 'lead_' || c.id) as lead_id
      FROM calls c
      LEFT JOIN leads l ON c.id = l.call_id
      WHERE c.id NOT LIKE 'demo_call_%' OR (SELECT count(*) FROM calls WHERE id NOT LIKE 'demo_call_%') = 0
      ORDER BY c.created_at DESC
    `).all();

    return NextResponse.json({ calls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

