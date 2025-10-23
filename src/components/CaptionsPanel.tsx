// src/components/CaptionsPanel.tsx
"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useDeferredValue,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getCaptions, type CaptionLang } from "@/lib/captions";
import { regionalOneLiners } from "./caption-seeds";
import {
  Copy,
  Check,
  Shuffle,
  Download,
  Search,
  Filter,
  Share2,
  ChevronDown,
  Sparkles,
} from "lucide-react";

type Props = {
  templateSlug: string;
  lang: CaptionLang;
  title?: string;
  names?: string;
  date?: string;
  venue?: string;
};

/* ------------------------------- Tone seeds ------------------------------- */
const formalCompany = [
  "Warm wishes from our team this festive season.",
  "Celebrating traditions and togetherness — join us.",
];
const warmFamily = [
  "Dil se khushiyan baatéin — ghar aaiye! ❤️",
  "Aapke bina mehfil adhuri hai — milte hain!",
];
const friendlyPersonal = [
  "Scene banaao, party yahin hai! 🤩",
  "Bas aa jao, baaki sab hum sambhaal lenge. ✨",
];

/* -------------------------------- Helpers -------------------------------- */
const lengthFilters = [
  { key: "all", label: "All", max: Infinity },
  { key: "status", label: "≤ 120 (Status)", max: 120 },
  { key: "short", label: "≤ 160", max: 160 },
  { key: "medium", label: "≤ 220", max: 220 },
] as const;

