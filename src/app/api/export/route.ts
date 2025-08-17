// src/app/api/export/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  compositionId: "festival-intro" | "image-card";
  inputProps: Record<string, unknown>;
  // (optional overrides omitted for brevity)
};

export async function POST(req: Request) {
  // 🚧 Disable this route on Vercel / production — use /api/lambda/* in prod
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  if (isProd) {
    return NextResponse.json(
      { error: "Local renderer is disabled on production. Use /api/lambda/* endpoints." },
      { status: 400 }
    );
  }

  try {
    const { compositionId, inputProps } = (await req.json()) as Body;

    // Lazy-load everything so Remotion bundler never gets included in prod builds
    const [{ bundle }, { renderMedia, selectComposition }, pathMod, osMod, fs] =
      await Promise.all([
        import("@remotion/bundler"),
        import("@remotion/renderer"),
        import("node:path"),
        import("node:os"),
        import("node:fs/promises"),
      ]);

    const entry = pathMod.join(process.cwd(), "src", "remotion", "entry.tsx");

    // 1) Bundle Remotion entry
    const serveUrl = await bundle({ entryPoint: entry });

    // 2) Pick composition
    const comp = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    });

    // 3) Render to a temp MP4 (H.264)
    const outPath = pathMod.join(
      osMod.tmpdir(),
      `export_${compositionId}_${Date.now()}.mp4`
    );

    await renderMedia({
      serveUrl,
      composition: comp,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
    });

    // 4) Read file and return as Uint8Array (valid BodyInit)
    const fileBuf = await fs.readFile(outPath); // Buffer
    const u8 = new Uint8Array(fileBuf); // ✅ ArrayBufferView

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
    return NextResponse.json(
      { error: e?.message ?? "Export failed" },
      { status: 500 }
    );
  }
}
