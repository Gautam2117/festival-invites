"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PlanId } from "@/constants/pricing";

type Ent = { inviteId: string; tiers: PlanId[] };
type Ctx = {
  inviteId?: string;
  tiers: PlanId[];
  has: (t: Exclude<PlanId,"free">) => boolean;
  setLocal: (tiers: PlanId[]) => void;
};

const PlanCtx = createContext<Ctx>({ tiers: [], has: () => false, setLocal: () => {} });

export function PlanProvider({ inviteId, children }: { inviteId?: string; children: React.ReactNode }) {
  const [tiers, setTiers] = useState<PlanId[]>([]);

  // read cached entitlements for this invite from localStorage on first load
  useEffect(() => {
    if (!inviteId) return;
    const key = `ent_${inviteId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try { const v = JSON.parse(raw); setTiers(v.tiers || []); } catch {}
    }
  }, [inviteId]);

  const api: Ctx = useMemo(() => ({
    inviteId,
    tiers,
    has: (t) => tiers.includes(t),
    setLocal: (next) => {
      if (!inviteId) return;
      setTiers(next);
      localStorage.setItem(`ent_${inviteId}`, JSON.stringify({ tiers: next, at: Date.now() }));
    }
  }), [inviteId, tiers]);

  return <PlanCtx.Provider value={api}>{children}</PlanCtx.Provider>;
}

export function usePlan() { return useContext(PlanCtx); }
