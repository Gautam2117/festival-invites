// src/app/api/lambda/gif/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const encoding = {
      width: body?.encoding?.width ?? 540,
      height: body?.encoding?.height ?? 960,
      fps: body?.encoding?.fps ?? 12,
      durationSeconds: body?.encoding?.durationSeconds ?? 3.5,
    };

    const payload = {
      compositionId: body?.compositionId ?? "festival-intro",
      inputProps: body?.inputProps ?? {},
      encoding,
      quality: "gif" as const,
      container: "gif" as const,
      codec: "gif" as const,
    };

    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) {
      return NextResponse.json({ ok: false, error: "Missing NEXT_PUBLIC_BASE_URL" }, { status: 500 });
    }

    const r = await fetch(`${base}/api/lambda/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const j = await r.json();

    if (!r.ok) {
      return NextResponse.json({ ok: false, error: j?.error || "Queue failed" }, { status: 500 });
    }

    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
