import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // id could be call_id or lead_id
    const lead = db.prepare(`
      SELECT l.*, c.original_name, c.duration_seconds, c.transcript, c.created_at as call_created_at
      FROM leads l
      JOIN calls c ON l.call_id = c.id
      WHERE l.id = ? OR l.call_id = ?
    `).get(id, id) as any;

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

