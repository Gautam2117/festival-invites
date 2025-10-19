"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Crown,
  Sparkles,
  ShieldCheck,
  X,
  Loader2,
  Zap,
  Image as ImageIcon,
  Film,
  BadgeCheck,
  Palette,
  Wand2,
  CheckCircle2,
} from "lucide-react";

import { PLANS } from "@/constants/pricing";
import { createOrder, openCheckout } from "@/lib/pay";
import { usePlan } from "@/context/PlanContext";

type PlanId = keyof typeof PLANS;
type Need = "image_hd" | "video_hd" | "brand_kit";

export default function UpgradeModal({
  inviteId,
  onClose,
  onUpgraded,
  defaultPlan = "video_hd",
  need,
}: {
  inviteId: string;
  onClose: () => void;
  onUpgraded: (planId?: PlanId) => void;
  defaultPlan?: PlanId;
  need?: Need;
}) {
  const prefersReduced = useReducedMotion();
  const { setLocal, tiers } = usePlan();

  const [busy, setBusy] = useState<PlanId | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Focus mgmt
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // focus close for keyboard users
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reason = useMemo(() => {
    switch (need) {
      case "image_hd":
        return { label: "HD Image", icon: <ImageIcon className="h-4 w-4" /> };
      case "video_hd":
        return { label: "HD Video", icon: <Film className="h-4 w-4" /> };
      case "brand_kit":
        return { label: "Brand Kit", icon: <Palette className="h-4 w-4" /> };
      default:
        return { label: "Premium Feature", icon: <Crown className="h-4 w-4" /> };
    }
  }, [need]);

  async function buy(planId: PlanId) {
    setErr(null);
    setBusy(planId);
    try {
      const order = await createOrder(planId, inviteId);
      await openCheckout({
        orderId: order.id,
        name: "Festival Invites",
        description: PLANS[planId]?.label ?? "Festival Invites",
        onSuccess: async (payload) => {
          const vr = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const j = await vr.json();
          if (!vr.ok) throw new Error(j?.error || "Verify failed");

          // Update entitlements locally
          const next = Array.from(new Set([...(tiers || []), planId]));
          setLocal(next as any);

          // Persist "last plan" (optional UX nicety)
          try {
            localStorage.setItem("lastPlan", planId);
          } catch {}

          onUpgraded?.(planId);
          onClose();
        },
        onFailure: (e) => setErr(String(e?.message || "Payment failed")),
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to start payment");
    } finally {
      setBusy(null);
    }
  }

  const backdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] grid place-items-center bg-black/45 px-4"
        onClick={backdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Festive ambient glow behind the panel */}
        <div
          aria-hidden
          className="pointer-events-none absolute -z-10 inset-0"
          style={{
            background:
              "radial-gradient(800px 500px at 50% -10%, rgba(255,255,255,0.5), transparent 60%)",
          }}
        />

        <motion.div
          ref={dialogRef}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
          initial={{ y: prefersReduced ? 0 : 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: prefersReduced ? 0 : 12, opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.22, ease: "easeOut" }}
        >
          {/* Ribbon */}
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
            Premium
          </div>

          {/* Header */}
          <div className="flex items-start gap-3 px-5 pt-5">
            <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900/90 text-white">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 id="upgrade-title" className="font-display text-xl">
                Unlock premium
              </h2>
              <p className="mt-0.5 text-sm text-ink-700">
                {reason.icon} <span className="font-medium">{reason.label}</span> is part of our
                premium features. Choose a plan to continue.
              </p>
            </div>

            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-ink-700 hover:bg-ink-50/70 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Plans */}
          <div className="px-5 pb-5">
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* HD Image */}
              <PlanCard
                title={PLANS.image_hd?.label || "HD Image"}
                price="₹29"
                subtitle="1080×1080 PNG · no watermark"
                icon={<ImageIcon className="h-5 w-5" />}
                highlight={defaultPlan === "image_hd"}
                busy={busy === "image_hd"}
                onClick={() => buy("image_hd")}
              />

              {/* HD Video */}
              <PlanCard
                title={PLANS.video_hd?.label || "HD Video"}
                price="₹79"
                subtitle="1080×1920 MP4 · no watermark"
                icon={<Film className="h-5 w-5" />}
                highlight={defaultPlan === "video_hd"}
                busy={busy === "video_hd"}
                onClick={() => buy("video_hd")}
              />

              {/* Brand Kit */}
              <PlanCard
                title={PLANS.brand_kit?.label || "Brand Kit"}
                price="₹149"
                subtitle="Logo, colors, ribbon + end card"
                icon={<Palette className="h-5 w-5" />}
                highlight={defaultPlan === "brand_kit"}
                busy={busy === "brand_kit"}
                onClick={() => buy("brand_kit")}
              />

              {/* Season Pass (Best value) */}
              <PlanCard
                title={PLANS.season_pass?.label || "Season Pass"}
                price="₹199"
                subtitle="Unlimited HD images + 20 videos"
                icon={<BadgeCheck className="h-5 w-5" />}
                badge="Best value"
                highlight={defaultPlan === "season_pass"}
                busy={busy === "season_pass"}
                onClick={() => buy("season_pass")}
              />
            </div>

            {/* Trust & Reassurance */}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <TrustItem
                icon={<ShieldCheck className="h-4 w-4" />}
                text="Secure checkout by Razorpay"
              />
              <TrustItem icon={<Zap className="h-4 w-4" />} text="UPI intent — one-screen" />
              <TrustItem icon={<Wand2 className="h-4 w-4" />} text="Instant entitlement" />
            </div>

            {err && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <X className="h-4 w-4" />
                {err}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50/60"
              >
                Not now
              </button>
            </div>
          </div>

          {/* Subtle festive baseline */}
          <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ----------------------------- Small components --------------------------- */

function PlanCard({
  title,
  subtitle,
  price,
  icon,
  badge,
  highlight,
  busy,
  onClick,
}: {
  title: string;
  subtitle: string;
  price: string;
  icon: React.ReactNode;
  badge?: string;
  highlight?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={[
        "group relative w-full rounded-2xl border bg-white/85 p-4 text-left shadow-sm backdrop-blur transition",
        highlight ? "border-amber-300 ring-1 ring-amber-300/60" : "border-white/60 hover:bg-white",
        busy ? "opacity-60" : "",
      ].join(" ")}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          {badge}
        </span>
      )}

      <div className="flex items-start gap-3">
        <div
          className={[
            "inline-grid h-10 w-10 place-items-center rounded-xl text-white shadow ring-1 ring-white/60",
            highlight
              ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600"
              : "bg-ink-900/90",
          ].join(" ")}
        >
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">{title}</div>
            <div className="text-sm">{price}</div>
          </div>
          <div className="mt-1 text-xs text-ink-700">{subtitle}</div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            One-time unlock
          </div>
        </div>
      </div>

      <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-ink-200 to-transparent" />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-700">Tap to purchase</span>
        {busy ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-ink-900/90 px-2 py-1 text-xs font-medium text-white">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing…
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-ink-900/90 px-2 py-1 text-xs font-medium text-white group-hover:opacity-95">
            <Sparkles className="h-3.5 w-3.5" />
            Unlock
          </span>
        )}
      </div>
    </button>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/85 px-3 py-2 text-xs text-ink-800">
      <span className="grid h-5 w-5 place-items-center rounded-md bg-ink-900/90 text-white">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
