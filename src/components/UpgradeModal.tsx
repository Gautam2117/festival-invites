// src/components/UpgradeModal.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
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

  const [initialPlan, setInitialPlan] = useState<PlanId>(defaultPlan);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const titleId = useId();
  const descId = useId();

  /* ----------------------------- Accessibility ---------------------------- */

  // Focus the close button for keyboard users
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Trap focus inside the modal
  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;

    const getFocusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("inert") && !el.getAttribute("aria-hidden"));

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const f = getFocusable();
      if (f.length === 0) return;

      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Shift+Tab on first -> wrap to last
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
      // Tab on last -> wrap to first
      else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", handleKey);
    return () => root.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Body scroll lock (in case PaywallGuard isn’t used)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;

    // Avoid layout shift when the scrollbar disappears
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, []);

  // Respect user’s last chosen plan (nice mobile UX)
  useEffect(() => {
    try {
      const last = localStorage.getItem("lastPlan") as PlanId | null;
      if (last && PLANS[last]) setInitialPlan(last);
    } catch {
      /* ignore */
    }
  }, []);

  /* --------------------------------- Copy --------------------------------- */

  const reason = useMemo(() => {
    switch (need) {
      case "image_hd":
        return { label: "HD Image", icon: <ImageIcon className="h-4 w-4" aria-hidden /> };
      case "video_hd":
        return { label: "HD Video", icon: <Film className="h-4 w-4" aria-hidden /> };
      case "brand_kit":
        return { label: "Brand Kit", icon: <Palette className="h-4 w-4" aria-hidden /> };
      default:
        return { label: "Premium Feature", icon: <Crown className="h-4 w-4" aria-hidden /> };
    }
  }, [need]);

  /* --------------------------------- Buy ---------------------------------- */

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

          // Persist last plan (for quick repeat purchases)
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

  const owned = (id: PlanId) => Boolean(tiers?.includes(id));

  /* ------------------------------- UI / Layout ----------------------------- */

  const backdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onRootKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Enter key quickly buys highlighted/initial plan on mobile
    if (e.key === "Enter") {
      e.preventDefault();
      if (!owned(initialPlan)) buy(initialPlan);
    }
  };

  // Simple pricing fallbacks (avoid crashing if constants missing)
  const displayPrice = (id: PlanId, fallback: string) =>
    (PLANS[id] as any)?.price ??
    (PLANS[id] as any)?.amount ??
    fallback;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] grid place-items-center bg-black/45 px-4"
        onClick={backdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(800px 500px at 50% -10%, rgba(255,255,255,0.5), transparent 60%)",
          }}
        />

        <motion.div
          ref={dialogRef}
          onKeyDown={onRootKeyDown}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-2xl supports-[max-height:90vh]:max-h-[90vh] md:max-h-[86vh]"
          initial={{ y: prefersReduced ? 0 : 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: prefersReduced ? 0 : 14, opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.22, ease: "easeOut" }}
          aria-busy={Boolean(busy)}
        >
          {/* Ribbon */}
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
            Premium
          </div>

          {/* Scrollable content container */}
          <div className="max-h-[inherit] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-5">
              <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900/90 text-white">
                <Crown className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1">
                <h2 id={titleId} className="font-display text-xl">
                  Unlock premium
                </h2>
                <p id={descId} className="mt-0.5 text-sm text-ink-700">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-xs text-ink-900 backdrop-blur">
                    {reason.icon}
                    <span className="font-medium">{reason.label}</span>
                  </span>{" "}
                  Choose a plan to continue.
                </p>
              </div>

              <button
                ref={closeBtnRef}
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-ink-700 hover:bg-ink-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Plans */}
            <div className="px-5 pb-5">
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PlanCard
                  title={PLANS.image_hd?.label || "HD Image"}
                  price={String(displayPrice("image_hd", "₹29"))}
                  subtitle="1080×1080 PNG · no watermark"
                  icon={<ImageIcon className="h-5 w-5" aria-hidden />}
                  badge={initialPlan === "image_hd" ? "Recommended" : undefined}
                  highlight={initialPlan === "image_hd"}
                  busy={busy === "image_hd"}
                  owned={owned("image_hd")}
                  onClick={() => !owned("image_hd") && buy("image_hd")}
                />

                <PlanCard
                  title={PLANS.video_hd?.label || "HD Video"}
                  price={String(displayPrice("video_hd", "₹79"))}
                  subtitle="1080×1920 MP4 · no watermark"
                  icon={<Film className="h-5 w-5" aria-hidden />}
                  badge={initialPlan === "video_hd" ? "Recommended" : undefined}
                  highlight={initialPlan === "video_hd"}
                  busy={busy === "video_hd"}
                  owned={owned("video_hd")}
                  onClick={() => !owned("video_hd") && buy("video_hd")}
                />

                <PlanCard
                  title={PLANS.brand_kit?.label || "Brand Kit"}
                  price={String(displayPrice("brand_kit", "₹149"))}
                  subtitle="Logo, colors, ribbon + end card"
                  icon={<Palette className="h-5 w-5" aria-hidden />}
                  badge={initialPlan === "brand_kit" ? "Recommended" : undefined}
                  highlight={initialPlan === "brand_kit"}
                  busy={busy === "brand_kit"}
                  owned={owned("brand_kit")}
                  onClick={() => !owned("brand_kit") && buy("brand_kit")}
                />

                <PlanCard
                  title={PLANS.season_pass?.label || "Season Pass"}
                  price={String(displayPrice("season_pass", "₹199"))}
                  subtitle="Unlimited HD images + 20 videos"
                  icon={<BadgeCheck className="h-5 w-5" aria-hidden />}
                  badge="Best value"
                  highlight={initialPlan === "season_pass"}
                  busy={busy === "season_pass"}
                  owned={owned("season_pass")}
                  onClick={() => !owned("season_pass") && buy("season_pass")}
                />
              </div>

              {/* Trust signals */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <TrustItem
                  icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
                  text="Secure checkout by Razorpay"
                />
                <TrustItem icon={<Zap className="h-4 w-4" aria-hidden />} text="UPI intent — one-screen" />
                <TrustItem icon={<Wand2 className="h-4 w-4" aria-hidden />} text="Instant entitlement" />
              </div>

              {err && (
                <div
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  role="alert"
                >
                  <X className="h-4 w-4" aria-hidden />
                  {err}
                </div>
              )}

              {/* Footer actions (safe-area padded on iOS) */}
              <div className="mt-4 flex items-center justify-end gap-2 pb-[env(safe-area-inset-bottom)]">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>

          {/* Subtle baseline */}
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
  owned,
  onClick,
}: {
  title: string;
  subtitle: string;
  price: string;
  icon: React.ReactNode;
  badge?: string;
  highlight?: boolean;
  busy?: boolean;
  owned?: boolean;
  onClick: () => void;
}) {
  const descId = useId();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || owned}
      aria-describedby={descId}
      aria-disabled={busy || owned}
      className={[
        "group relative w-full rounded-2xl border bg-white/85 p-4 text-left shadow-sm backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
        highlight
          ? "border-amber-300 ring-1 ring-amber-300/60"
          : "border-white/60 hover:bg-white",
        (busy || owned) ? "opacity-60" : "",
        "dark:border-white/20 dark:bg-zinc-900/70 dark:hover:bg-zinc-900",
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
          aria-hidden
        >
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">{title}</div>
            <div className="text-sm tabular-nums">{price}</div>
          </div>
          <div id={descId} className="mt-1 text-xs text-ink-700 dark:text-zinc-300">
            {subtitle}
          </div>

          <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1">
            {owned ? (
              <>
                <span className="bg-emerald-50 text-emerald-700 ring-emerald-200 inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Unlocked
                </span>
              </>
            ) : (
              <>
                <span className="bg-ink-50 text-ink-800 ring-ink-200 inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                  One-time unlock
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-ink-200 to-transparent dark:via-white/10" />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-700 dark:text-zinc-300">
          {owned ? "Already purchased" : "Tap to purchase"}
        </span>
        {busy ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-ink-900/90 px-2 py-1 text-xs font-medium text-white">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Processing…
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-ink-900/90 px-2 py-1 text-xs font-medium text-white group-hover:opacity-95">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {owned ? "Unlocked" : "Unlock"}
          </span>
        )}
      </div>
    </button>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/85 px-3 py-2 text-xs text-ink-800 dark:border-white/20 dark:bg-zinc-900/70 dark:text-zinc-50">
      <span className="grid h-5 w-5 place-items-center rounded-md bg-ink-900/90 text-white" aria-hidden>
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
