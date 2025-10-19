import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { inviteId: string } }) {
  const ref = adminDb.collection("rsvp_stats").doc(params.inviteId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ yes: 0, no: 0, adults: 0, kids: 0, updatedAt: 0 });
  return NextResponse.json(snap.data());
}
