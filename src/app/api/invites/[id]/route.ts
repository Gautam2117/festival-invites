import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
import type { Invite } from "@/types/invite";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await adminDb.collection("invites").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: snap.data() as Invite });
}
