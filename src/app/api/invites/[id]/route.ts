import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
import type { Invite } from "@/types/invite";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const snap = await adminDb.collection("invites").doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: snap.data() as Invite });
}
