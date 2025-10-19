import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function isAdmin(req: Request) {
  return req.headers.get("x-admin-key") === process.env.ADMIN_KEY;
}

async function getClientId() {
  const bag = await cookies();
  return bag.get("cid")?.value || "";
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cid = await getClientId();
  const snap = await adminDb.collection("brands").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = snap.data() as any;
  if (data.cid !== cid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ item: { id: snap.id, ...data } });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await adminDb.collection("brands").doc(id).delete();
  return NextResponse.json({ ok: true });
}