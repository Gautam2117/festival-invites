// src/app/api/montage/wishes/[inviteId]/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { inviteId: string } }) {
  try {
    const url = new URL(req.url);
    const count = Math.max(1, Math.min(12, Number(url.searchParams.get("count") || 6)));
    const seconds = Math.max(8, Math.min(18, Number(url.searchParams.get("seconds") || 12)));

    // Get invite for theme/brand/background (optional)
    const invSnap = await adminDb.collection("invites").doc(params.inviteId).get();
    if (!invSnap.exists) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    const inv = invSnap.data() as any;

    // Pull recent approved wishes
    const ws = await adminDb
      .collection("wishes")
      .where("inviteId", "==", params.inviteId)
      .where("approved", "==", true)
      .orderBy("createdAt", "desc")
      .limit(count)
      .get();

    if (ws.empty) {
      return NextResponse.json({ error: "No approved wishes yet" }, { status: 400 });
    }

    const wishes = ws.docs.map((d) => {
      const w = d.data() as any;
      return {
        message: String(w.message || "").slice(0, 240),
        senderName: w.senderName ? String(w.senderName).slice(0, 60) : undefined,
        senderType: w.senderType || "personal",
        logoUrl: w.logoUrl || null,
        createdAt: Number(w.createdAt || 0),
      };
    });

    // Encoding for WhatsApp Status
    const fps = 30;
    const durationInFrames = Math.round(fps * seconds);

    const payload: any = {
      compositionId: "wish-montage",
      inputProps: {
        wishes,
        bg: inv.props?.bg ?? undefined,
        music: "/assets/music/soft-bed.mp3", // ship a calm bed in /public
        musicVolume: 0.9,
        brand: inv.props?.brand ?? {
          name: inv.owner?.name,
          logoUrl: undefined,
          primary: "#10b981",
          secondary: "#a78bfa",
        },
        theme: inv.theme || "classic",
      },
      quality: "status",
      encoding: {
        width: 720,
        height: 1280,
        fps,
        videoBitrateKbps: 2400,
        audioBitrateKbps: 96,
        maxDurationSeconds: seconds,
      },
      // override the default comp duration if your queue supports it:
      override: { durationInFrames },
    };

    // Queue render
    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const queued = await fetch(`${base}/api/lambda/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    if (!queued?.renderId || !queued?.bucketName) {
      return NextResponse.json({ error: queued?.error || "Queue error" }, { status: 500 });
    }

    // Discover output
    const ext = "mp4";
    const outKey = queued?.outKey || `renders/${queued.renderId}/out.${ext}`;
    const signed = await fetch(
      `${base}/api/lambda/file?bucketName=${queued.bucketName}&outKey=${encodeURIComponent(outKey)}&ext=${ext}`
    ).then((r) => r.json());
    if (!signed?.url) {
      return NextResponse.json({ error: "Failed to presign URL" }, { status: 500 });
    }

    // Poll for completion
    const deadline = Date.now() + 180_000;
    let delay = 900;
    let finalUrl: string | null = null;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(
          `${base}/api/lambda/progress?renderId=${queued.renderId}&bucketName=${queued.bucketName}&functionName=${encodeURIComponent(
            queued.functionName
          )}`
        );
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 1.6, 8000);
          continue;
        }
        const prog = await res.json();
        if (typeof prog?.error === "string") {
          if (prog.error.includes("Rate Exceeded")) {
            await new Promise((r) => setTimeout(r, delay));
            delay = Math.min(delay * 1.6, 8000);
            continue;
          }
          return NextResponse.json({ error: prog.error }, { status: 500 });
        }
        if (Array.isArray(prog?.errors) && prog.errors.length) {
          return NextResponse.json({ error: prog.errors[0]?.message || "Render failed" }, { status: 500 });
        }
        if (prog?.done) {
          finalUrl = signed.url;
          break;
        }
      } catch {
        // tolerate network hiccups
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.25 + Math.random() * 200, 3000);
    }

    if (!finalUrl) {
      return NextResponse.json({ error: "Timed out" }, { status: 504 });
    }

    return NextResponse.json({ url: finalUrl, count: wishes.length, seconds });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
