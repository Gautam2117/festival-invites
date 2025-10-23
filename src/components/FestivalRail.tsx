// src/components/FestivalRail.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { sectionize } from "@/lib/festivals";
import type { Festival } from "@/types/festival";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MapPin, Wand2, Sparkles } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

/* -------------------------------- Props ---------------------------------- */
type FestivalRailProps = {
  /** Show skeleton placeholders while data is being fetched */
  loading?: boolean;
  /** How many skeleton cards to show per rail on desktop */
  skeletonCount?: number;
};

/* ----------------------------- date utilities ----------------------------- */
const IST = "Asia/Kolkata";

function daysUntilISO(iso: string): { label: string; days: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const partsNow = fmt.formatToParts(new Date());
  const yNow = Number(partsNow.find((p) => p.type === "year")?.value);
  const mNow = Number(partsNow.find((p) => p.type === "month")?.value);
  const dNow = Number(partsNow.find((p) => p.type === "day")?.value);
  const today = new Date(yNow, mNow - 1, dNow);

  const target = new Date(iso + "T00:00:00.000Z");
  const t = new Date(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate()
  );
  const diffMs = t.getTime() - today.getTime();
  const days = Math.round(diffMs / 86400000);

  let label = "";
  if (days === 0) label = "Today";
  else if (days === 1) label = "Tomorrow";
  else if (days > 1) label = `In ${days} days`;
  else label = `${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""} ago`;

  return { label, days };
}

function whenLabel(iso: string) {
  const d = new Date(iso + "T00:00:00.000Z");
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ----------------------------- pointer helpers ---------------------------- */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      setFine(window.matchMedia("(pointer: fine)").matches);
    }
  }, []);
  return fine;
}

