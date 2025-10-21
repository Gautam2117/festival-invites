"use client";

import { useState } from "react";
import { loadRazorpay } from "@/lib/loadRazorpay";

type Props = {
  plan: "pro" | "pro-max";
};

export default function PayButton({ plan }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    try {
      setBusy(true);

      // 1) load script only now
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Razorpay not available");

      // 2) get order from your backend
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const { orderId, amount, currency, key, customer } = await res.json();

      // 3) open checkout
      const rzp = new window.Razorpay!({
        key,
        amount,
        currency,
        order_id: orderId,
        name: "Festival Invites",
        description: `Upgrade to ${plan}`,
        prefill: {
          name: customer?.name,
          email: customer?.email,
          contact: customer?.phone
        },
        handler: async (response: any) => {
          // optionally verify on backend
          await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response)
          });
        },
        theme: { color: "#ef4444" }
      });

      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Payment could not be started. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={busy} className="btn btn-primary">
      {busy ? "Please wait..." : "Upgrade"}
    </button>
  );
}
