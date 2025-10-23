// src/components/TemplateGrid.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { templates } from "@/templates";
import { Search, Sparkles, Filter, X } from "lucide-react";

/* --------------------------------- Types ---------------------------------- */
type T = {
  id: string | number;
  slug: string;
  title: string;
  thumbnail: string;
  languages?: string[];
  accent?: string; // e.g. "from-amber-400 via-rose-400 to-indigo-500"
};

type TemplateGridProps = {
  /** Show shimmering placeholders (useful while fetching templates server-side) */
  loading?: boolean;
  /** How many skeleton cards to render on desktop */
  skeletonCount?: number;
  /** How many skeleton cards to render on mobile rail */
  skeletonRailCount?: number;
};

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: Math.min(i * 0.03, 0.25) },
  viewport: { once: true, amount: 0.25 },
});

/* ------------------------------ Decorations ------------------------------- */
function FestiveGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Hide the heavy glows on mobile to avoid jank */}
      <div className="absolute -top-14 left-1/2 hidden h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,193,7,0.18),transparent_60%)] blur-3xl md:block" />
      <div className="absolute right-[-8%] top-24 hidden h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,67,54,0.12),transparent_60%)] blur-3xl md:block" />
    </div>
  );
}

/* ----------------------------- Pointer helper ----------------------------- */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      setFine(window.matchMedia("(pointer: fine)").matches);
    }
  }, []);
  return fine;
}

/* --------------------------------- Chips ---------------------------------- */
function LangChip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 transition
      ${
        active
          ? "bg-ink-900 text-white ring-white/60"
          : "bg-white/90 text-ink-800 ring-white/60 hover:bg-white"
      } disabled:opacity-50`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

/* ------------------------------- Skeletons -------------------------------- */
function Line({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-3 w-full rounded bg-ink-200/60 dark:bg-white/10 ${className}`}
    />
  );
}

function ChipSkeleton() {
  return (
    <div className="h-6 w-16 rounded-full bg-ink-200/60 dark:bg-white/10" />
  );
}

function CardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl bg-gradient-to-br from-ink-50 to-white p-[1px] dark:from-zinc-800/40 dark:to-zinc-800/10"
      role="status"
      aria-label="Loading template"
    >
      <article className="overflow-hidden rounded-[14px] bg-white/92 shadow-sm ring-1 ring-black/5 md:backdrop-blur dark:bg-zinc-900/60">
        <div className="relative aspect-[16/9] w-full">
          <div className="absolute inset-0 bg-ink-200/60 dark:bg-white/10" />
        </div>
        <div className="p-4">
          <Line className="h-4 w-3/4" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-14 rounded-full bg-ink-200/60 dark:bg-white/10" />
            <div className="h-5 w-10 rounded-full bg-ink-200/60 dark:bg-white/10" />
          </div>
          <div className="mt-3 h-px w-full bg-ink-200/60 dark:bg-white/10" />
          <div className="mt-3 flex items-center justify-between">
            <Line className="w-28" />
            <Line className="w-16" />
          </div>
        </div>
      </article>
    </div>
  );
}

