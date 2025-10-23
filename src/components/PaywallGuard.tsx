// src/components/PaywallGuard.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { usePlan } from "@/context/PlanContext";

type Need = "image_hd" | "video_hd" | "brand_kit";

type Props = {
  inviteId: string;
  need: Need;
  /** Called after a successful upgrade (optional planId provided) */
  onUpgraded?: (planId?: string) => void;
  /** Render-prop: get unlock() and locked boolean */
  children: (unlock: () => void, locked: boolean) => React.ReactNode;

  /** Optional behavior flags (all default to true for great UX) */
  closeOnRouteChange?: boolean;
  closeOnPlanUnlock?: boolean;
};

const ModalSkeleton = () => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Loading"
    className="fixed inset-0 z-[100] grid place-items-center bg-black/30"
  >
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      <div className="h-4 w-36 animate-pulse rounded bg-ink-200" />
      <div className="mt-4 h-28 w-64 animate-pulse rounded bg-ink-100" />
    </div>
  </div>
);

// Code-split the modal; preload on idle when locked to avoid click latency
const UpgradeModal = dynamic(() => import("./UpgradeModal"), {
  ssr: false,
  loading: () => <ModalSkeleton />,
});

export default function PaywallGuard({
  inviteId,
  need,
  children,
  onUpgraded,
  closeOnRouteChange = true,
  closeOnPlanUnlock = true,
}: Props) {
  const { has } = usePlan();
  const pathname = usePathname();

  // Whether feature is locked under current plan
  const locked = !has(need);

  const [open, setOpen] = useState(false);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // Scroll locking with scrollbar compensation (prevents layout shift)
  const prevOverflow = useRef<string>("");
  const prevPaddingRight = useRef<string>("");
  const prevPosition = useRef<string>("");
  const prevTop = useRef<string>("");
  const scrollYRef = useRef<number>(0);

  const lockScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    const body = document.body;
    scrollYRef.current = window.scrollY || window.pageYOffset || 0;

    // Compensate for scrollbar width (desktop)
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    prevOverflow.current = body.style.overflow;
    prevPaddingRight.current = body.style.paddingRight;
    prevPosition.current = body.style.position;
    prevTop.current = body.style.top;

    body.style.overflow = "hidden";
    if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;

    // iOS-friendly lock (avoid rubber-band)
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.width = "100%";
  }, []);

  const unlockScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    const body = document.body;
    body.style.overflow = prevOverflow.current;
    body.style.paddingRight = prevPaddingRight.current;
    body.style.position = prevPosition.current;
    body.style.top = prevTop.current;
    window.scrollTo(0, scrollYRef.current || 0);
  }, []);

  // Open handler passed to children
  const unlock = useCallback(() => {
    if (!locked) return; // nothing to do
    // Remember focus origin for a11y
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, [locked]);

  // Prefetch the modal bundle while idle if locked (snappy UX)
  useEffect(() => {
    if (!locked) return;
    const idle =
      (window as any).requestIdleCallback ||
      ((fn: Function) => setTimeout(fn as any, 200));
    const handle = idle(() => (UpgradeModal as any)?.preload?.());
    return () => {
      const cancel =
        (window as any).cancelIdleCallback || ((id: number) => clearTimeout(id));
      cancel(handle);
    };
  }, [locked]);

  // Manage body scroll lock and ESC to close
  useEffect(() => {
    if (!open) return;
    lockScroll();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
      // Return focus
      lastFocusRef.current?.focus?.();
    };
  }, [open, lockScroll, unlockScroll]);

  // Auto-close if route changes (e.g., navigation after upgrade)
  useEffect(() => {
    if (!closeOnRouteChange) return;
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Auto-close if plan unlocks elsewhere (e.g., another tab/payment success)
  useEffect(() => {
    if (!closeOnPlanUnlock) return;
    if (open && !locked) {
      setOpen(false);
      onUpgraded?.(); // best-effort notify if modal didn't emit a planId
    }
  }, [open, locked, closeOnPlanUnlock, onUpgraded]);

  return (
    <>
      {children(unlock, locked)}
      {open && (
        <UpgradeModal
          inviteId={inviteId}
          need={need}
          defaultPlan={need} // highlight the most relevant plan
          onClose={() => setOpen(false)}
          onUpgraded={(planId?: string) => {
            setOpen(false);
            onUpgraded?.(planId);
          }}
        />
      )}
    </>
  );
}
