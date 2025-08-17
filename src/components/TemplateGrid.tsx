import Image from "next/image";
import Link from "next/link";
import { templates } from "@/templates";

export default function TemplateGrid() {
  return (
    <section id="templates" className="mx-auto max-w-6xl px-4 pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
            Popular <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 bg-clip-text text-transparent">Templates</span>
          </h2>
          <p className="mt-1 text-sm text-ink-700">
            Festive intros, wishes & invite designs — ready for WhatsApp.
          </p>
        </div>
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white/70 px-3 py-2 text-sm font-medium text-ink-900 shadow-sm backdrop-blur hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          See all
          <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
            <path fill="currentColor" d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6z"/>
          </svg>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => {
          const accent = t.accent || "from-amber-400 via-rose-400 to-indigo-500";
          return (
            <Link
              key={t.id}
              href={`/builder?template=${t.slug}`}
              className="group relative block"
              aria-label={`Open ${t.title} template`}
              prefetch={false}
            >
              {/* Gradient frame */}
              <div className={`rounded-2xl bg-gradient-to-br ${accent} p-[1px] transition-transform duration-300 group-hover:-translate-y-0.5`}>
                {/* Card */}
                <article className="relative overflow-hidden rounded-[15px] bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur">
                  {/* Media */}
                  <div className="relative aspect-[16/9] w-full">
                    {/* Accent gradient behind image (for richer color on thumb) */}
                    <div className={`absolute inset-0 bg-gradient-to-tr ${accent} opacity-[0.15]`} />
                    <Image
                      src={t.thumbnail}
                      alt={t.title}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    {/* Soft bottom fade for legibility */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />

                    {/* Hover scrim + CTA */}
                    <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="rounded-xl bg-white/85 px-3 py-1.5 text-sm font-semibold text-ink-900 shadow-sm backdrop-blur">
                        Preview & customize
                      </div>
                    </div>

                    {/* Sparkles (subtle) */}
                    <svg
                      className="pointer-events-none absolute right-3 top-3 h-10 w-10 opacity-70"
                      viewBox="0 0 60 60"
                      fill="none"
                    >
                      <g filter="url(#glow)">
                        <path d="M30 10l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="url(#g1)" />
                      </g>
                      <defs>
                        <radialGradient id="g1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30 27) rotate(90) scale(14 14)">
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
                    <h3 className="font-display text-lg leading-snug text-ink-900">
                      {t.title}
                    </h3>

                    {/* Language pills */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.languages?.map((lang: string) => (
                        <span
                          key={lang}
                          className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50/70 px-2 py-0.5 text-xs font-medium text-ink-700"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>

                    {/* Divider shimmer */}
                    <div className="mt-4 h-px w-full overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-200 to-transparent" />

                    {/* Footer row */}
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-600">
                      <span className="inline-flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        Premium look
                      </span>
                      <span className="opacity-80">Tap to edit</span>
                    </div>
                  </div>

                  {/* Soft vignette for card edges */}
                  <div className="pointer-events-none absolute inset-0 rounded-[15px] ring-1 ring-black/5" />
                </article>
              </div>

              {/* Focus ring for keyboard users */}
              <span className="absolute inset-0 rounded-2xl ring-offset-2 focus-visible:outline-none group-focus-visible:ring-4 group-focus-visible:ring-amber-500/40" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
