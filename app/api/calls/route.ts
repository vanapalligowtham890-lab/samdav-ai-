import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const call = db.prepare("SELECT * FROM calls WHERE id = ?").get(id);
      if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
      const lead = db.prepare("SELECT * FROM leads WHERE call_id = ?").get(id);
      return NextResponse.json({ call, lead });
    }

    const calls = db.prepare(`
      SELECT c.*, l.customer_name, l.need, l.budget, l.urgency, l.key_quote, l.id as lead_id
      FROM calls c
      LEFT JOIN leads l ON c.id = l.call_id
      ORDER BY c.created_at DESC
    `).all();

    return NextResponse.json({ calls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

