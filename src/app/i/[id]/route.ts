import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const doc = await adminDb.collection("invites").doc(params.id).get();
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  if (!doc.exists) return NextResponse.redirect(new URL("/", base), 302);

  const data = doc.data() as { slug: string; id: string };
  return NextResponse.redirect(new URL(`/${encodeURIComponent(data.slug)}/${encodeURIComponent(data.id)}`, base), 301);
}
