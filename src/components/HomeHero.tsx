"use client";

import { useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Wand2, Wallet, Languages, Play, ChevronDown } from "lucide-react";
import Link from "next/link";

/**
 * HomeHero — premium, festive, mobile-first hero
 * - Subtle aurora + radial glows (pointer-events-none, so clicks never break)
 * - Cursor spotlight (CSS vars) with reduced-motion fallback
 * - Glass badge, gradient headline, micro-interactions
 * - Trust chips & scroll cue
 */
export default function HomeHero() {
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // lightweight spotlight following cursor
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      onMouseMove={handleMouseMove}
      // default spotlight origin (center) for touch devices
      style={{ ["--mx" as any]: "50%", ["--my" as any]: "40%" }}
    >
      {/* === Ambient festive background layers (non-interactive) === */}
      <div className="pointer-events-none absolute inset-0">
        {/* Aurora blades */}
        <div className="absolute -top-36 left-1/2 h-[48rem] w-[48rem] -translate-x-1/2 rounded-full bg-[conic-gradient(from_210deg,rgba(255,193,7,0.22),rgba(244,67,54,0.18),rgba(124,77,255,0.20),transparent_75%)] blur-3xl" />
        {/* Radial orbs */}
        <div className="absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,183,77,0.18),transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-20 -right-16 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(236,64,122,0.16),transparent_60%)] blur-2xl" />
        {/* Starry grid */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20px 20px, rgba(255,255,255,0.9) 1px, transparent 0)",
            backgroundSize: "38px 38px",
          }}
        />
      </div>

      {/* Cursor spotlight (soft, masked). Fallback: static glow if reduced-motion */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background: prefersReducedMotion
            ? "radial-gradient(320px 220px at 50% 40%, rgba(255,255,255,0.20), transparent 60%)"
            : "radial-gradient(360px 240px at var(--mx) var(--my), rgba(255,255,255,0.22), transparent 60%)",
          maskImage:
            "radial-gradient(500px 340px at 50% 30%, black, transparent 70%)",
        }}
      />

      {/* Floating sparkles for festive vibe (respect reduced motion) */}
      {!prefersReducedMotion && (
        <>
          <Floater className="left-[12%] top-[18%]" delay={0} />
          <Floater className="left-[82%] top-[26%]" delay={0.2} />
          <Floater className="left-[14%] top-[64%]" delay={0.4} />
          <Floater className="left-[76%] top-[72%]" delay={0.6} />
        </>
      )}

      {/* === Content === */}
      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 text-center sm:pb-24">
        {/* Glass badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/40 px-3 py-1 text-xs sm:text-sm backdrop-blur-md shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-gray-800">
            WhatsApp-first invites & wishes
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6 }}
          className="font-display mt-5 text-[2.1rem] leading-tight sm:text-5xl md:text-6xl"
        >
          Create{" "}
          <span className="bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">
            stunning festival invites
          </span>{" "}
          &{" "}
          <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            daily wishes
          </span>{" "}
          in seconds
        </motion.h1>

        {/* Subcopy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mx-auto mt-4 max-w-2xl text-[15px] text-gray-700 sm:text-base md:text-lg"
        >
          Pick an occasion, add your details, and share a beautiful{" "}
          <span className="font-semibold text-gray-900">video</span> or{" "}
          <span className="font-semibold text-gray-900">image</span> on WhatsApp.
          English, हिंदी & Hinglish templates — crafted for a festive glow. 🪔
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/builder"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-600 px-6 py-3 text-white shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
            aria-label="Start building your invite"
          >
            <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="font-medium">Start Building</span>
          </Link>

          <Link
            href="#templates"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-300/70 bg-white/75 px-5 py-3 text-gray-900 backdrop-blur-md transition-colors hover:bg-white"
            aria-label="Browse templates"
          >
            Browse Templates
          </Link>
        </motion.div>

        {/* Trust chips */}
        <motion.ul
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 text-sm text-ink-800 sm:grid-cols-3"
          aria-label="Highlights"
        >
          <TrustChip icon={<Play className="h-4 w-4" />} text="Status-ready presets" />
          <TrustChip icon={<Wallet className="h-4 w-4" />} text="UPI-intent checkout" />
          <TrustChip icon={<Languages className="h-4 w-4" />} text="English · हिंदी · Hinglish" />
        </motion.ul>

        {/* Mini festive strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/25 bg-white/40 px-4 py-2 text-sm font-medium text-gray-800 backdrop-blur-md shadow"
          aria-label="Popular occasions"
        >
          <span>🪔 Diwali</span>
          <Dot />
          <span>🎊 Navratri</span>
          <Dot />
          <span>🎉 Birthdays</span>
          <Dot />
          <span>💍 Weddings</span>
          <Dot />
          <span>🌙 Eid</span>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-10 flex items-center justify-center"
        >
          <a
            href="#templates"
            className="group inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-3 py-1 text-xs text-ink-700 backdrop-blur-md hover:bg-white"
            aria-label="Scroll to templates"
          >
            Explore templates
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Tiny pieces ---------- */

function TrustChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-ink-800 backdrop-blur">
      <span className="inline-flex items-center gap-2">
        <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-ink-900/90 text-white">
          {icon}
        </span>
        <span className="text-[13px]">{text}</span>
      </span>
    </li>
  );
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-gray-500/60" />;
}

/** Animated sparkle floater (respects reduced motion via parent logic) */
function Floater({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      className={`pointer-events-none absolute z-[1] ${className}`}
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-6, -14, -6],
        scale: [0.92, 1, 0.96],
      }}
      transition={{
        repeat: Infinity,
        duration: 6,
        delay,
        ease: "easeInOut",
      }}
    >
      <Sparkles className="h-6 w-6 text-amber-500 drop-shadow-[0_0_16px_rgba(255,200,0,0.45)]" />
    </motion.span>
  );
}
