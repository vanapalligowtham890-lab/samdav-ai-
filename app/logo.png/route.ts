import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export { GET as HEAD };

export async function GET() {
  try {
    const logoPaths = [
      path.join(process.cwd(), "public", "logo.png"),
      path.join(process.cwd(), "public", "icon.png"),
      path.join(process.cwd(), "app", "icon.png"),
      path.join(process.cwd(), "public", "logo.svg"),
    ];

    for (const p of logoPaths) {
      if (fs.existsSync(p)) {
        const buffer = fs.readFileSync(p);
        const isSvg = p.endsWith(".svg");
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": isSvg ? "image/svg+xml" : "image/png",
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
