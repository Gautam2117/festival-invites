// src/app/api/lambda/gif/route.ts
import { NextResponse } from "next/server";
export { runtime, dynamic } from "../_common";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Works on previews & prod (no cross-origin issues)
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (req.headers.get("origin")?.startsWith("http:") ? "http" : "https");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const base = `${proto}://${host}`;

    const payload = {
      compositionId: body?.compositionId ?? "festival-intro",
      inputProps: body?.inputProps ?? {},
      quality: "gif" as const,
      container: "gif" as const,
      codec: "gif" as const,
      encoding: {
        width: body?.encoding?.width ?? 540,
        height: body?.encoding?.height ?? 960,
        fps: body?.encoding?.fps ?? 12,
        // queue may ignore this, harmless to pass along
        durationSeconds: body?.encoding?.durationSeconds ?? 3.5,
      },
      outExt: "gif" as const,
    };

    const r = await fetch(`${base}/api/lambda/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const j = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: j?.error || "Queue failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
