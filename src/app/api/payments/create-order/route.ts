import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/fbAdmin";
import { PLANS } from "@/constants/pricing";
import { makeLimiter, limitOrThrow, getIP } from "@/lib/ops";

export const runtime = "nodejs";

const payLimiter = makeLimiter(Number(process.env.PAYMENTS_PER_IP_PER_MIN || 8), 60);

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    await limitOrThrow(payLimiter, `pay:${ip}`, "Too many payment attempts, please wait.");

    const body = (await req.json()) as {
      planId: keyof typeof PLANS;
      inviteId: string;
      customer?: { name?: string; email?: string; contact?: string };
    };
    const plan = PLANS[body.planId];
    if (!plan || !body.inviteId) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
          ).toString("base64"),
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt: `inv_${body.inviteId}_${Date.now()}`,
        notes: { inviteId: body.inviteId, planId: body.planId },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: "Razorpay order failed", detail: t }, { status: 500 });
    }

    const order = await res.json();
    await adminDb.collection("payments").doc(order.id).set({
      orderId: order.id,
      inviteId: body.inviteId,
      planId: body.planId,
      amount: plan.amount,
      currency: plan.currency,
      status: "created",
      createdAt: Date.now(),
      customer: body.customer || {},
      ip,
    });

    return NextResponse.json({ order });
  } catch (e: any) {
    const status = e?.status || 500;
    const headers = e?.retryAfter ? { "Retry-After": String(e.retryAfter) } : undefined;
    return NextResponse.json({ error: e.message || "Failed" }, { status, headers: headers as any });
  }
}
