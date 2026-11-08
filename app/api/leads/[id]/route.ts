import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // id could be call_id or lead_id
    let lead = db.prepare(`
      SELECT l.*, 
             COALESCE(NULLIF(l.audio_url, ''), NULLIF(c.audio_url, ''), '/audio/' || c.filename) as audio_url,
             c.original_name, 
             c.duration_seconds, 
             c.transcript, 
             c.created_at as call_created_at
      FROM leads l
      JOIN calls c ON l.call_id = c.id
      WHERE l.id = ? OR l.call_id = ?
    `).get(id, id) as any;

    if (!lead) {
      // Check cold_call_campaigns directly
      const prospect = db.prepare("SELECT * FROM cold_call_campaigns WHERE id = ?").get(id) as any;
      if (prospect) {
        lead = {
          id: `lead_${prospect.id}`,
          call_id: prospect.id,
          customer_name: prospect.name,
          need: prospect.need,
          budget: prospect.outcome === "won" ? "High Intent / Qualified" : "Standard Inquirer",
          objections: JSON.stringify([prospect.key_quote || "Standard inquiry"]),
          urgency: prospect.outcome === "won" ? "high" : "medium",
          next_step: prospect.notes || "Follow-up catalog sent via WhatsApp",
          follow_up_date: prospect.call_time || "Today",
          key_quote: prospect.key_quote || "",
          follow_up_message: `నమస్కారం ${prospect.name} గారు, మా సంభాషణ ప్రకారం వివరాలు పంపిస్తున్నాము. ధన్యవాదాలు!`,
          status: prospect.outcome === "won" ? "qualified" : "contacted",
          audio_url: prospect.audio_url || "",
          original_name: `${prospect.name} Outbound Call.wav`,
          duration_seconds: prospect.duration_seconds || 35,
          transcript: prospect.transcript || "",
          call_created_at: prospect.call_time || "Today",
        };
      }
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      customer_name,
      need,
      budget,
      urgency,
      next_step,
      follow_up_date,
      key_quote,
      follow_up_message,
    } = body;

    db.prepare(`
      UPDATE leads
      SET 
        customer_name = ?,
        need = ?,
        budget = ?,
        urgency = ?,
        next_step = ?,
        follow_up_date = ?,
        key_quote = ?,
        follow_up_message = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR call_id = ?
    `).run(
      customer_name || null,
      need || null,
      budget || null,
      urgency || null,
      next_step || null,
      follow_up_date || null,
      key_quote || null,
      follow_up_message || null,
      id,
      id
    );

    return NextResponse.json({ success: true, message: "Lead updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