/* ----------------------------- Skeleton bits ------------------------------ */
function Line({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-3 w-full rounded bg-ink-200/60 dark:bg-white/10 ${className}`}
    />
  );
}

function CardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm md:backdrop-blur"
      role="status"
      aria-label="Loading festival"
    >
      <div className="mb-2 aspect-[16/10] w-full overflow-hidden rounded-xl sm:aspect-[16/9]">
        <div className="h-full w-full bg-ink-200/50 dark:bg-white/10" />
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-4 w-4 rounded bg-ink-200/60 dark:bg-white/10" />
        <Line className="w-24" />
      </div>
      <Line className="mt-2 h-4 w-3/4" />
      <div className="mt-2 flex items-center justify-between">
        <Line className="h-5 w-28" />
        <Line className="h-4 w-10" />
      </div>
    </div>
  );
}

/* --------------------------------- Card ---------------------------------- */
type CardProps = Pick<
  Festival,
  "slug" | "name" | "date_iso" | "hero_image" | "region"
> & {
  /** Request Next/Image priority preloading for a handful of cards */
  priority?: boolean;
};

function Card(p: CardProps) {
  const prefersReducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const { label: relative } = daysUntilISO(p.date_iso);
  const when = whenLabel(p.date_iso);
  const region = p.region || "IN";
  const href = `/builder?festival=${encodeURIComponent(p.slug)}`;

  // image ready -> subtle fade-in
  const [ready, setReady] = useState(false);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!finePointer) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--x", `${x}%`);
      el.style.setProperty("--y", `${y}%`);
    },
    [finePointer]
  );

  const hoverLift =
    finePointer && !prefersReducedMotion ? { y: -3 } : undefined;

  return (
    <Link
      href={href}
      aria-label={`Create invite for ${p.name} on ${when}`}
      prefetch={false}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400/60 rounded-2xl"
      onMouseMove={onMove}
      style={{ contain: "content" }} // isolate paints per card
    >
      <motion.div
        whileHover={hoverLift}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm md:backdrop-blur"
      >
        {/* festive accent ring */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/70"
          style={{
            maskImage:
              "radial-gradient(200px 120px at 20% 0%, black, transparent), radial-gradient(120px 200px at 80% 100%, black, transparent)",
          }}
        />

        {/* media */}
        <div className="relative mb-2 w-full overflow-hidden rounded-xl aspect-[16/10] sm:aspect-[16/9]">
          {!ready && (
            <div className="absolute inset-0 animate-pulse bg-ink-200/50 dark:bg-white/10" />
          )}
          {p.hero_image ? (
            <Image
              src={p.hero_image}
              alt={p.name}
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 768px) 58vw, (max-width: 1024px) 33vw, 20vw"
              className={`object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              priority={!!p.priority}
              fetchPriority={p.priority ? "high" : "auto"}
              loading={p.priority ? undefined : "lazy"}
              decoding="async"
              draggable={false}
              onLoadingComplete={() => setReady(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-200 to-violet-200" />
          )}

          {/* gradient overlay + sparkle + relative label */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          <Sparkles
            className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-amber-300 opacity-80"
            aria-hidden
          />
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
            {relative}
          </div>
        </div>

        {/* info */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          <span>{when}</span>
        </div>
        <div className="mt-0.5 line-clamp-1 text-sm font-semibold">{p.name}</div>

        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            <Wand2 className="h-3.5 w-3.5" aria-hidden />
            Create invite
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 ring-1 ring-zinc-200">
            <MapPin className="h-3 w-3" aria-hidden />
            {region}
          </span>
        </div>

        {/* spotlight on hover: render only for fine pointers */}
        {finePointer && !prefersReducedMotion && (
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute -inset-12 bg-[radial-gradient(240px_160px_at_var(--x,50%)_var(--y,40%),rgba(255,255,255,0.22),transparent_60%)]" />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

/* ----------------------------- Section header ---------------------------- */
function SectionHeader({ title, loading = false }: { title: string; loading?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 ring-1 ring-white/60" />
      <h2 className="font-display text-base font-semibold tracking-tight md:text-lg">
        {title}
      </h2>
      {loading && (
        <span className="ml-2 inline-flex items-center rounded-full bg-ink-50 px-2 py-0.5 text-[10px] text-ink-700 ring-1 ring-ink-200">
          Loading…
        </span>
      )}
    </div>
  );
}

/* ------------------------------- Section UI ------------------------------- */
/** Mobile: horizontal snap rail (with edge fade)
 *  Desktop: tidy grid (2/3/4/5 cols)
 */
function Section({
  title,
  items,
  testId,
  priorityCount = 2,
  loading = false,
  skeletonCount = 5,
}: {
  title: string;
  items: CardProps[];
  testId: string;
  /** how many first cards should preload for perceived speed */
  priorityCount?: number;
  loading?: boolean;
  skeletonCount?: number;
}) {
  // Preload only a couple of cards per section for speed
  const prepared = useMemo(
    () =>
      items.map((it, idx) => ({
        ...it,
        priority: idx < priorityCount,
      })),
    [items, priorityCount]
  );

  return (
    <section
      className="mt-8 first:mt-0"
      data-testid={testId}
      aria-busy={loading}
      aria-live="polite"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "900px 600px",
      }}
    >
      <SectionHeader title={title} loading={loading} />

      {/* Mobile rail (snap) */}
      <div
        className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:hidden"
        role="list"
        aria-label={title}
        style={{
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        } as React.CSSProperties}
      >
        {(loading ? Array.from({ length: Math.min(6, skeletonCount) }) : prepared).map(
          (f, idx) => (
            <div
              key={loading ? `sk-${idx}` : (f as CardProps).slug}
              className="snap-start shrink-0 basis-[88%] xs:basis-[70%]"
              role="listitem"
            >
              {loading ? <CardSkeleton /> : <Card {...(f as CardProps)} />}
            </div>
          )
        )}
      </div>

      {/* Desktop grid */}
      <div className="mt-3 hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {(loading ? Array.from({ length: skeletonCount }) : prepared).map((f, i) =>
          loading ? (
            <CardSkeleton key={`desk-sk-${i}`} />
          ) : (
            <Card key={(f as CardProps).slug} {...(f as CardProps)} />
          )
        )}
      </div>
    </section>
  );
}

/* --------------------------------- Rail ---------------------------------- */
export default function FestivalRail({
  loading = false,
  skeletonCount = 5,
}: FestivalRailProps) {
  // If you already have data ready, sectionize immediately.
  // If you're fetching client-side, pass loading={true} first then flip to false when data arrives.
  const { featured, week, nextMonth } = sectionize();

  const slim = (arr: Festival[]) =>
    arr.map((f) => ({
      slug: f.slug,
      name: f.name,
      date_iso: f.date_iso,
      hero_image: f.hero_image,
      region: f.region,
    }));

  const nothing = !loading && !featured.length && !week.length && !nextMonth.length;
  if (nothing) return null;

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {/* festive ambient swirls (desktop only to avoid mobile jank) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-0 -z-10 hidden h-40 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,183,77,0.20),transparent_60%)] blur-2xl md:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-12 -z-10 hidden h-44 w-44 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(240,98,146,0.18),transparent_60%)] blur-2xl md:block"
      />

      <Section
        title="Featured festivals"
        items={loading ? [] : slim(featured)}
        testId="rail-featured"
        priorityCount={3}
        loading={loading}
        skeletonCount={skeletonCount}
      />
      <Section
        title="This week"
        items={loading ? [] : slim(week)}
        testId="rail-week"
        loading={loading}
        skeletonCount={skeletonCount}
      />
      <Section
        title="Next month"
        items={loading ? [] : slim(nextMonth)}
        testId="rail-next-month"
        loading={loading}
        skeletonCount={skeletonCount}
      />
    </div>
  );
}
