"use client";

import { motion } from "framer-motion";

export default function DecorativeBG() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* ===== Static color washes (base ambience) ===== */}
      <div className="absolute -top-24 left-1/2 h-[48rem] w-[48rem] -translate-x-1/2 rounded-full blur-3xl
                      bg-[radial-gradient(ellipse_at_center,_rgba(255,186,73,0.22),_transparent_60%)]" />
      <div className="absolute top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full blur-3xl
                      bg-[radial-gradient(ellipse_at_center,_rgba(236,72,153,0.18),_transparent_62%)]" />
      <div className="absolute bottom-[-12%] left-[-10%] h-[32rem] w-[32rem] rounded-full blur-3xl
                      bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.18),_transparent_62%)]" />

      {/* ===== Aurora ribbons (soft conic gradients) ===== */}
      <motion.div
        className="absolute -top-32 left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full blur-[80px] opacity-50
                   bg-[conic-gradient(from_90deg,_rgba(255,200,80,0.18),rgba(250,82,160,0.14),rgba(99,102,241,0.16),rgba(255,200,80,0.18))]"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -bottom-24 left-1/2 h-[54rem] w-[54rem] -translate-x-1/2 rounded-full blur-[70px] opacity-[0.45]
                   bg-[conic-gradient(from_180deg,_rgba(253,164,175,0.16),rgba(147,197,253,0.16),rgba(250,204,21,0.16),rgba(253,164,175,0.16))]"
        initial={{ rotate: 0 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />

      {/* ===== Bokeh glow orbs (gentle float) ===== */}
      {BOkEH.map((p, i) => (
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
          }}
          initial={{ y: 0, opacity: 0.35 }}
          animate={{ y: [-6, 6, -6], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}

      {/* ===== Twinkling sparkles ===== */}
      {TWINKLES.map((t, i) => (
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
              background:
                "radial-gradient(circle at center, rgba(255,220,120,0.95), rgba(255,220,120,0.15) 60%, transparent 70%)",
              boxShadow: "0 0 18px rgba(255,200,90,0.55)",
            }}
          />
        </motion.span>
      ))}

      {/* ===== Subtle festive dot grid ===== */}
      <svg className="absolute inset-0 h-full w-full opacity-20" role="img">
        <defs>
          <pattern id="festive-dots" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#festive-dots)" className="text-black/10" />
      </svg>

      {/* ===== Soft vignette for readability ===== */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,_transparent_35%,_rgba(0,0,0,0.05)_60%,_rgba(0,0,0,0.10)_100%)]" />

      {/* Respect reduced motion */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-reduce-motion] { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}

/* -------- positions & timings (deterministic, no hydration jitter) -------- */
const BOkEH = [
  { left: "8%",  top: "22%", size: "120px", dur: 10, delay: 0.2 },
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
