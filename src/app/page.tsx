import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import TemplateGrid from "@/components/TemplateGrid";

export default function Home() {
  return (
    <main className="relative">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/65 backdrop-blur-md supports-[backdrop-filter]:bg-white/65">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="inline-grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-500 ring-1 ring-white/60 shadow-sm transition-transform group-hover:scale-105" />
            <span className="font-display text-lg tracking-tight">
              Festival <span className="text-brand-600">Invites</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-ink-700 md:flex">
            <Link href="#templates" className="hover:text-ink-900">
              Templates
            </Link>
            {/* NEW: About link */}
            <Link href="/about" className="hover:text-ink-900">
              About
            </Link>
            <Link href="/builder" className="btn">
              Start Building
            </Link>
          </nav>
        </div>
      </header>

      {/* Soft edge gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-48 bg-gradient-to-b from-amber-200/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-24 -z-10 h-48 bg-gradient-to-t from-rose-200/40 to-transparent"
      />

      {/* Main content */}
      <section className="relative">
        <div className="bg-[linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(255,255,255,0.96))]">
          <HomeHero />

          {/* festive divider */}
          <div className="mx-auto max-w-6xl px-4">
            <div className="relative my-10 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent">
              <span className="absolute left-1/2 -top-3 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-ink-700 shadow-sm backdrop-blur">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                Popular picks
              </span>
            </div>
          </div>

          <TemplateGrid />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-ink-700 sm:flex-row">
          <p>© {new Date().getFullYear()} Festival Invites. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/builder" className="btn">
              Create now
            </Link>
            <Link href="#templates" className="underline">
              Browse templates
            </Link>
            {/* NEW: About link in footer */}
            <Link href="/about" className="underline">
              About
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
