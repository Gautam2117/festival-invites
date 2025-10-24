import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
import { cookies } from "next/headers";
import type { BrandProfile } from "@/types/brand";

export const runtime = "nodejs";

async function getClientId() {
  const bag = await cookies();
  let cid = bag.get("cid")?.value;
  if (!cid) {
    cid = Math.random().toString(36).slice(2, 10);
    bag.set("cid", cid, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }
  return cid;
}

export async function GET() {
  // List current user's brands (scoped by cid)
  const cid = await getClientId();
  try {
  const snap = await adminDb
    .collection("brands")
    .where("cid", "==", cid)
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();

  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
  } catch (e) {
    let msg = "";
    if (e instanceof Error) {
      msg = e.message;
    } else {
      msg = String(e);
    }
    if (msg.includes("requires an index")) {
      // return empty but not crash dev session
      return NextResponse.json({ items: [], indexRequired: true }, { status: 200 });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  // Upsert: if body.id present, patch; else create
  const cid = await getClientId();
  const body = await req.json();
  const now = Date.now();

  const data: Partial<BrandProfile> & { cid: string } = {
    cid,
    name: String(body.name || "").slice(0, 80),
    logoUrl: body.logoUrl ? String(body.logoUrl) : undefined,
    tagline: body.tagline ? String(body.tagline).slice(0, 140) : undefined,
    primary: String(body.primary || "#2563eb"),
    secondary: body.secondary ? String(body.secondary) : undefined,
    ribbon: !!body.ribbon,
    endCard: !!body.endCard,
    updatedAt: now,
  };

  if (body.id) {
    const ref = adminDb.collection("brands").doc(String(body.id));
    await ref.set(data, { merge: true });
    return NextResponse.json({ ok: true, id: String(body.id) });
  } else {
    const ref = await adminDb.collection("brands").add({
      ...data,
      createdAt: now,
    });
    return NextResponse.json({ ok: true, id: ref.id });
  }
}
