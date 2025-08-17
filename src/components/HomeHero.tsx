"use client";

import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Aurora / glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400/30 via-fuchsia-500/25 to-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-rose-400/20 via-orange-300/20 to-yellow-300/20 blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tl from-indigo-400/20 via-violet-400/20 to-fuchsia-400/20 blur-2xl" />
      </div>

      {/* Subtle starry grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 20px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating sparkles (festive vibe) */}
      <Floater className="left-[12%] top-[18%]" delay={0} />
      <Floater className="left-[82%] top-[26%]" delay={0.2} />
      <Floater className="left-[14%] top-[64%]" delay={0.4} />
      <Floater className="left-[76%] top-[72%]" delay={0.6} />

      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-16 text-center">
        {/* Glass badge */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/30 px-3 py-1 text-sm backdrop-blur-md shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-gray-800">
            WhatsApp-first invites & wishes
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-display mt-6 text-4xl leading-tight sm:text-5xl md:text-6xl"
        >
          Create{" "}
          <span className="bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">
            stunning festival invites
          </span>{" "}
          &{" "}
          <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">
            daily wishes
          </span>{" "}
          in seconds
        </motion.h1>

        {/* Subcopy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto mt-4 max-w-2xl text-base text-gray-700 md:text-lg"
        >
          Pick an occasion, add your details, and share a beautiful{" "}
          <span className="font-semibold text-gray-900">video</span> or{" "}
          <span className="font-semibold text-gray-900">image</span> on WhatsApp.
          Hindi, English & Hinglish templates — lovingly crafted. 🪔
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <Link
            href="/builder"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-600 px-6 py-3 text-white shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
          >
            <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="font-medium">Start Building</span>
          </Link>

          <Link
            href="#templates"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-300/70 bg-white/70 px-5 py-3 text-gray-900 backdrop-blur-md transition-colors hover:bg-white"
          >
            Browse Templates
          </Link>
        </motion.div>

        {/* Mini festive strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mx-auto mt-10 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/40 px-4 py-2 text-sm font-medium text-gray-800 backdrop-blur-md shadow"
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
      </div>
    </section>
  );
}

/** Tiny separator dot */
function Dot() {
  return <span className="h-1 w-1 rounded-full bg-gray-500/60" />;
}

/** Animated sparkle floater */
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
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: [0, 1, 1, 0], y: [-6, -14, -6], scale: [0.9, 1, 0.95] }}
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
