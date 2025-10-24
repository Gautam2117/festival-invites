"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * DecorativeBG — fast + premium ambient background
 * - Mobile-first: ultra-light static layers on small screens
 * - Desktop: adds animated aurora ribbons, bokeh, twinkles (GPU-friendly)
 * - Fully fixed & clipped; never increases page height
 */

type Props = {
  intensity?: "subtle" | "balanced" | "vivid";
  theme?:
    | "multi"
    | "diwali"
    | "eid"
    | "christmas"
    | "spring"
    | "royal";
  interactiveSpotlight?: boolean;
  className?: string;
};

export default function DecorativeBG({
  intensity = "balanced",
  theme = "diwali",
  interactiveSpotlight = true,
  className = "",
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  // Theme tokens
  const tokens = useMemo(() => {
    switch (theme) {
      case "eid":
        return { a: "rgba(16,185,129,0.20)", b: "rgba(250,204,21,0.18)", c: "rgba(59,130,246,0.16)", spark: "rgba(255,230,120,0.95)" };
      case "christmas":
        return { a: "rgba(34,197,94,0.20)", b: "rgba(239,68,68,0.18)", c: "rgba(250,204,21,0.16)", spark: "rgba(255,225,130,0.95)" };
      case "spring":
        return { a: "rgba(45,212,191,0.20)", b: "rgba(34,197,94,0.18)", c: "rgba(244,114,182,0.14)", spark: "rgba(255,235,160,0.95)" };
      case "royal":
        return { a: "rgba(124,58,237,0.20)", b: "rgba(99,102,241,0.18)", c: "rgba(236,72,153,0.16)", spark: "rgba(250,230,150,0.95)" };
      case "multi":
        return { a: "rgba(251,191,36,0.20)", b: "rgba(244,63,94,0.18)", c: "rgba(59,130,246,0.18)", spark: "rgba(255,235,150,0.95)" };
      case "diwali":
      default:
        return { a: "rgba(255,193,7,0.22)", b: "rgba(236,72,153,0.18)", c: "rgba(99,102,241,0.18)", spark: "rgba(255,220,120,0.95)" };
    }
  }, [theme]);

  const mul = intensity === "vivid" ? 1 : intensity === "subtle" ? 0.6 : 0.85;

  // Spotlight tracking (window-level; never catches pointer)
  useEffect(() => {
    if (!interactiveSpotlight || prefersReducedMotion) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let px = 50;
    let py = 35;

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 100;
      const ny = (e.clientY / window.innerHeight) * 100;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty("--mx", `${nx}%`);
        root.style.setProperty("--my", `${ny}%`);
        px = nx;
        py = ny;
      });
    };

    root.style.setProperty("--mx", `${px}%`);
    root.style.setProperty("--my", `${py}%`);

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [interactiveSpotlight, prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
      style={
        {
          ["--mx" as any]: "50%",
          ["--my" as any]: "35%",
        } as React.CSSProperties
      }
    >
      {/* ============ MOBILE: ultra-light static layers ============ */}
      <div className="absolute inset-0 md:hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #fbe7ef 0%, #f4eefc 45%, #eef6ff 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='4' cy='4' r='1.2' fill='black' opacity='0.6'/></svg>\")",
            backgroundRepeat: "repeat",
            imageRendering: "crisp-edges",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, rgba(255,255,255,0.65), rgba(0,0,0,0.10))",
            mixBlendMode: "soft-light",
          }}
        />
      </div>

      {/* ============ DESKTOP: premium effects (gated for perf) ============ */}
      <div className="absolute inset-0 hidden md:block">
        {/* Base color washes */}
        <div
          className="absolute -top-24 left-1/2 h-[48rem] w-[48rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse at center, ${tokens.a}, transparent 60%)`,
            opacity: 0.95 * mul,
          }}
        />
        <div
          className="absolute top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse at center, ${tokens.b}, transparent 62%)`,
            opacity: 0.9 * mul,
          }}
        />
        <div
          className="absolute bottom-[-12%] left-[-10%] h-[32rem] w-[32rem] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse at center, ${tokens.c}, transparent 62%)`,
            opacity: 0.9 * mul,
          }}
        />

        {/* Aurora ribbons */}
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute -top-32 left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full blur-[80px] opacity-50"
              style={{
                background: `conic-gradient(from 90deg, ${tokens.a.replace(
                  /0\.\d+/,
                  "0.18"
                )}, ${tokens.b.replace(/0\.\d+/, "0.14")}, ${tokens.c.replace(
                  /0\.\d+/,
                  "0.16"
                )}, ${tokens.a.replace(/0\.\d+/, "0.18")})`,
                opacity: 0.55 * mul,
              }}
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -bottom-24 left-1/2 h-[54rem] w-[54rem] -translate-x-1/2 rounded-full blur-[70px] opacity-[0.45]"
              style={{
                background: `conic-gradient(from 180deg, ${tokens.b.replace(
                  /0\.\d+/,
                  "0.16"
                )}, ${tokens.c.replace(/0\.\d+/, "0.16")}, ${tokens.a.replace(
                  /0\.\d+/,
                  "0.16"
                )}, ${tokens.b.replace(/0\.\d+/, "0.16")})`,
                opacity: 0.48 * mul,
              }}
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}

        {/* Cursor spotlight */}
        <div
          className="absolute inset-0"
          style={{
            background: prefersReducedMotion
              ? "radial-gradient(360px 240px at 50% 35%, rgba(255,255,255,0.20), transparent 60%)"
              : "radial-gradient(380px 260px at var(--mx) var(--my), rgba(255,255,255,0.22), transparent 60%)",
            maskImage:
              "radial-gradient(560px 380px at 50% 28%, black, transparent 70%)",
            opacity: 0.9 * mul,
          }}
        />

        {/* Bokeh orbs */}
        {!prefersReducedMotion &&
          BOKEH.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full blur-2xl"
              style={{
                left: p.left,
                top: p.top,
                height: p.size,
                width: p.size,
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%)",
                opacity: 0.9 * mul,
              }}
              initial={{ y: 0, opacity: 0.35 }}
              animate={{ y: [-8, 8, -8], opacity: [0.35, 0.55, 0.35] }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
            />
          ))}

        {/* Twinkles */}
        {!prefersReducedMotion &&
          TWINKLES.map((t, i) => (
            <motion.span
              key={i}
              className="absolute"
              style={{ left: t.left, top: t.top }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: t.dur, repeat: Infinity, delay: t.delay }}
            >
              <span
                className="block h-[6px] w-[6px] rounded-full"
                style={{
                  background: `radial-gradient(circle at center, ${tokens.spark}, rgba(255,220,120,0.15) 60%, transparent 70%)`,
                  boxShadow: "0 0 18px rgba(255,200,90,0.55)",
                  opacity: 0.9 * mul,
                }}
              />
            </motion.span>
          ))}

        {/* Star grid + grain + vignette */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20px 20px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "40px 40px",
            mixBlendMode: "soft-light",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 40 40'><circle cx='1' cy='1' r='1' fill='black' opacity='0.8'/></svg>\")",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,_transparent_35%,_rgba(0,0,0,0.05)_60%,_rgba(0,0,0,0.10)_100%)]" />
      </div>

      {/* Reduced motion guard */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-reduce-motion] { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}

/* Deterministic positions & timings (desktop only) */
const BOKEH = [
  { left: "8%", top: "22%", size: "120px", dur: 10, delay: 0.2 },
  { left: "78%", top: "18%", size: "100px", dur: 12, delay: 0.6 },
  { left: "14%", top: "72%", size: "140px", dur: 14, delay: 0.4 },
  { left: "82%", top: "70%", size: "110px", dur: 11, delay: 0.1 },
];

const TWINKLES = [
  { left: "12%", top: "16%", dur: 2.6, delay: 0.0 },
  { left: "22%", top: "38%", dur: 3.2, delay: 0.4 },
  { left: "34%", top: "24%", dur: 2.8, delay: 0.7 },
  { left: "48%", top: "12%", dur: 3.0, delay: 0.2 },
  { left: "62%", top: "28%", dur: 3.4, delay: 0.5 },
  { left: "74%", top: "44%", dur: 2.9, delay: 0.8 },
  { left: "18%", top: "66%", dur: 3.1, delay: 0.3 },
  { left: "52%", top: "72%", dur: 2.7, delay: 0.6 },
  { left: "86%", top: "62%", dur: 3.3, delay: 0.1 },
];
