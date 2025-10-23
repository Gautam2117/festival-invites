// src/components/WishCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Copy, Check, Share2 } from "lucide-react";

/* ---------------------------------- Types --------------------------------- */
type Wish = {
  id?: string | number;
  message: string;
  senderName?: string;
  senderType: "company" | "family" | "personal" | string;
  logoUrl?: string | null;
  createdAt: number; // epoch ms
};

/* ------------------------------- UI metadata ------------------------------ */
const typeMeta: Record<string, { label: string; chip: string; ring: string }> = {
  company: {
    label: "Company",
    chip:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    ring: "ring-emerald-200",
  },
  family: {
    label: "Family",
    chip:
      "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
    ring: "ring-rose-200",
  },
  personal: {
    label: "Personal",
    chip:
      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
    ring: "ring-indigo-200",
  },
};

/* ------------------------------ Util helpers ------------------------------ */
function relativeTime(ts: number) {
  if (!ts) return "";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diff = ts - Date.now(); // negative -> past
  const mins = Math.round(Math.abs(diff) / 60000);
  if (mins < 60) return rtf.format(Math.sign(diff) * mins, "minute");
  const hrs = Math.round(Math.abs(diff) / 3600000);
  if (hrs < 24) return rtf.format(Math.sign(diff) * hrs, "hour");
  const days = Math.round(Math.abs(diff) / 86400000);
  return rtf.format(Math.sign(diff) * days, "day");
}

function linkify(text: string) {
  // Split by URLs while preserving text
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s]+)/g);
  return parts.map((p, i) => {
    if (/^(https?:\/\/|www\.)/i.test(p)) {
      const href = p.startsWith("http") ? p : `https://${p}`;
      return (
        <a
          key={`lnk-${i}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-words underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
        >
          {p}
        </a>
      );
    }
    return <span key={`txt-${i}`}>{p}</span>;
  });
}

function renderMessageWithBreaks(text: string) {
  // Preserve user line breaks but still linkify urls
  const lines = text.split(/\r?\n/);
  return lines.map((line, idx) => (
    <React.Fragment key={`ln-${idx}`}>
      {linkify(line)}
      {idx < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));
}

function hashGradientSeed(s: string) {
  // stable HSL from string
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${(hue + 20) % 360} 85% 55%), hsl(${(hue + 300) % 360} 85% 55%))`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function shareToWhatsApp(text: string) {
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(wa, "_blank", "noopener,noreferrer");
}

/* -------------------------------- Component -------------------------------- */
export default function WishCard(props: Wish & { /** collapse long text on mount */ collapsedLines?: number }) {
  const {
    message,
    senderName,
    senderType,
    logoUrl,
    createdAt,
    collapsedLines = 8, // mobile-first default
  } = props;

  const reduce = useReducedMotion();
  const chip = typeMeta[senderType]?.chip ?? typeMeta.personal.chip;
  const badge = typeMeta[senderType]?.label ?? "Personal";

  const timeExact = useMemo(
    () => new Date(createdAt).toLocaleString("en-IN", { hour12: true }),
    [createdAt]
  );

  const initial = (senderName || "🙂").trim().charAt(0).toUpperCase();
  const avatarGradient = useMemo(() => hashGradientSeed(senderName || initial), [senderName, initial]);

  // Live-updating relative time (every minute)
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  const rel = useMemo(() => relativeTime(createdAt), [createdAt, nowTick]);

  // Collapsible (works without line-clamp plugin)
  const contentRef = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      // approx line height 20px for text-sm; tune by measuring
      const lh = parseFloat(getComputedStyle(el).lineHeight || "20") || 20;
      setNeedsClamp(el.scrollHeight > lh * collapsedLines + 4);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsedLines, message]);

  // Copy state
  const [copied, setCopied] = useState(false);

  return (
    <motion.article
      layout
      initial={reduce ? undefined : { opacity: 0, y: 8 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative rounded-2xl bg-gradient-to-br from-white/90 to-white/70 p-[1px] shadow-sm ring-1 ring-white/70 backdrop-blur dark:from-zinc-900/70 dark:to-zinc-900/40"
      role="article"
      aria-label={`Wish from ${senderName || "Anonymous"}`}
      tabIndex={0}
    >
      <div className="rounded-[15px] bg-white/90 p-4 dark:bg-zinc-900/50">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <time
            dateTime={new Date(createdAt).toISOString()}
            title={timeExact}
            className="text-xs text-ink-600"
          >
            {rel}
          </time>
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${chip}`}>{badge}</span>
        </div>

        {/* Message */}
        <div className="mt-3">
          <p
            ref={contentRef}
            className={[
              "text-sm leading-relaxed text-ink-900 dark:text-ink-100 break-words whitespace-pre-wrap",
              !expanded && needsClamp ? "max-h-32 sm:max-h-40 overflow-hidden" : "",
            ].join(" ")}
          >
            {renderMessageWithBreaks(message)}
          </p>

          {/* Fade-out when clamped */}
          {!expanded && needsClamp && (
            <div className="pointer-events-none -mt-8 h-8 w-full bg-gradient-to-b from-transparent to-white/90 dark:to-zinc-900/50" />
          )}

          {/* Expand / collapse control (mobile friendly) */}
          {needsClamp && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-900 hover:bg-ink-50/60 dark:bg-zinc-900/50"
              aria-expanded={expanded}
              aria-controls={String(props.id || "")}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mt-3 h-px w-full overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-200/70 to-transparent dark:via-white/10" />

        {/* Footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`${senderName || "logo"} logo`}
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/70"
                decoding="async"
                loading="lazy"
              />
            ) : (
              <div
                className="grid h-8 w-8 place-items-center rounded-lg text-sm font-semibold text-white shadow-sm"
                style={{ backgroundImage: avatarGradient }}
                aria-hidden
              >
                {initial}
              </div>
            )}

            <div className="truncate text-xs text-ink-700 dark:text-ink-300">
              — {senderName ? <span className="truncate">{senderName}</span> : "Anonymous"}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(message);
                if (ok) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-ink-900 hover:bg-white"
              aria-label="Copy message"
              title="Copy"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              type="button"
              onClick={() => shareToWhatsApp(`${senderName ? senderName + ": " : ""}${message}`)}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-ink-900 hover:bg-white"
              aria-label="Share to WhatsApp"
              title="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Glow (reduced on prefers-reduced-motion) */}
      <div
        className={[
          "pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 blur-xl transition",
          reduce ? "group-hover:opacity-0" : "group-hover:opacity-70",
        ].join(" ")}
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, rgba(255,200,120,0.25), transparent)",
        }}
        aria-hidden
      />
    </motion.article>
  );
}
