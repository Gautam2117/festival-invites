// src/components/FestivalRail.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { sectionize } from "@/lib/festivals";
import type { Festival } from "@/types/festival";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Wand2, Sparkles } from "lucide-react";

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
  else label = `${Math.abs(days)} days ago`;

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

/* --------------------------------- Card ---------------------------------- */
type CardProps = Pick<
  Festival,
  "slug" | "name" | "date_iso" | "hero_image" | "region"
>;

function Card(p: CardProps) {
  const { label: relative, days } = daysUntilISO(p.date_iso);
  const when = whenLabel(p.date_iso);
  const region = p.region || "IN";
  const href = `/builder?festival=${encodeURIComponent(p.slug)}`;

  return (
    <Link
      href={href}
      aria-label={`Create invite for ${p.name} on ${when}`}
      prefetch={false}
      className="group block"
    >
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur"
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
        <div className="relative mb-2 h-32 w-full overflow-hidden rounded-xl">
          {p.hero_image ? (
            <Image
              src={p.hero_image}
              alt={p.name}
              fill
              sizes="(max-width:768px) 80vw, (max-width:1200px) 33vw, 20vw"
              className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
              priority={days <= 7}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-rose-200 to-violet-200" />
          )}

          {/* gradient overlay + sparkle */}
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
        <div className="mt-0.5 line-clamp-1 text-sm font-semibold">
          {p.name}
        </div>

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

        {/* subtle spotlight on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -inset-12 bg-[radial-gradient(240px_160px_at_var(--x,50%)_var(--y,40%),rgba(255,255,255,0.22),transparent_60%)]" />
        </div>
      </motion.div>
    </Link>
  );
}

/* ----------------------------- Section header ---------------------------- */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 ring-1 ring-white/60" />
      <h2 className="font-display text-base font-semibold tracking-tight md:text-lg">
        {title}
      </h2>
    </div>
  );
}

/* ------------------------------- Section UI ------------------------------- */
/** Mobile: horizontal snap rail
 *  Desktop: tidy grid (3/4/5 cols)
 */
function Section({
  title,
  items,
  testId,
}: {
  title: string;
  items: CardProps[];
  testId: string;
}) {
  if (!items.length) return null;

  return (
    <section className="mt-8 first:mt-0" data-testid={testId}>
      <SectionHeader title={title} />

      {/* Mobile rail (snap) */}
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2 sm:hidden">
        {items.map((f) => (
          <div
            key={f.slug}
            className="snap-start shrink-0 basis-[72%] xs:basis-[58%]"
          >
            <Card {...f} />
          </div>
        ))}
      </div>

      {/* Desktop grid */}
      <div className="mt-3 hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((f) => (
          <Card
            key={f.slug}
            slug={f.slug}
            name={f.name}
            date_iso={f.date_iso}
            hero_image={f.hero_image}
            region={f.region}
          />
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Rail ---------------------------------- */
export default function FestivalRail() {
  const { featured, week, nextMonth } = sectionize();
  if (!featured.length && !week.length && !nextMonth.length) return null;

  const slim = (arr: Festival[]) =>
    arr.map((f) => ({
      slug: f.slug,
      name: f.name,
      date_iso: f.date_iso,
      hero_image: f.hero_image,
      region: f.region,
    }));

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {/* festive ambient swirls */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-0 -z-10 h-40 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,183,77,0.20),transparent_60%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-12 -z-10 h-44 w-44 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(240,98,146,0.18),transparent_60%)] blur-2xl"
      />

      <Section
        title="Featured festivals"
        items={slim(featured)}
        testId="rail-featured"
      />
      <Section title="This week" items={slim(week)} testId="rail-week" />
      <Section
        title="Next month"
        items={slim(nextMonth)}
        testId="rail-next-month"
      />
    </div>
  );
}
