// src/app/api/export/route.ts
import path from "path";
import os from "os";
import fs from "fs/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  compositionId: "festival-intro" | "image-card";
  inputProps: Record<string, unknown>;
  fps?: number;
  durationInFrames?: number;
  width?: number;
  height?: number;
};

export async function POST(req: Request) {
  try {
    const { compositionId, inputProps } = (await req.json()) as Body;

    // ✅ Dynamically import Remotion libs at runtime (not during build)
    const [{ bundle }, { renderMedia, selectComposition }] = await Promise.all([
      import("@remotion/bundler"),
      import("@remotion/renderer"),
    ]);

    const entry = path.join(process.cwd(), "src", "remotion", "entry.tsx");

    // 1) Bundle your Remotion entry
    const serveUrl = await bundle({ entryPoint: entry });

    // 2) Pick the composition and pass input props
    const comp = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    });

    // 3) Render to a temp file (MP4 H.264)
    const outPath = path.join(os.tmpdir(), `export_${compositionId}_${Date.now()}.mp4`);

    await renderMedia({
      serveUrl,
      composition: comp,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
      // chromiumOptions: { gl: "angle" }, // if you need it later
    });

    // 4) Stream back as Uint8Array
    const fileBuf = await fs.readFile(outPath); // Buffer
    const u8 = new Uint8Array(fileBuf); // ArrayBufferView -> valid BodyInit

    const res = new NextResponse(u8, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(u8.byteLength),
        "Content-Disposition": `attachment; filename="${compositionId}.mp4"`,
        "Cache-Control": "no-store",
      },
    });

    // Cleanup (fire-and-forget)
    fs.unlink(outPath).catch(() => {});
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg || "Export failed" }, { status: 500 });
  }
}
