"use client";

import Image from "next/image";
import Link from "next/link";
import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  accent?: string;
  // expects: (t as any).kind = "invite" | "wish"
};

type TemplateGridProps = {
  loading?: boolean;
  skeletonCount?: number;
  skeletonRailCount?: number;
  kindFilter?: "invite" | "wish" | "all";
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
      <div className="absolute -top-14 left-1/2 hidden h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,193,7,0.18),transparent_60%)] blur-3xl md:block" />
      <div className="absolute right-[-8%] top-24 hidden h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,67,54,0.12),transparent_60%)] blur-3xl md:block" />
    </div>
  );
}

/* ----------------------------- Hooks/helpers ------------------------------ */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      setFine(window.matchMedia("(pointer: fine)").matches);
    }
  }, []);
  return fine;
}

function useMedia(query: string) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const on = () => setOk(m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, [query]);
  return ok;
}

/* ------------------------------ Chips & UI -------------------------------- */
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
function PremiumCardSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-ink-50 to-white p-[1px] dark:from-zinc-800/40 dark:to-zinc-800/10">
      <article className="relative overflow-hidden rounded-[14px] bg-white/92 shadow-sm ring-1 ring-black/5 md:backdrop-blur dark:bg-zinc-900/60">
        <div className="relative aspect-[16/9] w-full shimmer" />
        <div className="p-4">
          <div className="h-4 w-3/4 rounded bg-ink-200/60 dark:bg-white/10" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-14 rounded-full bg-ink-200/60 dark:bg-white/10" />
            <div className="h-5 w-10 rounded-full bg-ink-200/60 dark:bg-white/10" />
          </div>
          <div className="mt-3 h-px w-full bg-ink-200/60 dark:bg-white/10" />
          <div className="mt-3 flex items-center justify-between">
            <div className="h-3 w-28 rounded bg-ink-200/60 dark:bg-white/10" />
            <div className="h-3 w-16 rounded bg-ink-200/60 dark:bg-white/10" />
          </div>
        </div>
      </article>

      {/* Shimmer keyframes once per component tree */}
      <style jsx>{`
        .shimmer {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.04),
            rgba(0, 0, 0, 0.02)
          );
        }
        .shimmer::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.7) 40%,
            rgba(255, 255, 255, 0) 80%
          );
          transform: translateX(-100%);
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-6 sm:grid lg:grid-cols-3 2xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <PremiumCardSkeleton key={`gs-${i}`} />
      ))}
    </div>
  );
}

/* --------------------------------- Card ----------------------------------- */
function TemplateCard({
  t,
  i,
  priority = false,
  finePointer,
  onFirstPaint,
}: {
  t: T;
  i: number;
  priority?: boolean;
  finePointer: boolean;
  onFirstPaint?: () => void;
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
      style={{ contain: "content" }}
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
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${accent} opacity-[0.12]`}
            />
            {!ready && (
              <div className="absolute inset-0 shimmer rounded-[12px]" />
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
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              style={{
                willChange: "transform,opacity",
                transform: "translateZ(0)",
              }}
              draggable={false}
              onLoad={() => {
                setReady(true);
                onFirstPaint?.();
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
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

            <div className="mt-3 h-px w-full overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-200 to-transparent dark:via-white/10" />
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

      {/* local shimmer style for card */}
      <style jsx>{`
        .shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            #f3f4f6 8%,
            #ffffff 18%,
            #f3f4f6 33%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          to {
            background-position: -200% 0;
          }
        }
      `}</style>
    </Link>
  );
}

/* --------------------------------- Main ----------------------------------- */
export default function TemplateGrid({
  loading = false,
  skeletonCount = 8,
  skeletonRailCount = 4,
  kindFilter = "all",
}: TemplateGridProps) {
  const finePointer = useFinePointer();
  const isDesktop = useMedia("(min-width: 1024px)");

  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  /** Grid hydration + first-paint control */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  /** Show an overall grid skeleton until the first N images for the current view have painted */
  const targetFirstPaint = isDesktop ? 6 : 3;
  const paintedRef = useRef(0);
  const [gridReady, setGridReady] = useState(false);
  const markPaint = () => {
    paintedRef.current += 1;
    if (paintedRef.current >= targetFirstPaint) setGridReady(true);
  };
  useEffect(() => {
    // reset when filters change
    paintedRef.current = 0;
    setGridReady(false);
  }, [kindFilter, lang]);

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

    if (kindFilter !== "all") {
      arr = arr.filter((t) => (t as any).kind === kindFilter);
    }

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
  }, [deferredQuery, lang, loading, kindFilter]);

  const count = list.length;

  // Preload only a few thumbnails (perceived speed)
  const PRIORITY_DESKTOP = 6;
  const PRIORITY_MOBILE = 3;

  const heading =
    kindFilter === "wish"
      ? "Daily Wishes"
      : kindFilter === "invite"
      ? "Festival Templates"
      : "Popular Templates";

  const subcopy =
    kindFilter === "wish"
      ? "Fresh daily greetings & quotes — perfect for WhatsApp status and DMs."
      : "Festive intros, wishes & invite designs — ready for WhatsApp.";

  const placeholder =
    kindFilter === "wish"
      ? "Search wishes, e.g. Good morning / Anniversary"
      : "Search templates, e.g. Diwali / Birthday / Wedding";

  return (
    <section
      className="relative mx-auto max-w-6xl px-4 pb-20"
      style={{ containIntrinsicSize: "1200px 900px" }}
      aria-busy={loading}
    >
      <FestiveGlow />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            {heading.split(" ")[0]}{" "}
            <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 bg-clip-text text-transparent">
              {heading.split(" ").slice(1).join(" ") || ""}
            </span>
          </h2>
          <p className="mt-1 text-sm text-ink-700">{subcopy}</p>
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
            placeholder={placeholder}
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
            <div className="h-6 w-16 rounded-full bg-ink-200/60 dark:bg-white/10" />
            <div className="h-6 w-16 rounded-full bg-ink-200/60 dark:bg-white/10" />
            <div className="h-6 w-16 rounded-full bg-ink-200/60 dark:bg-white/10" />
            <div className="h-6 w-16 rounded-full bg-ink-200/60 dark:bg-white/10" />
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
        {loading || !hydrated ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-16 rounded bg-ink-200/60 dark:bg-white/10" />
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
            {deferredQuery ? (
              <span className="ml-1 opacity-80">for “{deferredQuery}”</span>
            ) : null}
          </>
        )}
      </div>

      {/* GRID — grid-level skeleton on first paint to avoid white flash */}
      {!hydrated || (!gridReady && !loading) ? (
        <GridSkeleton count={isDesktop ? 8 : 4} />
      ) : null}

      {/* Render the actual grid always (so images keep loading), but hide it visually until ready */}
      <div
        className={`grid grid-cols-2 gap-6 sm:grid lg:grid-cols-3 2xl:grid-cols-4 ${
          !gridReady && !loading
            ? "opacity-0 pointer-events-none absolute -z-10"
            : "opacity-100 relative"
        } transition-opacity duration-300`}
        style={{ containIntrinsicSize: "900px 800px" }}
      >
        {(loading ? Array.from({ length: skeletonCount }) : list).map(
          (t: any, i) =>
            loading ? (
              <PremiumCardSkeleton key={`sk-${i}`} />
            ) : (
              <TemplateCard
                key={(t as T).id}
                t={t as T}
                i={i}
                finePointer={finePointer}
                priority={i < (isDesktop ? 6 : 3)}
                onFirstPaint={markPaint}
              />
            )
        )}
      </div>

      {/* Mobile rail (kept for small screens; uses same card + shimmer) */}
      <div className="sm:hidden mt-6">
        <div className="relative -mx-4 px-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
          />
          <div
            className="no-scrollbar flex snap-x snap-mandatory [scroll-snap-stop:always] gap-4
              overflow-x-auto overscroll-x-contain pb-2
              touch-pan-x will-change-transform"
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
                    <PremiumCardSkeleton />
                  ) : (
                    <TemplateCard
                      t={item as T}
                      i={i}
                      finePointer={finePointer}
                      priority={i < 3}
                      onFirstPaint={markPaint}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!loading && hydrated && gridReady && list.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/95 p-6 text-center text-sm text-ink-700 md:backdrop-blur">
          No templates found. Try a different search or language.
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Tabbed wrapper ---------------------------- */
/** Always mount both grids so switching tabs is instant and
 * previously viewed content doesn’t “disappear” or reload on return.
 */
export function TabbedTemplates() {
  const [tab, setTab] = React.useState<"festivals" | "wishes">("festivals");
  return (
    <div className="pb-20">
      {/* Sticky segmented control */}
      <div className="sticky top-[64px] z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <div className="inline-grid grid-cols-2 rounded-xl border border-white/60 bg-white shadow-sm">
            <button
              onClick={() => setTab("festivals")}
              className={`px-4 py-2 text-sm rounded-xl ${
                tab === "festivals" ? "bg-ink-900 text-white" : "text-ink-800"
              }`}
            >
              Festivals
            </button>
            <button
              onClick={() => setTab("wishes")}
              className={`px-4 py-2 text-sm rounded-xl ${
                tab === "wishes" ? "bg-ink-900 text-white" : "text-ink-800"
              }`}
            >
              Daily wishes
            </button>
          </div>
        </div>
      </div>

      {/* Content (kept short, lazy-painted) */}
      <div
        className="mt-4"
        style={
          {
            contentVisibility: "auto",
            containIntrinsicSize: "1200px 900px",
          } as any
        }
      >
        {tab === "festivals" ? (
          <TemplateGrid kindFilter="invite" />
        ) : (
          <TemplateGrid kindFilter="wish" />
        )}
      </div>
    </div>
  );
}
