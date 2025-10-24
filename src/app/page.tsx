import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import HomeHero from "@/components/HomeHero";
import FestivalRail from "@/components/FestivalRail";
import Year from "@/components/Year";
import { TabbedTemplates } from "@/components/TemplateGrid";

export default function Home() {
  return (
    // Clip any overflowing decoration to prevent extra scroll height
    <main id="main" tabIndex={-1} className="relative overflow-hidden">
      {/* Top nav (sticky, glassy, responsive) */}
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/90 md:backdrop-blur-md supports-[backdrop-filter]:bg-white/65">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2"
            aria-label="Festival Invites home"
            prefetch={false}
          >
            <Image
              src="/fi_logo4.png"
              alt="Festival Invites logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8 rounded-xl ring-1 ring-white/60 shadow-sm transition-transform group-hover:scale-105 object-cover"
            />
            <span className="font-display text-lg tracking-tight">
              Festival <span className="text-brand-600">Invites</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm text-ink-700 md:flex">
            <Link href="#templates" prefetch={false} className="hover:text-ink-900">
              Templates
            </Link>
            <Link href="/about" prefetch={false} className="hover:text-ink-900">
              About
            </Link>
            <Link
              href="/builder"
              prefetch={false}
              className="btn"
              aria-label="Start building your invite"
            >
              Start Building
            </Link>
          </nav>

          {/* Mobile drawer (CSS-only) */}
          <details className="md:hidden">
            <summary className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-800 hover:bg-white/80">
              <Menu className="h-5 w-5" aria-hidden />
              Menu
            </summary>
            <div className="absolute left-0 right-0 top-full border-b border-white/60 bg-white">
              <nav
                id="mobile-nav"
                className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-sm"
              >
                <Link href="#templates" prefetch={false} className="rounded-md px-3 py-2 hover:bg-white">
                  Templates
                </Link>
                <Link href="/about" prefetch={false} className="rounded-md px-3 py-2 hover:bg-white">
                  About
                </Link>
                <Link
                  href="/builder"
                  prefetch={false}
                  className="btn mt-1 inline-flex w-max"
                  aria-label="Start building your invite"
                >
                  Start Building
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </header>

      {/* Soft edge festive gradients (anchored + clipped; no negative offsets) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-24 md:h-40 bg-gradient-to-b from-amber-200/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[-1] h-24 md:h-40 translate-y-1/2 bg-gradient-to-t from-rose-200/40 to-transparent"
      />

      {/* Main content */}
      <section className="relative">
        <div className="bg-[linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(255,255,255,0.96))]">
          <HomeHero />

          {/* Tighten the space below hero */}
          <div
            className="mx-auto -mt-6 md:-mt-10 max-w-6xl px-4"
            style={
              {
                containIntrinsicSize: "1000px 800px",
                // Avoid work until scrolled into view on mobile
                ["contentVisibility" as any]: "auto",
              } as React.CSSProperties
            }
          >
            <FestivalRail />
          </div>

          {/* Divider */}
          <div className="mx-auto max-w-6xl px-4">
            <div className="relative my-6 md:my-8 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent">
              <span className="absolute left-1/2 -top-3 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-ink-700 shadow-sm md:backdrop-blur">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                Popular picks
              </span>
            </div>
          </div>

          {/* Tabbed: Festivals / Daily Wishes */}
          <div
            id="templates"
            className="mx-auto max-w-6xl px-4"
            style={
              {
                containIntrinsicSize: "1200px 1100px",
                ["contentVisibility" as any]: "auto",
              } as React.CSSProperties
            }
          >
            <TabbedTemplates />
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA (with safe-area padding) */}
      <div className="fixed inset-x-0 bottom-3 z-40 mx-auto w-full max-w-6xl px-4 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-2xl border border-white/70 bg-white/95 p-2 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink-800">Create a festive invite</span>
            <Link href="/builder" prefetch={false} className="btn" aria-label="Create an invite now">
              Create now
            </Link>
          </div>
        </div>
      </div>

      {/* Footer (ensure above background layers) */}
      <footer className="relative z-10 border-t border-white/60 bg-white/90 md:backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-ink-700 sm:flex-row">
          <p>
            © <Year /> Festival Invites. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/builder" prefetch={false} className="btn" aria-label="Create an invite now">
              Create now
            </Link>
            <Link href="#templates" prefetch={false} className="underline">
              Browse templates
            </Link>
            <Link href="/about" prefetch={false} className="underline">
              About
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
