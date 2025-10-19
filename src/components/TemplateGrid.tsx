// src/components/TemplateGrid.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { templates } from "@/templates";
import { Search, Sparkles, Filter, X } from "lucide-react";

/* --------------------------------- Types ---------------------------------- */
type T = {
  id: string | number;
  slug: string;
  title: string;
  thumbnail: string;
  languages?: string[];
  accent?: string; // tailwind gradient e.g. "from-amber-400 via-rose-400 to-indigo-500"
};

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: Math.min(i * 0.03, 0.25) },
  viewport: { once: true, amount: 0.25 },
});

/* ------------------------------ Decorations ------------------------------- */
function FestiveGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-14 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,193,7,0.18),transparent_60%)] blur-3xl" />
      <div className="absolute right-[-8%] top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,67,54,0.12),transparent_60%)] blur-3xl" />
    </div>
  );
}

/* --------------------------------- Chips ---------------------------------- */
function LangChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 transition
      ${
        active
          ? "bg-ink-900 text-white ring-white/60"
          : "bg-white/85 text-ink-800 ring-white/60 hover:bg-white"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

/* --------------------------------- Card ----------------------------------- */
function TemplateCard({ t, i }: { t: T; i: number }) {
  const accent = t.accent || "from-amber-400 via-rose-400 to-indigo-500";
  return (
    <Link
      href={`/builder?template=${t.slug}`}
      className="group relative block focus:outline-none"
      aria-label={`Open ${t.title} template`}
      prefetch={false}
    >
      <motion.div
        {...fadeUp(i)}
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={`rounded-2xl bg-gradient-to-br ${accent} p-[1px]
          ring-0 ring-offset-2 ring-offset-white
          group-focus-visible:ring-4 group-focus-visible:ring-amber-500/40`}
      >
        <article className="relative overflow-hidden rounded-[14px] bg-white/85 shadow-sm ring-1 ring-black/5 backdrop-blur">
          {/* Media */}
          <div className="relative aspect-[16/9] w-full">
            {/* Subtle wash behind image */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${accent} opacity-[0.15]`}
            />
            <Image
              src={t.thumbnail}
              alt={t.title}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
            {/* Hover CTA */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-sm backdrop-blur">
                Preview & customize
              </div>
            </div>
            {/* Sparkle */}
            <svg
              className="pointer-events-none absolute right-3 top-3 h-9 w-9 opacity-80"
              viewBox="0 0 60 60"
              fill="none"
              aria-hidden
            >
              <g filter="url(#glow)">
                <path d="M30 10l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="url(#g1)" />
              </g>
              <defs>
                <radialGradient
                  id="g1"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(30 27) rotate(90) scale(14 14)"
                >
                  <stop stopColor="#FFD166" />
                  <stop offset="1" stopColor="#FF4D8D" stopOpacity="0.7" />
                </radialGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.2" />
                </filter>
              </defs>
            </svg>
          </div>

          {/* Meta */}
          <div className="relative p-4">
            <h3 className="font-display text-base leading-snug text-ink-900 sm:text-lg">
              {t.title}
            </h3>

            {!!t.languages?.length && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50/70 px-2 py-0.5 text-[11px] font-medium text-ink-700"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}

            {/* Divider shimmer */}
            <div className="mt-3 h-px w-full overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-200 to-transparent" />

            {/* Footer row */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-ink-700">
              <span className="inline-flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"
                  />
                </svg>
                Premium look
              </span>
              <span className="opacity-80">Tap to edit</span>
            </div>
          </div>

          {/* Soft ring */}
          <div className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-black/5" />
        </article>
      </motion.div>
    </Link>
  );
}

/* --------------------------------- Main ----------------------------------- */
export default function TemplateGrid() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Collect languages dynamically
  const languages = useMemo(() => {
    const s = new Set<string>();
    (templates as T[]).forEach((t) => t.languages?.forEach((l) => s.add(l)));
    return Array.from(s).sort();
  }, []);

  const list = useMemo(() => {
    let arr = templates as T[];
    if (lang) arr = arr.filter((t) => t.languages?.includes(lang));
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.languages || []).some((l) => l.toLowerCase().includes(q))
      );
    }
    return arr;
  }, [query, lang]);

  const count = list.length;

  return (
    <section id="templates" className="relative mx-auto max-w-6xl px-4 pb-20">
      <FestiveGlow />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            Popular{" "}
            <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 bg-clip-text text-transparent">
              Templates
            </span>
          </h2>
          <p className="mt-1 text-sm text-ink-700">
            Festive intros, wishes & invite designs — ready for WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-2 text-sm font-medium text-ink-900 shadow-sm backdrop-blur hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          >
            See all
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="opacity-70"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6z"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        {/* Search */}
        <label
          htmlFor="template-search"
          className="relative flex items-center rounded-xl border border-white/60 bg-white/90 px-3 py-2 shadow-sm backdrop-blur"
        >
          <Search className="mr-2 h-4 w-4 text-ink-600" aria-hidden />
          <input
            id="template-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates, e.g. Diwali / Birthday / Wedding"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
            aria-label="Search templates"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="ml-2 rounded-md p-1 text-ink-600 hover:bg-ink-100/60"
              aria-label="Clear search"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        {/* Filter toggle (mobile) */}
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-ink-900 shadow-sm backdrop-blur sm:hidden"
          aria-expanded={showFilters}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Language chips */}
      <div
        className={`mb-5 flex gap-2 overflow-x-auto pb-1 ${
          showFilters ? "block" : "hidden sm:flex"
        }`}
        role="toolbar"
        aria-label="Filter by language"
      >
        <LangChip label="All" active={!lang} onClick={() => setLang(null)} />
        {languages.map((l) => (
          <LangChip key={l} label={l} active={lang === l} onClick={() => setLang(l)} />
        ))}
      </div>

      {/* Results meta */}
      <div
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/85 px-3 py-1 text-xs text-ink-700 backdrop-blur"
        aria-live="polite"
      >
        <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
        Showing <strong className="mx-1">{count}</strong> template{count !== 1 ? "s" : ""}{" "}
        {lang ? (
          <>
            in{" "}
            <span className="ml-1 inline-flex items-center rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-medium text-white">
              {lang}
            </span>
          </>
        ) : null}
        {query ? <span className="ml-1 opacity-80">for “{query}”</span> : null}
      </div>

      {/* Mobile rail (snap) */}
      <div className="sm:hidden">
        <div className="flex snap-x gap-4 overflow-x-auto pb-2">
          {list.map((t, i) => (
            <div key={t.id} className="snap-start shrink-0 basis-[82%] sm:basis-[48%]">
              <TemplateCard t={t} i={i} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden grid-cols-2 gap-6 sm:grid lg:grid-cols-3">
        {list.map((t, i) => (
          <TemplateCard key={t.id} t={t} i={i} />
        ))}
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/90 p-6 text-center text-sm text-ink-700 backdrop-blur">
          No templates found. Try a different search or language.
        </div>
      )}
    </section>
  );
}
