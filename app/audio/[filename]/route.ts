import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safeName = path.basename(filename);
    const audioPath = path.join(process.cwd(), "public", "audio", safeName);

    if (fs.existsSync(audioPath)) {
      const buffer = fs.readFileSync(audioPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Fallback if specific file doesn't exist
    const fallbackPath = path.join(process.cwd(), "public", "audio", "sample_recap.wav");
    if (fs.existsSync(fallbackPath)) {
      const buffer = fs.readFileSync(fallbackPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": buffer.length.toString(),
          "Accept-Ranges": "bytes",
        },
      });
    }

    return new NextResponse("Audio file not found", { status: 404 });
  } catch (err: any) {
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}