function charCount(s: string) {
  return [...s].length; // unicode-safe
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
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

async function shareSmartText(text: string) {
  try {
    if (navigator.share) {
      await navigator.share({ text, title: "Festival Invites" });
      return true;
    }
  } catch {
    /* ignore and fallback */
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(wa, "_blank", "noopener");
  return true;
}

/** Mulberry32 PRNG for stable shuffle */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle<T>(input: T[], seed: number) {
  const arr = [...input];
  const rnd = mulberry32(seed || 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ------------------------------- UI bits --------------------------------- */
function Glow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 800px" }}
    >
      <div className="absolute -top-20 right-[-10%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,193,7,0.16),transparent_60%)] blur-3xl" />
      <div className="absolute -bottom-24 left-[-12%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(236,64,122,0.14),transparent_60%)] blur-3xl" />
    </div>
  );
}

function SectionToggle({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-left text-sm font-medium text-ink-900 supports-[backdrop-filter]:backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="pt-3">{children}</div>
      </motion.div>
    </div>
  );
}

/* --------------------------------- Row ----------------------------------- */
function CaptionRow({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const cc = charCount(text);

  const onCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      className="group flex items-start justify-between gap-3 rounded-xl border border-white/60 bg-white/90 p-3 shadow-sm supports-[backdrop-filter]:backdrop-blur"
      style={{ contentVisibility: "auto", containIntrinsicSize: "300px 80px" }}
    >
      <p className="max-w-[75%] text-sm text-ink-900 sm:max-w-none">{text}</p>

      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] text-ink-700 ring-1 ring-ink-200"
          title={`${cc} characters`}
          aria-label={`${cc} characters`}
        >
          {cc}
        </span>

        <button
          type="button"
          onClick={() => shareSmartText(text)}
          className="rounded-lg border border-ink-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-ink-900 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          title="Share"
          aria-label="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onCopy}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
            copied
              ? "bg-emerald-600 text-white"
              : "border border-ink-200 bg-white/80 text-ink-900 hover:bg-white"
          }`}
          aria-label="Copy caption"
          aria-live="polite"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </motion.div>
  );
}

/* --------------------------------- Main ---------------------------------- */
export default function CaptionsPanel({
  templateSlug,
  lang,
  title,
  names,
  date,
  venue,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  const tokens = useMemo(
    () => ({ title, names, date, venue, slug: templateSlug }),
    [title, names, date, venue, templateSlug]
  );

  const baseCaptions = useMemo(
    () => getCaptions(templateSlug, lang, tokens),
    [templateSlug, lang, tokens]
  );

  // Regional seeds: Tamil (ta), Bengali (bn), Marathi (mr)
  const regional = regionalOneLiners[templateSlug] || {
    ta: [] as string[],
    bn: [] as string[],
    mr: [] as string[],
  };

  // UI state (persist length filter)
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q); // debounce-y rendering
  const [lengthKey, setLengthKey] =
    useState<(typeof lengthFilters)[number]["key"]>(() => {
      if (typeof window === "undefined") return "all";
      try {
        return (localStorage.getItem("fi:cap:lengthKey") as any) || "all";
      } catch {
        return "all";
      }
    });
  useEffect(() => {
    try {
      localStorage.setItem("fi:cap:lengthKey", lengthKey);
    } catch {}
  }, [lengthKey]);

  const [shuffleSeed, setShuffleSeed] = useState(0);
  const activeMax =
    lengthFilters.find((f) => f.key === lengthKey)?.max ?? Infinity;

  const filtered = useMemo(() => {
    let arr = baseCaptions;
    if (deferredQ.trim()) {
      const s = deferredQ.toLowerCase();
      arr = arr.filter((c) => c.toLowerCase().includes(s));
    }
    arr = arr.filter((c) => charCount(c) <= activeMax);
    return shuffleSeed > 0 ? seededShuffle(arr, shuffleSeed) : arr;
  }, [baseCaptions, deferredQ, activeMax, shuffleSeed]);

  const total = baseCaptions.length;
  const shown = filtered.length;

  const handleCopyAll = async () => {
    if (shown === 0) return;
    await copyToClipboard(filtered.join("\n"));
    alert("All visible captions copied!");
  };

  const handleExportTxt = () => {
    if (shown === 0) return;
    const nameSafe = templateSlug || "captions";
    downloadTextFile(`${nameSafe}-${lang}.txt`, filtered.join("\n"));
  };

  const handleShuffle = () => setShuffleSeed((s) => (s + 17) % 1000003);

  return (
    <section
      className="relative mt-8 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] supports-[backdrop-filter]:backdrop-blur-2xl"
      style={{ contentVisibility: "auto" }}
    >
      <Glow />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg sm:text-xl">Smart captions</h3>
          <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] text-ink-700 ring-1 ring-ink-200">
            {shown}/{total} visible
          </span>
          <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-medium text-white">
            {lang.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            title="Shuffle suggestions"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Shuffle
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-white hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500/40"
            title="Copy all visible captions"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy all
          </button>
          <button
            type="button"
            onClick={handleExportTxt}
            className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            title="Export .txt"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        {/* Search */}
        <label
          htmlFor="caption-search"
          className="relative flex items-center rounded-xl border border-white/60 bg-white/90 px-3 py-2 shadow-sm supports-[backdrop-filter]:backdrop-blur"
        >
          <Search className="mr-2 h-4 w-4 text-ink-600" aria-hidden />
          <input
            id="caption-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search captions (e.g., blessings, party, family)"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
            aria-label="Search captions"
            inputMode="search"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="ml-2 rounded-md p-1 text-ink-600 hover:bg-ink-100/60"
              aria-label="Clear search"
              title="Clear"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M18.3 5.71L12 12.01l-6.3-6.3L4.29 7.12l6.3 6.3l-6.3 6.3l1.41 1.41l6.3-6.3l6.3 6.3l1.41-1.41l-6.3-6.3l6.3-6.3z"
                />
              </svg>
            </button>
          )}
        </label>

        {/* Length filter rail (accessible radiogroup) */}
        <div
          className="flex items-center gap-2 overflow-x-auto"
          role="radiogroup"
          aria-label="Filter by length"
        >
          <span className="inline-flex items-center gap-1 text-xs text-ink-700">
            <Filter className="h-3.5 w-3.5" />
            Length
          </span>
          <div className="flex gap-1.5">
            {lengthFilters.map((f) => {
              const active = lengthKey === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setLengthKey(f.key)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${
                    active
                      ? "bg-ink-900 text-white ring-white/60"
                      : "bg-white/85 text-ink-800 ring-white/60 hover:bg-white"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary list */}
      <div
        className={`grid gap-2 ${
          prefersReducedMotion ? "" : "motion-safe:[&>*]:will-change-transform"
        } md:grid-cols-2`}
      >
        {filtered.map((c, i) => (
          <CaptionRow key={`${i}-${shuffleSeed}-${c.slice(0, 8)}`} text={c} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-4 rounded-xl border border-white/60 bg-white/90 p-4 text-center text-sm text-ink-700 supports-[backdrop-filter]:backdrop-blur">
          No captions found. Try a different keyword or relax the length filter.
        </div>
      )}

      {/* Tones (collapsible) */}
      <SectionToggle title="Suggested tones" defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-2">
          <CaptionBucket title="Formal (Company)" items={formalCompany} />
          <CaptionBucket title="Warm (Family)" items={warmFamily} />
          <CaptionBucket title="Friendly (Personal)" items={friendlyPersonal} />
        </div>
      </SectionToggle>

      {/* Regionals (collapsible) */}
      {(regional.ta.length || regional.bn.length || regional.mr.length) > 0 && (
        <SectionToggle title="Regional one-liners" defaultOpen={false}>
          <div className="grid gap-3 md:grid-cols-3">
            <CaptionBucket title="Tamil" items={regional.ta} />
            <CaptionBucket title="Bengali" items={regional.bn} />
            <CaptionBucket title="Marathi" items={regional.mr} />
          </div>
        </SectionToggle>
      )}

      <p className="mt-4 text-xs text-ink-700">
        Tip: Captions auto-adapt to English / हिंदी / Hinglish and your chosen
        festival. Use the <em>Status</em> filter for WhatsApp friendliness.
      </p>
    </section>
  );
}

/* ------------------------------ Subcomponents ----------------------------- */
function CaptionBucket({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-2">
        <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-800 ring-1 ring-ink-200">
          {title}
        </span>
        <span className="text-[10px] text-ink-600">{items.length} lines</span>
      </div>
      <div className="grid gap-2">
        {items.map((line, idx) => (
          <CaptionRow key={`${title}-${idx}-${line.slice(0, 6)}`} text={line} />
        ))}
      </div>
    </div>
  );
}
