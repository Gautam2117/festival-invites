// src/app/api/invites/[id]/og/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";

export const runtime = "nodejs"; // Admin SDK required

function looksLikeImage(u?: string) {
  if (!u) return false;
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(u);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const ref = adminDb.collection("invites").doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const inv = snap.data() as any;

  // If already an image, return as-is
  if (looksLikeImage(inv.ogImageUrl)) {
    return NextResponse.json({ url: inv.ogImageUrl });
  }

  // Use dedicated landscape comp
  const compositionId = "og-card";

  const payload: any = {
    compositionId,
    quality: "og",
    inputProps: {
      title: inv.props?.title ?? inv.title,
      subtitle: inv.props?.names ?? inv.subtitle ?? "",
      date: inv.props?.date ?? "",
      venue: inv.props?.venue ?? "",
      bg: inv.props?.bg ?? undefined,
      theme: inv.theme || "classic",
      ownerName: inv.owner?.name,
      ownerOrg: inv.owner?.org ?? null,
      // No music/watermark needed for OG stills
    },
    frame: 60,
    format: "png",
  };

  // Kick off still render via your existing lambda endpoint
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const queued = await fetch(`${base}/api/lambda/still`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

  if (!queued?.renderId || !queued?.bucketName) {
    return NextResponse.json(
      { error: queued?.error || "OG render queue failed" },
      { status: 500 }
    );
  }

  const ext = "png";
  const guessedKey = queued?.outKey || `renders/${queued.renderId}/out.${ext}`;

  const signed = await fetch(
    `${base}/api/lambda/file?bucketName=${queued.bucketName}&outKey=${encodeURIComponent(
      guessedKey
    )}&ext=${ext}`
  ).then((r) => r.json());
  if (!signed?.url) {
    return NextResponse.json(
      { error: "Failed to presign OG URL" },
      { status: 500 }
    );
  }

  // Probe until ready (fast loop with tight cap)
  const deadline = Date.now() + 45_000;
  let delay = 600;
  let finalUrl: string | null = null;

  while (Date.now() < deadline) {
    const probe = await fetch(
      `${base}/api/lambda/probe?bucketName=${queued.bucketName}&outKey=${encodeURIComponent(
        guessedKey
      )}`
    ).then((r) => r.json());
    if (probe?.exists) {
      finalUrl = signed.url;
      break;
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.35, 3000);
  }

  if (!finalUrl) {
    return NextResponse.json(
      { error: "Timed out creating OG" },
      { status: 504 }
    );
  }

  // Update invite doc for future hits
  await ref.update({ ogImageUrl: finalUrl });

  return NextResponse.json({ url: finalUrl });
}
