// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import HomeHero from "@/components/HomeHero";
import TemplateGrid from "@/components/TemplateGrid";
import FestivalRail from "@/components/FestivalRail";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main className="relative">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {/* Top nav (sticky, glassy, responsive) */}
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/65 backdrop-blur-md supports-[backdrop-filter]:bg-white/65">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2"
            aria-label="Festival Invites home"
          >
            {/* Replaced the orange gradient box with your logo image (same shape & feel) */}
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
            <Link href="#templates" className="hover:text-ink-900">
              Templates
            </Link>
            <Link href="/about" className="hover:text-ink-900">
              About
            </Link>
            <Link href="/builder" className="btn" aria-label="Start building your invite">
              Start Building
            </Link>
          </nav>

          {/* Mobile drawer (CSS-only) */}
          <details className="md:hidden">
            <summary className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-800 hover:bg-white/80">
              <Menu className="h-5 w-5" aria-hidden />
              Menu
            </summary>
            <div className="absolute left-0 right-0 top-full border-b border-white/60 bg-white/95 backdrop-blur">
              <nav
                id="mobile-nav"
                className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-sm"
              >
                <Link href="#templates" className="rounded-md px-3 py-2 hover:bg-white">
                  Templates
                </Link>
                <Link href="/about" className="rounded-md px-3 py-2 hover:bg-white">
                  About
                </Link>
                <Link
                  href="/builder"
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

      {/* Soft edge festive gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-48 bg-gradient-to-b from-amber-200/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-24 -z-10 h-48 bg-gradient-to-t from-rose-200/40 to-transparent"
      />

      {/* Main content */}
      <section id="main-content" className="relative">
        <div className="bg-[linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(255,255,255,0.96))]">
          <HomeHero />

          {/* Dynamic upcoming festivals */}
          <div className="mx-auto max-w-6xl px-4">
            <FestivalRail />
          </div>

          {/* festive divider */}
          <div className="mx-auto max-w-6xl px-4">
            <div className="relative my-10 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent">
              <span className="absolute left-1/2 -top-3 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-ink-700 shadow-sm backdrop-blur">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                Popular picks
              </span>
            </div>
          </div>

          {/* Templates */}
          <section id="templates" aria-label="Browse templates">
            <TemplateGrid />
          </section>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-3 z-40 mx-auto w-full max-w-6xl px-4 md:hidden">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-2 shadow-md backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink-800">Create a festive invite</span>
            <Link href="/builder" className="btn" aria-label="Create an invite now">
              Create now
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-ink-700 sm:flex-row">
          <p>© {year} Festival Invites. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/builder" className="btn" aria-label="Create an invite now">
              Create now
            </Link>
            <Link href="#templates" className="underline">
              Browse templates
            </Link>
            <Link href="/about" className="underline">
              About
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
