import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Passes through to your existing /api/lambda/queue with encoding hints
 * Body: { compositionId: "festival-intro", inputProps: {...}, encoding: {...}, quality: "status" }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = {
      ...body,
      quality: "status",
      container: "mp4",
      codec: "h264",
      encoding: {
        width: body?.encoding?.width ?? 720,
        height: body?.encoding?.height ?? 1280,
        fps: body?.encoding?.fps ?? 30,
        videoBitrateKbps: body?.encoding?.videoBitrateKbps ?? 2600,
        audioBitrateKbps: body?.encoding?.audioBitrateKbps ?? 96,
        maxDurationSeconds: body?.encoding?.maxDurationSeconds ?? 30,
      },
      outExt: "mp4",
    };

    const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/lambda/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await r.json();
    if (!r.ok) return NextResponse.json({ error: j?.error || "Queue failed" }, { status: 500 });
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