/* --------------------------------- Card ----------------------------------- */
function TemplateCard({
  t,
  i,
  priority = false,
  finePointer,
}: {
  t: T;
  i: number;
  priority?: boolean;
  finePointer: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const accent = t.accent || "from-amber-400 via-rose-400 to-indigo-500";
  const hoverLift =
    finePointer && !prefersReducedMotion ? { y: -3 } : undefined;

  return (
    <Link
      href={`/builder?template=${t.slug}`}
      className="group relative block focus:outline-none"
      aria-label={`Open ${t.title} template`}
      prefetch={false}
      style={{ contain: "content" }} // localize paints
    >
      <motion.div
        {...fadeUp(i)}
        whileHover={hoverLift}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={`rounded-2xl bg-gradient-to-br ${accent} p-[1px]
          ring-0 ring-offset-2 ring-offset-white
          group-focus-visible:ring-4 group-focus-visible:ring-amber-500/40`}
      >
        <article className="relative overflow-hidden rounded-[14px] bg-white/92 shadow-sm ring-1 ring-black/5 md:backdrop-blur dark:bg-zinc-900/60">
          {/* Media */}
          <div className="relative aspect-[16/9] w-full">
            {/* Subtle wash behind image */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${accent} opacity-[0.12]`}
            />
            {!ready && (
              <div className="absolute inset-0 animate-pulse bg-ink-200/60 dark:bg-white/10" />
            )}
            <Image
              src={t.thumbnail}
              alt={t.title}
              fill
              priority={priority}
              fetchPriority={priority ? "high" : "auto"}
              loading={priority ? undefined : "lazy"}
              decoding="async"
              sizes="(max-width:640px) 84vw, (max-width:1024px) 45vw, 30vw"
              className={`object-cover transition-transform duration-300 group-hover:scale-[1.03]`}
              style={{ willChange: "transform,opacity", transform: "translateZ(0)" }}
              draggable={false}
              onLoadingComplete={() => setReady(true)}
            />
            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
            {/* Hover CTA (fine pointer only) */}
            {finePointer && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-sm md:backdrop-blur">
                  Preview & customize
                </div>
              </div>
            )}
            {/* Sparkle */}
            <svg
              className="pointer-events-none absolute right-3 top-3 h-9 w-9 opacity-80"
              viewBox="0 0 60 60"
              fill="none"
              aria-hidden
            >
              <g filter="url(#glow)">
                <path
                  d="M30 10l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"
                  fill="url(#g1)"
                />
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
            <div className="mt-3 h-px w-full overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-200 to-transparent dark:via-white/10" />

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
          <div className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10" />
        </article>
      </motion.div>
    </Link>
  );
}

/* --------------------------------- Main ----------------------------------- */
export default function TemplateGrid({
  loading = false,
  skeletonCount = 8,
  skeletonRailCount = 4,
}: TemplateGridProps) {
  const finePointer = useFinePointer();

  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Defer the heavy filter work while typing
  const deferredQuery = useDeferredValue(query);

  // Collect languages dynamically (stable order)
  const languages = useMemo(() => {
    const s = new Set<string>();
    (templates as T[]).forEach((t) => t.languages?.forEach((l) => s.add(l)));
    return Array.from(s).sort();
  }, []);

  const list = useMemo(() => {
    if (loading) return [] as T[];
    let arr = templates as T[];

    if (lang) arr = arr.filter((t) => t.languages?.includes(lang));

    const q = deferredQuery.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.languages || []).some((l) => l.toLowerCase().includes(q))
      );
    }
    return arr;
  }, [deferredQuery, lang, loading]);

  const count = list.length;

  // Preload only a few thumbnails (perceived speed)
  const PRIORITY_DESKTOP = 6;
  const PRIORITY_MOBILE = 3;

  return (
    <section
      id="templates"
      className="relative mx-auto max-w-6xl px-4 pb-20"
      style={{
        containIntrinsicSize: "1200px 900px",
      }}
      aria-busy={loading}
    >
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
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white/90 px-3 py-2 text-sm font-medium text-ink-900 shadow-sm md:backdrop-blur hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            aria-label="Open the full builder"
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
                d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6z"
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
          className="relative flex items-center rounded-xl border border-white/60 bg-white/95 px-3 py-2 shadow-sm md:backdrop-blur"
        >
          <Search className="mr-2 h-4 w-4 text-ink-600" aria-hidden />
          <input
            id="template-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates, e.g. Diwali / Birthday / Wedding"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
            aria-label="Search templates"
            enterKeyHint="search"
            disabled={loading}
          />
          {query && !loading && (
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
          className="flex items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/95 px-3 py-2 text-sm text-ink-900 shadow-sm md:backdrop-blur sm:hidden disabled:opacity-50"
          aria-expanded={showFilters}
          aria-controls="language-toolbar"
          disabled={loading}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Language chips */}
      <div
        id="language-toolbar"
        className={`mb-5 flex gap-2 overflow-x-auto pb-1 ${
          showFilters ? "block" : "hidden sm:flex"
        }`}
        role="toolbar"
        aria-label="Filter by language"
        style={
          {
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)",
            maskImage:
              "linear-gradient(90deg, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)",
          } as React.CSSProperties
        }
      >
        {loading ? (
          <>
            <ChipSkeleton />
            <ChipSkeleton />
            <ChipSkeleton />
            <ChipSkeleton />
          </>
        ) : (
          <>
            <LangChip
              label="All"
              active={!lang}
              onClick={() => setLang(null)}
            />
            {languages.map((l) => (
              <LangChip
                key={l}
                label={l}
                active={lang === l}
                onClick={() => setLang(l)}
              />
            ))}
          </>
        )}
      </div>

      {/* Results meta */}
      <div
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-xs text-ink-700 md:backdrop-blur"
        aria-live="polite"
      >
        <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-16 animate-pulse rounded bg-ink-200/60 dark:bg-white/10" />
            loading…
          </span>
        ) : (
          <>
            Showing <strong className="mx-1">{count}</strong> template
            {count !== 1 ? "s" : ""}{" "}
            {lang ? (
              <>
                in{" "}
                <span className="ml-1 inline-flex items-center rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-medium text-white">
                  {lang}
                </span>
              </>
            ) : null}
            {query ? (
              <span className="ml-1 opacity-80">for “{query}”</span>
            ) : null}
          </>
        )}
      </div>

      {/* Mobile rail (snap) */}
      <div className="sm:hidden">
        <div className="relative -mx-4 px-4">
          {/* Edge fades (overlay, not mask) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
          />

          <div
            className="no-scrollbar flex snap-x snap-mandatory [scroll-snap-stop:always] gap-4 overflow-x-auto overscroll-x-contain pb-2"
            role="list"
          >
            {(loading ? Array.from({ length: skeletonRailCount }) : list).map(
              (item: any, i: number) => (
                <div
                  key={loading ? `skm-${i}` : item.id}
                  className="snap-start shrink-0 basis-[88%] xs:basis-[72%] min-w-0"
                  role="listitem"
                >
                  {loading ? (
                    <CardSkeleton />
                  ) : (
                    <TemplateCard
                      t={item as T}
                      i={i}
                      finePointer={finePointer}
                      priority={i < PRIORITY_MOBILE}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Desktop grid */}
      <div
        className="hidden grid-cols-2 gap-6 sm:grid lg:grid-cols-3 2xl:grid-cols-4"
        style={{
          containIntrinsicSize: "900px 800px",
        }}
      >
        {(loading ? Array.from({ length: skeletonCount }) : list).map(
          (t: any, i) =>
            loading ? (
              <CardSkeleton key={`sk-${i}`} />
            ) : (
              <TemplateCard
                key={(t as T).id}
                t={t as T}
                i={i}
                finePointer={finePointer}
                priority={i < PRIORITY_DESKTOP}
              />
            )
        )}
      </div>

      {/* Empty state */}
      {!loading && list.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/95 p-6 text-center text-sm text-ink-700 md:backdrop-blur">
          No templates found. Try a different search or language.
        </div>
      )}
    </section>
  );
}
