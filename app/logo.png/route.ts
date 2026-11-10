import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logoPaths = [
      path.join(process.cwd(), "public", "logo.png"),
      path.join(process.cwd(), "app", "icon.png"),
      path.join(process.cwd(), "public", "icon.png"),
    ];

    for (const p of logoPaths) {
      if (fs.existsSync(p)) {
        const buffer = fs.readFileSync(p);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/png",
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    return new NextResponse("Logo not found", { status: 404 });
  } catch (err: any) {
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
