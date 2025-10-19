// No global declarations here — they live in src/types/razorpay.d.ts

// Create a Razorpay order via your Admin-backed API
export async function createOrder(
  planId: string,
  inviteId: string,
  customer?: { name?: string; email?: string; contact?: string }
) {
  const r = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, inviteId, customer }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Failed to create order${t ? `: ${t}` : ""}`);
  }
  const { order } = await r.json();
  return order as { id: string; amount: number; currency: string };
}

type VerifyPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function openCheckout(opts: {
  orderId: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (payload: VerifyPayload) => void;
  onFailure: (err: any) => void;
}) {
  const RazorpayCtor = (window as any).Razorpay as (new (options: any) => any) | undefined;
  if (!RazorpayCtor) throw new Error("Razorpay not loaded");

  const rzp = new RazorpayCtor({
    key: (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string) || undefined,
    order_id: opts.orderId,
    name: opts.name || "Festival Invites",
    description: opts.description || "Secure payment",
    prefill: opts.prefill || {},
    theme: { color: "#10b981" },
    handler: (res: VerifyPayload) => opts.onSuccess(res),
    // ✅ fixed syntax: remove the stray ')'
    modal: { ondismiss: () => opts.onFailure?.(new Error("Checkout closed")) },
  });

  // Optional chaining since not all versions support rzp.on
  rzp.on?.("payment.failed", (resp: any) => {
    opts.onFailure?.(resp?.error || new Error("Payment failed"));
  });

  rzp.open();
}
