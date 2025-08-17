// src/app/api/export/route.ts
import path from "path";
import os from "os";
import fs from "fs/promises";
import { NextResponse } from "next/server";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  compositionId: "festival-intro" | "image-card";
  inputProps: Record<string, any>;
  fps?: number;
  durationInFrames?: number;
  width?: number;
  height?: number;
};

export async function POST(req: Request) {
  try {
    const { compositionId, inputProps } = (await req.json()) as Body;

    const entry = path.join(process.cwd(), "src", "remotion", "entry.tsx");

    // 1) Bundle Remotion entry
    const serveUrl = await bundle({ entryPoint: entry });

    // 2) Pick composition
    const comp = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    });

    // 3) Render to temp file
    const outPath = path.join(os.tmpdir(), `export_${compositionId}_${Date.now()}.mp4`);

    await renderMedia({
      serveUrl,
      composition: comp,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
    });

    // 4) Read file and return as Uint8Array (NOT Buffer / ArrayBuffer)
    const fileBuf = await fs.readFile(outPath);      // Buffer
    const u8 = Uint8Array.from(fileBuf);             // ✅ fresh ArrayBufferView -> valid BodyInit

    const res = new NextResponse(u8, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(u8.byteLength),
        "Content-Disposition": `attachment; filename="${compositionId}.mp4"`,
        "Cache-Control": "no-store",
      },
    });

    // Cleanup (don’t await)
    fs.unlink(outPath).catch(() => {});
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
