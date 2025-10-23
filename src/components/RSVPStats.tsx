// src/components/RSVPStats.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Stats = {
  yes: number;
  no: number;
  adults: number;
  kids: number;
  updatedAt: number;
};

function relativeTime(ts: number) {
  if (!ts) return "";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (Math.abs(mins) < 1) return "just now";
  if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");
  const hrs = Math.round(diffMs / 3600000);
  if (Math.abs(hrs) < 24) return rtf.format(-hrs, "hour");
  const days = Math.round(diffMs / 86400000);
  return rtf.format(-days, "day");
}

export default function RSVPStats({ inviteId }: { inviteId: string }) {
  const reduce = useReducedMotion();
  const [stats, setStats] = useState<Stats>({
    yes: 0,
    no: 0,
    adults: 0,
    kids: 0,
    updatedAt: 0,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);

  const totalResponses = stats.yes + stats.no;
  const yesPct = totalResponses ? Math.round((stats.yes / totalResponses) * 100) : 0;
  const noPct = totalResponses ? 100 - yesPct : 0;
  const totalGuests = stats.adults + stats.kids;

  async function fetchStats() {
    try {
      setErr(null);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const r = await fetch(`/api/rsvp/${inviteId}/stats`, {
        cache: "no-store",
        signal: ctrl.signal,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");
      setStats(j);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // Boot + event bridge + visibility-aware polling
  useEffect(() => {
    setLoading(true);
    fetchStats();

    const onChanged = () => fetchStats();
    window.addEventListener("rsvp:changed", onChanged);

    function startPolling() {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        if (document.visibilityState === "visible") fetchStats();
      }, 15000);
    }
    function stopPolling() {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    startPolling();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchStats();
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("rsvp:changed", onChanged);
      document.removeEventListener("visibilitychange", onVis);
      stopPolling();
      abortRef.current?.abort();
    };
  }, [inviteId]);

  const headerRight = useMemo(() => {
    const stamp = stats.updatedAt ? relativeTime(stats.updatedAt) : "—";
    return `Updated ${stamp}`;
  }, [stats.updatedAt]);

  if (loading) {
    return (
      <section
        className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/50"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-5 w-28 animate-pulse rounded bg-ink-200/60" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-ink-200/60 p-3">
              <div className="h-4 w-16 animate-pulse rounded bg-ink-200/60" />
              <div className="mt-2 h-6 w-10 animate-pulse rounded bg-ink-200/60" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/50"
      aria-live="polite"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg">RSVP Tally</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-600">{headerRight}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchStats();
            }}
            className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium text-ink-900 hover:bg-ink-50/60"
            aria-label="Refresh RSVP stats"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Top row: donut + list */}
      <div className="mt-2 grid gap-4 sm:grid-cols-[140px,1fr]">
        <Donut yesPct={yesPct} reduce={!!reduce} />

        <div className="grid gap-3">
          <StatRow
            label="Attending"
            value={stats.yes}
            hint={`${yesPct}%`}
            tone="yes"
            reduce={!!reduce}
          />
          <StatRow
            label="Not attending"
            value={stats.no}
            hint={`${noPct}%`}
            tone="no"
            reduce={!!reduce}
          />
          <div className="mt-1 text-xs text-ink-700">
            Breakdown: <strong>{stats.adults}</strong> adults ·{" "}
            <strong>{stats.kids}</strong> kids
          </div>

          <div className="mt-1 inline-flex flex-wrap items-center gap-2 rounded-xl border border-ink-200/60 bg-white px-3 py-2 text-xs text-ink-800">
            <span className="inline-flex items-center gap-1">
              Total responses:
              <strong className="ml-1 tabular-nums">{totalResponses}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              Expected guests:
              <strong className="ml-1 tabular-nums">{totalGuests}</strong>
            </span>
          </div>

          {err && (
            <div className="mt-1 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {err}
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  fetchStats();
                }}
                className="underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Parts --------------------------------- */

function Donut({ yesPct, reduce }: { yesPct: number; reduce: boolean }) {
  const R = 50;
  const CIRC = 2 * Math.PI * R;
  const safePct = Math.max(0, Math.min(100, yesPct));
  const yesLen = (safePct / 100) * CIRC;

  return (
    <div
      className="relative grid place-items-center"
      role="img"
      aria-label={`Attending: ${safePct} percent`}
    >
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="12" />
        <motion.circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${CIRC}` }}
          animate={{ strokeDasharray: `${yesLen} ${CIRC - yesLen}` }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 18 }
          }
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center rotate-90">
        <div className="text-center leading-tight">
          <div className="text-2xl font-semibold tabular-nums">{safePct}%</div>
          <div className="text-[11px] text-ink-600">Yes</div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  hint,
  tone = "yes",
  reduce,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "yes" | "no";
  reduce: boolean;
}) {
  const bar =
    tone === "yes"
      ? "from-emerald-500/85 to-indigo-500/85"
      : "from-rose-500/85 to-amber-500/85";
  const pct = clamp(Number((Number(hint?.replace("%", "")) || 0)), 0, 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div>{label}</div>
        <div className="tabular-nums text-ink-800">
          <strong>{value}</strong>
          {Number.isFinite(pct) ? (
            <span className="ml-2 text-xs text-ink-600">{pct}%</span>
          ) : null}
        </div>
      </div>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-200/50"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${label} percentage`}
      >
        <motion.div
          className={`h-2 bg-gradient-to-r ${bar}`}
          style={{ width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }
          }
        />
      </div>
    </div>
  );
}

/* -------------------------------- Utilities ------------------------------- */

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}
