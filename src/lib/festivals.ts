// src/lib/festivals.ts
import list from "@/data/festivals-2025.json";
import type { Festival } from "@/types/festival";

const IST = "Asia/Kolkata";

function nowIST(): Date {
  // Build "now" in IST by formatting and re-parsing to strip time drift
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  // month is 1-based in output, 0-based in Date
  return new Date(get("year"), get("month") - 1, get("day"));
}

function toDateISO(x: string): Date {
  // Treat as local midnight IST to avoid off-by-one on comparisons
  // We interpret x as UTC midnight and compare date-only values.
  return new Date(x + "T00:00:00.000Z");
}

export type UpcomingParams = {
  days?: number;
  region?: string; // "IN" or "IN-TN" etc
  tags?: string[]; // must include all provided tags if set
};

export function getAll(): Festival[] {
  // keep original JSON shape; do not mutate
  return (list as Festival[]).slice();
}

export function getUpcoming(params: UpcomingParams = {}) {
  const { days = 45, region, tags } = params;
  const today = nowIST();
  const end = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const items = getAll()
    .map((f) => ({ ...f, _date: toDateISO(f.date_iso) }))
    .filter((f) => f._date >= today && f._date <= end)
    .filter(
      (f) =>
        !region ||
        (f.region || "IN").toLowerCase().startsWith(region.toLowerCase())
    )
    .filter((f) => !tags?.length || (f.tags || []).every((t) => tags.includes(t)))
    .sort((a, b) => a._date.getTime() - b._date.getTime());

  return items;
}

export function getFeatured(limit = 8) {
  return getAll()
    .map((f) => ({ ...f, _date: toDateISO(f.date_iso) }))
    .filter((f) => f.featured)
    .sort((a, b) => a._date.getTime() - b._date.getTime())
    .slice(0, limit);
}

export function sectionize() {
  const today = nowIST();
  const week = getUpcoming({ days: 7 });
  const month = getUpcoming({ days: 30 });
  const nextMonth = getUpcoming({ days: 60 }).filter(
    (f) => f._date.getTime() > (month[month.length - 1]?._date.getTime() ?? 0)
  );
  const featured = getFeatured();
  return {
    today,
    week,
    month,
    nextMonth,
    featured,
    todayISO: today.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* NEW: helpers to find and to get the next-dated instance by slug     */
/* ------------------------------------------------------------------ */

export function findBySlug(slug: string): Festival | undefined {
  return getAll().find((f) => f.slug === slug);
}

/**
 * Returns the next occurrence (>= today IST) for the given slug,
 * falling back to the first matching item if all are in the past.
 * Works with your current JSON field `date_iso`.
 */
export function nextFestival(slug: string): Festival | undefined {
  const all = getAll().filter((f) => f.slug === slug);
  if (all.length === 0) return undefined;

  const today = nowIST().getTime();
  const upcoming = all
    .map((f) => ({ f, t: toDateISO(f.date_iso).getTime() }))
    .filter(({ t }) => t >= today)
    .sort((a, b) => a.t - b.t);

  return (upcoming[0]?.f as Festival) || all[0];
}
