// src/components/PaywallGuard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePlan } from "@/context/PlanContext";
import UpgradeModal from "./UpgradeModal";

type Need = "image_hd" | "video_hd" | "brand_kit";

export default function PaywallGuard({
  inviteId,
  need,
  children,
  onUpgraded,
}: {
  inviteId: string;
  need: Need;
  /** Called after a successful upgrade (optional planId provided) */
  onUpgraded?: (planId?: string) => void;
  children: (unlock: () => void, locked: boolean) => React.ReactNode;
}) {
  const { has } = usePlan();
  const [open, setOpen] = useState(false);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const locked = !has(need);

  const unlock = () => {
    if (locked) {
      lastFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    }
  };

  // Prevent background scroll + basic ESC close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      // return focus to the last focused element
      lastFocusRef.current?.focus?.();
    };
  }, [open]);

  return (
    <>
      {children(unlock, locked)}
      {open && (
        <UpgradeModal
          inviteId={inviteId}
          need={need}
          defaultPlan={need} // highlight the most relevant plan
          onClose={() => setOpen(false)}
          onUpgraded={(planId) => {
            setOpen(false);
            onUpgraded?.(planId);
          }}
        />
      )}
    </>
  );
}
