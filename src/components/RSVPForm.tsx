// src/components/RSVPForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Mode = "simple" | "counts";

export default function RSVPForm({
  inviteId,
  mode = "counts",
}: {
  inviteId: string;
  mode?: Mode;
}) {
  const [attending, setAttending] = useState<boolean>(true);
  const [adults, setAdults] = useState<number>(1);
  const [kids, setKids] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Prefill if the viewer already RSVP’d
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/rsvp/${inviteId}`, { cache: "no-store" });
        const j = await r.json();
        if (!mounted) return;
        if (j?.mine) {
          setAttending(!!j.mine.attending);
          setAdults(Number(j.mine.adults || 0));
          setKids(Number(j.mine.kids || 0));
          setName(j.mine.name || "");
          setContact(j.mine.contact || "");
          setMessage(j.mine.message || "");
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [inviteId]);

  const headCopy = useMemo(() => {
    if (!attending) return "Sorry you can’t make it?";
    return mode === "counts" ? "Who’s coming?" : "See you there!";
  }, [attending, mode]);

  function clamp(n: number, min = 0, max = 10) {
    return Math.max(min, Math.min(max, n));
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const r = await fetch(`/api/rsvp/${inviteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attending,
          adults: mode === "counts" ? adults : attending ? 1 : 0,
          kids: mode === "counts" ? kids : 0,
          name,
          contact,
          message,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed");
      setOk(true);
      // Notify stats widgets
      window.dispatchEvent(new CustomEvent("rsvp:changed"));
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/50"
      aria-live="polite"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-lg">RSVP</h3>
        <span className="rounded-full border border-ink-200 bg-ink-50/70 px-2 py-0.5 text-xs text-ink-700">
          {headCopy}
        </span>
      </div>

      {/* Attending toggle */}
      <div className="inline-flex overflow-hidden rounded-xl border border-ink-200 bg-white text-sm shadow-sm">
        <button
          type="button"
          onClick={() => setAttending(true)}
          className={`px-3 py-1.5 transition ${
            attending
              ? "bg-emerald-600 text-white"
              : "hover:bg-emerald-50 text-ink-800"
          }`}
          aria-pressed={attending}
        >
          ✅ Attending
        </button>
        <button
          type="button"
          onClick={() => setAttending(false)}
          className={`px-3 py-1.5 transition ${
            !attending ? "bg-rose-600 text-white" : "hover:bg-rose-50 text-ink-800"
          }`}
          aria-pressed={!attending}
        >
          ❌ Not attending
        </button>
      </div>

      {/* Counts */}
      {attending && mode === "counts" && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stepper
            label="Adults"
            value={adults}
            setValue={(v) => setAdults(clamp(v))}
            min={0}
            max={10}
          />
          <Stepper
            label="Kids"
            value={kids}
            setValue={(v) => setKids(clamp(v))}
            min={0}
            max={10}
          />
        </div>
      )}

      {/* Details */}
      <div className="mt-3 grid gap-2">
        <input
          className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <input
          className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
          placeholder="Contact (optional • phone or email)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={80}
          inputMode="text"
        />
        <textarea
          className="min-h-[84px] rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
          placeholder="Message (optional)"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={240}
        />
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </span>
          ) : (
            "Save RSVP"
          )}
        </button>

        {ok && <Badge tone="success">Saved!</Badge>}
        {err && <Badge tone="error">{err}</Badge>}
      </div>

      <p className="mt-2 text-[12px] text-ink-600">
        You can edit your RSVP later from this device.
      </p>
    </motion.section>
  );
}

function Stepper({
  label,
  value,
  setValue,
  min = 0,
  max = 10,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-ink-700">{label}</div>
      <div className="flex items-center overflow-hidden rounded-xl border border-ink-200 bg-white">
        <button
          type="button"
          onClick={() => setValue(value - 1)}
          disabled={value <= min}
        className="h-10 w-10 text-lg hover:bg-ink-50 disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          –
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) =>
            setValue(
              Math.max(min, Math.min(max, parseInt(e.target.value || "0", 10)))
            )
          }
          className="h-10 w-full border-x border-ink-200 bg-white text-center outline-none"
          inputMode="numeric"
        />
        <button
          type="button"
          onClick={() => setValue(value + 1)}
          disabled={value >= max}
          className="h-10 w-10 text-lg hover:bg-ink-50 disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </label>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "error" | "neutral";
}) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "error"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-ink-50 text-ink-800 ring-ink-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1 ${styles}`}
    >
      {children}
    </span>
  );
}
