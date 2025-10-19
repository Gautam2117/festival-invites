// src/components/WishForm.tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const MAX = 240;

const chips = [
  "Many many happy returns 🎉",
  "Wishing you joy, health & prosperity ✨",
  "May this season bring light to your home 🪔",
  "Congratulations! So happy for you ❤️",
];

function isHttpsUrl(u: string) {
  if (!u) return true;
  try {
    const x = new URL(u);
    return x.protocol === "https:";
  } catch {
    return false;
  }
}

export default function WishForm({ inviteId }: { inviteId: string }) {
  const [senderType, setSenderType] = useState<"company" | "family" | "personal">("personal");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<null | { approved: boolean }>(null);
  const [err, setErr] = useState<string | null>(null);

  const left = MAX - message.length;
  const leftColor =
    left < 20 ? "text-rose-600" : left < 60 ? "text-amber-600" : "text-ink-500";

  const progress = Math.min(100, Math.round((message.length / MAX) * 100));

  const canSubmit =
    !busy &&
    message.trim().length > 0 &&
    message.trim().length <= MAX &&
    (senderType !== "company" || isHttpsUrl(logoUrl));

  const helpText = useMemo(() => {
    if (senderType === "company")
      return "Tip: Add your HTTPS logo URL for a branded wish.";
    if (senderType === "family") return "Warm wishes from the family 🤗";
    return "Friendly wishes work best! Keep it short & sweet.";
  }, [senderType]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (!message.trim()) return setErr("Please write a message.");
    if (senderType === "company" && logoUrl && !isHttpsUrl(logoUrl)) {
      return setErr("Logo URL must start with https://");
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/wishes/${inviteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          senderName: senderName.trim(),
          senderType,
          logoUrl: senderType === "company" && logoUrl ? logoUrl.trim() : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setOk({ approved: !!j.approved });
      setMessage("");
      // keep name/type for convenience
      window.dispatchEvent(new CustomEvent("wish:submitted"));
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/50"
    >
      {/* Type chips */}
      <fieldset className="mb-3">
        <legend className="sr-only">Sender type</legend>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {(["personal", "family", "company"] as const).map((t) => {
            const active = senderType === t;
            return (
              <button
                type="button"
                key={t}
                onClick={() => setSenderType(t)}
                className={
                  "inline-flex items-center justify-center gap-2 rounded-xl border px-2.5 py-2 transition " +
                  (active
                    ? "bg-gradient-to-tr from-amber-100 to-rose-100 text-ink-900 ring-1 ring-amber-300"
                    : "bg-white/70 hover:bg-white")
                }
                aria-pressed={active}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Name */}
      <label className="mt-2 block text-xs font-medium text-ink-700">
        Your name (optional)
        <input
          className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
          placeholder="Your name or family/company name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          maxLength={60}
        />
      </label>

      {/* Logo URL for company */}
      {senderType === "company" && (
        <label className="mt-2 block text-xs font-medium text-ink-700">
          Logo URL (optional, HTTPS only)
          <input
            className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          {!isHttpsUrl(logoUrl) && logoUrl && (
            <p className="mt-1 text-xs text-rose-600">Please enter a valid https:// URL</p>
          )}
        </label>
      )}

      {/* Message */}
      <label className="mt-3 block text-xs font-medium text-ink-700">
        Your wish
        <textarea
          className="mt-1 min-h-[110px] w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none ring-amber-300/0 focus:ring-2"
          placeholder="Write your wish… (max 240 characters)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX}
        />
      </label>

      {/* Quick chips */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() =>
              setMessage((m) =>
                m ? (m.endsWith(" ") ? m + c : m + " " + c) : c
              )
            }
            className="rounded-full border border-ink-200 bg-ink-50/70 px-2 py-1 text-xs text-ink-800 hover:bg-white"
            aria-label={`Insert: ${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Footer row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative h-6 w-6">
            {/* progress ring */}
            <svg className="h-6 w-6 -rotate-90" viewBox="0 0 36 36" aria-hidden>
              <path
                d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="4"
              />
              <path
                d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                fill="none"
                stroke={progress > 80 ? "#dc2626" : progress > 60 ? "#d97706" : "#10b981"}
                strokeLinecap="round"
                strokeWidth="4"
                strokeDasharray={`${(progress / 100) * 100}, 100`}
              />
            </svg>
          </div>
          <div className={`text-xs ${leftColor}`}>{MAX - message.length}/240</div>
        </div>

        <button
          disabled={!canSubmit}
          className="rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send wish"}
        </button>
      </div>

      {/* Alerts */}
      {ok && (
        <p className="mt-2 text-xs text-emerald-700">
          {ok.approved
            ? "Wish posted 🎉"
            : "Thanks! Your wish was submitted and will appear after review."}
        </p>
      )}
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}

      <p className="mt-2 text-[11px] text-ink-600">Cooldown: 60s per invite.</p>

      {/* Helper line */}
      <div className="mt-2 text-xs text-ink-600">{helpText}</div>
    </motion.form>
  );
}
