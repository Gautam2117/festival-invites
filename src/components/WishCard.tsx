// src/components/WishCard.tsx
"use client";

import { motion } from "framer-motion";

type Wish = {
  id?: string | number;
  message: string;
  senderName?: string;
  senderType: "company" | "family" | "personal" | string;
  logoUrl?: string | null;
  createdAt: number;
};

const typeMeta: Record<
  string,
  { label: string; chip: string; ring: string }
> = {
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

function formatRelative(ts: number) {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 60) return rtf.format(Math.sign(diff) * mins, "minute");
  const hours = Math.round(abs / 3600000);
  if (hours < 24) return rtf.format(Math.sign(diff) * hours, "hour");
  const days = Math.round(abs / 86400000);
  return rtf.format(Math.sign(diff) * days, "day");
}

function linkify(text: string) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s]+)/g);
  return parts.map((p, i) => {
    if (/^(https?:\/\/|www\.)/i.test(p)) {
      const href = p.startsWith("http") ? p : `https://${p}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
        >
          {p}
        </a>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function WishCard(props: Wish) {
  const { message, senderName, senderType, logoUrl, createdAt } = props;
  const badge = typeMeta[senderType]?.label ?? "Personal";
  const chip = typeMeta[senderType]?.chip ?? typeMeta.personal.chip;
  const exact = new Date(createdAt).toLocaleString("en-IN", { hour12: true });

  const initial = (senderName || "🙂").trim().charAt(0).toUpperCase();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative rounded-2xl bg-gradient-to-br from-white/90 to-white/70 p-[1px] shadow-sm ring-1 ring-white/70 backdrop-blur dark:from-zinc-900/70 dark:to-zinc-900/40"
    >
      <div className="rounded-[15px] bg-white/90 p-4 dark:bg-zinc-900/50">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <time
            dateTime={new Date(createdAt).toISOString()}
            title={exact}
            className="text-xs text-ink-600"
          >
            {formatRelative(createdAt)}
          </time>
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${chip}`}>
            {badge}
          </span>
        </div>

        {/* Message */}
        <p className="mt-3 text-sm leading-relaxed text-ink-900 dark:text-ink-100">
          {linkify(message)}
        </p>

        {/* Divider shimmer */}
        <div className="mt-3 h-px w-full overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-200/70 to-transparent dark:via-white/10" />

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3">
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
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 text-sm font-semibold text-white shadow-sm">
              {initial}
            </div>
          )}
          {senderName ? (
            <div className="text-xs text-ink-700 dark:text-ink-300">— {senderName}</div>
          ) : (
            <div className="text-xs text-ink-500">— Anonymous</div>
          )}
        </div>
      </div>

      {/* Glow on hover */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 blur-xl transition group-hover:opacity-70"
        style={{ background: "radial-gradient(60% 40% at 50% 0%, rgba(255,200,120,0.25), transparent)" }}
      />
    </motion.article>
  );
}
