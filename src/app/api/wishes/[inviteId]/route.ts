import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
import { FieldValue } from "firebase-admin/firestore";
import type { Wish } from "@/types/wish";
import { clamp, needsReview, hashIP } from "@/lib/moderation";
import { makeLimiter, limitOrThrow, getIP } from "@/lib/ops";

export const runtime = "nodejs";

const MAX_PER_PAGE = 100;
const COOLDOWN_MS = 60_000; // 60s/IP/invite
const wishLimiter = makeLimiter(Number(process.env.WISH_PER_IP_PER_MIN || 2), 60);

export async function GET(req: Request, { params }: { params: { inviteId: string } }) {
  const url = new URL(req.url);
  const after = Number(url.searchParams.get("after") || 0);
  const all = url.searchParams.get("all") === "1";
  const isAdmin = req.headers.get("x-admin-key") === process.env.ADMIN_KEY;

  try {
    let q = adminDb
      .collection("wishes")
      .where("inviteId", "==", params.inviteId)
      .orderBy("createdAt", "desc")
      .limit(MAX_PER_PAGE);

    if (!isAdmin || !all) q = q.where("approved", "==", true);
    if (after > 0) q = q.where("createdAt", "<", after);

    const snap = await q.get();
    const items: Wish[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    return NextResponse.json({ count: items.length, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { inviteId: string } }) {
  try {
    const ip = getIP(req);
    await limitOrThrow(wishLimiter, `wish:${ip}:${params.inviteId}`, "Please wait before sending another wish.");

    const body = await req.json();

    // validate & clamp
    const message = clamp(String(body.message || "").trim(), 240);
    const senderName = clamp(String(body.senderName || "").trim(), 60) || undefined;
    const senderType = (body.senderType || "personal") as Wish["senderType"];
    const logoUrl = body.logoUrl ? String(body.logoUrl) : null;
    const theme = clamp(String(body.theme || "classic"), 24);

    if (!message || !["company", "family", "personal"].includes(senderType)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // IP cooldown via cookie (per invite)
    const cookieKey = `w_${params.inviteId}`;
    const cookies = (req.headers.get("cookie") || "").split(/;\s*/);
    const prev = cookies.find((c) => c.startsWith(cookieKey + "="))?.split("=")[1];
    const last = prev ? Number(prev) : 0;
    if (Date.now() - last < COOLDOWN_MS) {
      return NextResponse.json({ error: "Please wait before sending another wish." }, { status: 429 });
    }

    // auto-moderation
    const approved = !needsReview(message) && (!senderName || !needsReview(senderName));

    const docRef = await adminDb.collection("wishes").add({
      inviteId: params.inviteId,
      message,
      senderName,
      senderType,
      logoUrl,
      theme,
      approved,
      createdAt: Date.now(),
      ipHash: hashIP(ip),
      ts: FieldValue.serverTimestamp(),
    });

    const res = NextResponse.json({ ok: true, id: docRef.id, approved });
    res.headers.set("Set-Cookie", `${cookieKey}=${Date.now()}; Path=/; Max-Age=600; SameSite=Lax`);
    return res;
  } catch (e: any) {
    const status = e?.status || 500;
    const headers = e?.retryAfter ? { "Retry-After": String(e.retryAfter) } : undefined;
    return NextResponse.json({ error: e?.message || "Failed" }, { status, headers: headers as any });
  }
}
