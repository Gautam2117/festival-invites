// src/components/RSVPForm.tsx
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Mode = "simple" | "counts";

export default function RSVPForm({
  inviteId,
  mode = "counts",
}: {
  inviteId: string;
  mode?: Mode;
}) {
  const reduce = useReducedMotion();
  const formId = useId();
  const nameId = `${formId}-name`;
  const contactId = `${formId}-contact`;
  const messageId = `${formId}-message`;

  const [attending, setAttending] = useState<boolean>(true);
  const [adults, setAdults] = useState<number>(1);
  const [kids, setKids] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const okTimer = useRef<number | null>(null);

  // Prefill if the viewer already RSVP’d
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/rsvp/${inviteId}`, { cache: "no-store" });
        const j = await r.json();
        if (!mounted || !j?.mine) return;
        setAttending(!!j.mine.attending);
        setAdults(Math.max(0, Number(j.mine.adults || 0)));
        setKids(Math.max(0, Number(j.mine.kids || 0)));
        setName(j.mine.name || "");
        setContact(j.mine.contact || "");
        setMessage(j.mine.message || "");
      } catch {
        /* no-op */
      }
    })();
    return () => {
      mounted = false;
      if (okTimer.current) window.clearTimeout(okTimer.current);
    };
  }, [inviteId]);

  // Auto-zero counts if "Not attending"
  useEffect(() => {
    if (!attending) {
      setAdults(0);
      setKids(0);
    } else if (mode === "counts" && adults === 0 && kids === 0) {
      setAdults(1); // sensible default
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attending]);

  // Clamp safeguards
  useEffect(() => setAdults((n) => clamp(n, 0, 10)), [adults]);
  useEffect(() => setKids((n) => clamp(n, 0, 10)), [kids]);

  const headCopy = useMemo(() => {
    if (!attending) return "Sorry you can’t make it?";
    return mode === "counts" ? "Who’s coming?" : "See you there!";
  }, [attending, mode]);

  const adultsId = `${formId}-adults`;
  const kidsId = `${formId}-kids`;
  const statusId = `${formId}-status`;

  const showCounts = attending && mode === "counts";

  const validationError = useMemo(() => {
    if (showCounts && adults + kids < 1) {
      return "Please add at least 1 guest.";
    }
    if (contact && !isLikelyContact(contact)) {
      return "Please enter a valid email or phone number.";
    }
    return null;
  }, [showCounts, adults, kids, contact]);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (validationError) {
      setErr(validationError);
      setOk(false);
      return;
    }
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
      if (!r.ok) throw new Error(j?.error || "Failed to save RSVP");
      setOk(true);
      // ephemeral success flag
      if (okTimer.current) window.clearTimeout(okTimer.current);
      okTimer.current = window.setTimeout(() => setOk(false), 2200);
      // Notify stats widgets
      window.dispatchEvent(new CustomEvent("rsvp:changed"));
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setAttending(true);
    setAdults(1);
    setKids(0);
    setName("");
    setContact("");
    setMessage("");
    setErr(null);
    setOk(false);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/50"
      aria-live="polite"
      aria-busy={busy}
    >
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg">RSVP</h3>
        <span className="rounded-full border border-ink-200 bg-ink-50/70 px-2 py-0.5 text-xs text-ink-700">
          {headCopy}
        </span>
      </div>

      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        {/* Attending toggle (radio-group) */}
        <fieldset className="w-full">
          <legend className="sr-only">Attendance</legend>
          <div
            role="radiogroup"
            aria-labelledby={statusId}
            className="inline-flex overflow-hidden rounded-xl border border-ink-200 bg-white text-sm shadow-sm"
          >
            <input
              type="radio"
              id={`${formId}-attend-yes`}
              name={`${formId}-attending`}
              className="sr-only"
              checked={attending}
              onChange={() => setAttending(true)}
            />
            <label
              htmlFor={`${formId}-attend-yes`}
              className={`px-3 py-1.5 cursor-pointer transition ${
                attending
                  ? "bg-emerald-600 text-white"
                  : "hover:bg-emerald-50 text-ink-800"
              }`}
            >
              ✅ Attending
            </label>

            <input
              type="radio"
              id={`${formId}-attend-no`}
              name={`${formId}-attending`}
              className="sr-only"
              checked={!attending}
              onChange={() => setAttending(false)}
            />
            <label
              htmlFor={`${formId}-attend-no`}
              className={`px-3 py-1.5 cursor-pointer transition ${
                !attending
                  ? "bg-rose-600 text-white"
                  : "hover:bg-rose-50 text-ink-800"
              }`}
            >
              ❌ Not attending
            </label>
          </div>
          <span id={statusId} className="sr-only">
            Attendance selection
          </span>
        </fieldset>

        {/* Counts */}
        {showCounts && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Stepper
              id={adultsId}
              label="Adults"
              value={adults}
              setValue={(v) => setAdults(clamp(v))}
              min={0}
              max={10}
            />
            <Stepper
              id={kidsId}
              label="Kids"
              value={kids}
              setValue={(v) => setKids(clamp(v))}
              min={0}
              max={10}
            />
          </div>
        )}

        {/* Details */}
        <div className="grid gap-2">
          <label htmlFor={nameId} className="sr-only">
            Your name (optional)
          </label>
          <input
            id={nameId}
            className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
            disabled={busy}
          />

          <label htmlFor={contactId} className="sr-only">
            Contact (optional)
          </label>
          <input
            id={contactId}
            className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
            placeholder="Contact (optional • phone or email)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={80}
            inputMode="email"
            autoComplete="email"
            disabled={busy}
            aria-invalid={!!contact && !isLikelyContact(contact)}
          />

          <label htmlFor={messageId} className="sr-only">
            Message (optional)
          </label>
          <textarea
            id={messageId}
            className="min-h-[84px] rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
            placeholder="Message (optional)"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={240}
            disabled={busy}
          />
        </div>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
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

          <button
            type="button"
            onClick={resetForm}
            disabled={busy}
            className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50/60 disabled:opacity-60"
            title="Clear form"
          >
            Reset
          </button>

          {ok && <Badge tone="success">Saved!</Badge>}
          {err && <Badge tone="error">{err}</Badge>}
          {!err && validationError && <Badge tone="neutral">{validationError}</Badge>}
        </div>

        <p className="mt-1 text-[12px] text-ink-600">
          You can edit your RSVP later from this device.
        </p>
      </form>
    </motion.section>
  );
}

/* ----------------------------- Subcomponents ----------------------------- */

function Stepper({
  id,
  label,
  value,
  setValue,
  min = 0,
  max = 10,
}: {
  id: string;
  label: string;
  value: number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label htmlFor={id} className="block text-sm">
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
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) =>
            setValue(
              clamp(safeParseInt(e.target.value), min, max)
            )
          }
          className="h-10 w-full border-x border-ink-200 bg-white text-center outline-none"
          inputMode="numeric"
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
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

/* ------------------------------- Utilities -------------------------------- */

function clamp(n: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function safeParseInt(v: string) {
  const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function isLikelyContact(s: string) {
  const t = s.trim();
  // very light heuristics (avoid strictness)
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(t);
  const phone = /^[+\d][\d\s\-()]{6,}$/.test(t);
  return email || phone;
}
