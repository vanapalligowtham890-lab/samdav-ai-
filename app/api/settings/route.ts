import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { seedSectorCampaign } from "@/lib/sector-campaigns";
import { syncRealtimeDb } from "@/lib/firebase";

export async function GET() {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updateSetting = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `);

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        updateSetting.run(key, value);
      }
    }

    const businessName = body.business_name || "Our Business";
    const businessType = body.business_type || "Digital Marketing & Agency";
    const voice = body.voice || "Shivani";
    const language = body.language || "te-en";

    // Preload customized synthetic sector calls with selected voice and language, and sync to Firebase
    const seeded = await seedSectorCampaign(businessName, businessType, voice, language);

    // Sync settings to Firebase
    syncRealtimeDb("settings/profile", {
      businessName,
      businessType,
      forwardingNumber: body.forwarding_number || "+91 98765 43210",
      voice,
      language,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Profile preloaded for ${businessName} (${businessType}) with ${seeded.count} sector calls in ${language} voice`,
      seededCount: seeded.count,
      metrics: seeded.metrics,
    });
  } catch (error: any) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
