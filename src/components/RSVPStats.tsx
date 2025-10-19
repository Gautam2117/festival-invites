// src/components/RSVPStats.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");
  const hrs = Math.round(diff / 3600000);
  return rtf.format(-hrs, "hour");
}

export default function RSVPStats({ inviteId }: { inviteId: string }) {
  const [stats, setStats] = useState<Stats>({
    yes: 0,
    no: 0,
    adults: 0,
    kids: 0,
    updatedAt: 0,
  });
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    try {
      const r = await fetch(`/api/rsvp/${inviteId}/stats`, { cache: "no-store" });
      const j = await r.json();
      setStats(j);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    fetchStats();
    // refresh on local changes
    const onChanged = () => fetchStats();
    window.addEventListener("rsvp:changed", onChanged);

    // light polling for real-time-ish updates
    const t = setInterval(fetchStats, 15000);
    return () => {
      window.removeEventListener("rsvp:changed", onChanged);
      clearInterval(t);
    };
  }, [inviteId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/50">
        <div className="h-5 w-28 animate-pulse rounded bg-ink-200/60" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-ink-200/60 p-3">
              <div className="h-4 w-16 animate-pulse rounded bg-ink-200/60" />
              <div className="mt-2 h-6 w-10 animate-pulse rounded bg-ink-200/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalResponses = stats.yes + stats.no;
  const yesPct = totalResponses ? Math.round((stats.yes / totalResponses) * 100) : 0;
  const noPct = totalResponses ? 100 - yesPct : 0;

  return (
    <section className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-lg">RSVP Tally</h3>
        <span className="text-xs text-ink-600">Updated {relativeTime(stats.updatedAt)}</span>
      </div>

      {/* Donut */}
      <div className="mt-2 grid gap-4 sm:grid-cols-[120px_1fr]">
        <Donut yesPct={yesPct} />

        <div className="grid gap-3">
          <StatRow label="Attending" value={stats.yes} hint={`${yesPct}%`} tone="yes" />
          <StatRow label="Not attending" value={stats.no} hint={`${noPct}%`} tone="no" />
          <div className="mt-1 text-xs text-ink-700">
            Breakdown: <strong>{stats.adults}</strong> adults ·{" "}
            <strong>{stats.kids}</strong> kids
          </div>
        </div>
      </div>
    </section>
  );
}

function Donut({ yesPct }: { yesPct: number }) {
  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const yesLen = (yesPct / 100) * CIRC;

  return (
    <div className="grid place-items-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="12"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${CIRC}` }}
          animate={{ strokeDasharray: `${yesLen} ${CIRC - yesLen}` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-14 text-center">
        <div className="text-2xl font-semibold">{yesPct}%</div>
        <div className="text-[11px] text-ink-600">Yes</div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  hint,
  tone = "yes",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "yes" | "no";
}) {
  const bar =
    tone === "yes"
      ? "from-emerald-500/80 to-indigo-500/80"
      : "from-rose-500/80 to-amber-500/80";
  const pct = Number((Number(hint?.replace("%", "")) || 0).toFixed(0));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div>{label}</div>
        <div className="tabular-nums text-ink-800">
          <strong>{value}</strong>
          {hint ? <span className="ml-2 text-xs text-ink-600">{hint}</span> : null}
        </div>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-200/50">
        <motion.div
          className={`h-2 bg-gradient-to-r ${bar}`}
          style={{ width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}
