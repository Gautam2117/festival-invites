import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/fbAdmin";
import type { PlanId } from "@/constants/pricing";
import { makeLimiter, limitOrThrow, getIP } from "@/lib/ops";

export const runtime = "nodejs";

const payLimiter = makeLimiter(Number(process.env.PAYMENTS_PER_IP_PER_MIN || 8), 60);

function verifySig(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const toSign = `${orderId}|${paymentId}`;
  const h = crypto.createHmac("sha256", secret).update(toSign).digest("hex");
  return h === signature;
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    await limitOrThrow(payLimiter, `payv:${ip}`, "Too many payment requests, please wait.");

    const body = (await req.json()) as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ok = verifySig(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!ok) {
      await adminDb.collection("payments").doc(razorpay_order_id).set(
        {
          status: "signature_failed",
          paymentId: razorpay_payment_id,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    const payDoc = await adminDb.collection("payments").doc(razorpay_order_id).get();
    if (!payDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const pay = payDoc.data() as any;
    const inviteId = String(pay.inviteId);
    const planId = String(pay.planId) as PlanId;

    await adminDb.collection("payments").doc(razorpay_order_id).set(
      {
        status: "paid",
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        updatedAt: Date.now(),
        ip,
      },
      { merge: true },
    );

    const entRef = adminDb.collection("entitlements").doc(inviteId);
    const entSnap = await entRef.get();
    const prev: { tiers?: PlanId[] } = entSnap.exists ? ((entSnap.data() as any) || {}) : {};
    const tiers = Array.from(new Set([...(prev.tiers || []), planId]));
    await entRef.set({ tiers, updatedAt: Date.now() }, { merge: true });

    return NextResponse.json({ ok: true, inviteId, planId });
  } catch (e: any) {
    const status = e?.status || 500;
    const headers = e?.retryAfter ? { "Retry-After": String(e.retryAfter) } : undefined;
    return NextResponse.json({ error: e.message || "Failed" }, { status, headers: headers as any });
  }
}
