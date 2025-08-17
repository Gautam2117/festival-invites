import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { amount = 4900, currency = "INR", receipt = `rcpt_${Date.now()}` } = await req.json();

    const key_id = process.env.RAZORPAY_KEY_ID!;
    const key_secret = process.env.RAZORPAY_KEY_SECRET!;
    if (!key_id || !key_secret) {
      return NextResponse.json({ error: "Razorpay env vars missing" }, { status: 500 });
    }

    const rz = new Razorpay({ key_id, key_secret });

    const order = await rz.orders.create({
      amount,            // in paise (₹49.00 -> 4900)
      currency,
      receipt,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,     // send to client for Checkout
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create order failed" }, { status: 500 });
  }
}
