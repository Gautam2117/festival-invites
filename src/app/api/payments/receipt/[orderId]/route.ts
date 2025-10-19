import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const snap = await adminDb.collection("payments").doc(orderId).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: snap.data() });
}
