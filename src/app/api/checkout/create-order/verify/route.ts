import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    if (!secret) return NextResponse.json({ error: "Missing secret" }, { status: 500 });

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

    const valid = expected === razorpay_signature;
    return NextResponse.json({ ok: valid });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Verify failed" }, { status: 500 });
  }
}
