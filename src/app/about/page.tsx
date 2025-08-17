"use client";

import Link from "next/link";
import { Sparkles, Wand2, Play, Image as ImageIcon, ShieldCheck, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="relative mx-auto max-w-5xl px-4 py-14">
      {/* soft festive wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(ellipse_at_center,_rgba(255,183,77,0.22),_transparent_60%)]" />
        <div className="absolute top-40 right-[-10%] h-[28rem] w-[28rem] rounded-full blur-3xl bg-[radial-gradient(ellipse_at_center,_rgba(240,98,146,0.18),_transparent_60%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[26rem] w-[26rem] rounded-full blur-3xl bg-[radial-gradient(ellipse_at_center,_rgba(124,77,255,0.18),_transparent_60%)]" />
      </div>

      {/* Hero */}
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs text-ink-700 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
          Our mission
        </span>
        <h1 className="font-display mx-auto mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
          Make <span className="text-brand-600">festive invites</span> &{" "}
          <span className="text-brand-600">daily wishes</span> feel premium—without a designer
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-700">
          Festival Invites is a WhatsApp-first builder that turns a few details into
          scroll-stopping videos and images in seconds. Hindi, English, and Hinglish supported.
        </p>
      </section>

      {/* Highlight card */}
      <section className="card mx-auto mt-8 grid gap-8 rounded-2xl border border-white/60 bg-white/90 p-8 shadow-sm backdrop-blur md:grid-cols-3">
        <div className="flex items-start gap-4">
          <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900/90 text-white">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg">Designer quality, instantly</h3>
            <p className="mt-1 text-sm text-ink-700">
              Curated templates with tasteful motion, music, and typography—ready for WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900/90 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg">Fast & lightweight</h3>
            <p className="mt-1 text-sm text-ink-700">
              Render stills or videos on our serverless pipeline. Free previews, HD when you’re ready.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900/90 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg">Made for sharing</h3>
            <p className="mt-1 text-sm text-ink-700">
              Files are sized and optimized for messaging apps—no blurry text or awkward crops.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-10 max-w-4xl">
        <h2 className="font-display text-xl">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          <li className="rounded-xl border border-white/60 bg-white/90 p-4 backdrop-blur">
            <div className="text-xs font-medium text-ink-700">Step 1</div>
            <div className="mt-1 font-medium">Pick a template</div>
            <p className="mt-1 text-sm text-ink-700">Choose your occasion and language.</p>
          </li>
          <li className="rounded-xl border border-white/60 bg-white/90 p-4 backdrop-blur">
            <div className="text-xs font-medium text-ink-700">Step 2</div>
            <div className="mt-1 font-medium">Add details</div>
            <p className="mt-1 text-sm text-ink-700">Names, date, venue—add a photo and music if you like.</p>
          </li>
          <li className="rounded-xl border border-white/60 bg-white/90 p-4 backdrop-blur">
            <div className="text-xs font-medium text-ink-700">Step 3</div>
            <div className="mt-1 font-medium">Export & share</div>
            <p className="mt-1 text-sm text-ink-700">Free watermarked preview or HD without watermark.</p>
          </li>
        </ol>
      </section>

      {/* Formats */}
      <section className="mx-auto mt-10 max-w-4xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-5 backdrop-blur">
            <div className="inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-500 text-white ring-1 ring-white/60">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display">Vertical Video · 9:16</div>
              <p className="text-sm text-ink-700">Perfect for Status and Stories.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-5 backdrop-blur">
            <div className="inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-rose-500 to-violet-500 text-white ring-1 ring-white/60">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display">Square Image · 1:1</div>
              <p className="text-sm text-ink-700">Crisp stills for quick wishes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-12 max-w-4xl">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/builder" className="btn">
            <Wand2 className="mr-2 h-4 w-4" />
            Start Building
          </Link>
          <Link href="/#templates" className="underline">
            Browse Templates
          </Link>
        </div>
      </section>
    </main>
  );
}
