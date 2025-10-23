import { NextResponse } from "next/server";
export { runtime, dynamic } from "../_common";

/**
 * POST /api/lambda/status
 * Proxies to /api/lambda/queue with sane defaults for WhatsApp Status
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Build base URL from the current request (works in previews + prod)
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (req.headers.get("origin")?.startsWith("http:") ? "http" : "https");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const base = `${proto}://${host}`;

    const payload = {
      ...body,
      quality: "status",
      container: "mp4",
      codec: "h264",
      encoding: {
        width: body?.encoding?.width ?? 720,
        height: body?.encoding?.height ?? 1280,
        fps: body?.encoding?.fps ?? 30,
        // Hints for your queue route (it may ignore some of these, that's fine)
        videoBitrateKbps: body?.encoding?.videoBitrateKbps ?? 2600,
        audioBitrateKbps: body?.encoding?.audioBitrateKbps ?? 96,
        maxDurationSeconds: body?.encoding?.maxDurationSeconds ?? 30,
      },
      outExt: "mp4",
    };

    const r = await fetch(`${base}/api/lambda/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Never cache
      cache: "no-store",
    });

    const j = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: j?.error || "Queue failed" },
        { status: 500 }
      );
    }
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
