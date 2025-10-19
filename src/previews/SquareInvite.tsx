// src/previews/SquareInvite.tsx
import * as React from "react";

type Props = {
  title: string;
  names: string;
  date: string;
  venue?: string;
  /** e.g. "from-amber-400 via-orange-400 to-rose-500" */
  accent?: string;
  /** Marks this as a wish template preview */
  isWish?: boolean;
  /** Optional tiny label at the top (falls back to isWish) */
  badgeLabel?: string;
  /** Optional small emoji for extra festivity (🪔 🎉 🕌 🎊 💐 etc.) */
  emoji?: string;
};

export default function SquareInvite({
  title,
  names,
  date,
  venue,
  accent = "from-amber-400 via-orange-400 to-rose-500",
  isWish = false,
  badgeLabel,
  emoji,
}: Props) {
  const headingId = React.useId();

  return (
    <figure
      aria-labelledby={headingId}
      className={`relative w-full rounded-[24px] p-[2px] bg-gradient-to-br ${accent} shadow-[0_8px_30px_rgba(0,0,0,0.12)]`}
      style={{ aspectRatio: 1 }}
    >
      {/* Card body */}
      <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-white/85 ring-1 ring-black/5 backdrop-blur-sm">
        {/* 1) Ambient washes */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${accent} opacity-[0.16]`} />
        <div className="pointer-events-none absolute -top-14 left-1/2 h-[25rem] w-[25rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,210,120,0.30),transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-[19rem] w-[19rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,77,141,0.22),transparent_60%)] blur-3xl" />

        {/* 2) Top garland (subtle, festive) */}
        <svg
          viewBox="0 0 1200 220"
          className="pointer-events-none absolute -top-4 left-0 w-[140%] -translate-x-[12%] opacity-[0.18] mix-blend-multiply"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="g-garland" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <path
            d="M0,100 C200,40 400,220 600,120 C800,20 1000,200 1200,120"
            fill="none"
            stroke="url(#g-garland)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* little tassels */}
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 60 + i * 120;
            const y = i % 2 === 0 ? 140 : 110;
            return (
              <circle key={i} cx={x} cy={y} r="6" fill="url(#g-garland)" />
            );
          })}
        </svg>

        {/* 3) Festive texture + starlets */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]" aria-hidden="true">
          <defs>
            <pattern id="sq-dots-premium" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.15" fill="currentColor" />
            </pattern>
            <filter id="sq-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.35" />
            </filter>
            <radialGradient id="sq-star-premium" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
              gradientTransform="translate(10 10) rotate(90) scale(8 8)">
              <stop stopColor="#FFD166" />
              <stop offset="1" stopColor="#FF4D8D" stopOpacity="0.75" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#sq-dots-premium)" className="text-ink-500/10" />
          <g filter="url(#sq-soft)">
            <path d="M20 18l1.4 3.2l3.2 1.4l-3.2 1.4L20 27.2l-1.4-3.2l-3.2-1.4l3.2-1.4L20 18Z" fill="url(#sq-star-premium)" />
            <path d="M85 64l1 2.4l2.4 1l-2.4 1L85 70.8l-1-2.4l-2.4-1l2.4-1L85 64Z" fill="url(#sq-star-premium)" />
            <path d="M220 120l1.2 2.8l2.8 1.2l-2.8 1.2L220 128.8l-1.2-2.8l-2.8-1.2l2.8-1.2L220 120Z" fill="url(#sq-star-premium)" />
          </g>
        </svg>

        {/* 4) Sheen + vignette for depth */}
        <div
          className="pointer-events-none absolute -left-1/3 top-1/4 h-2/3 w-1/2 -rotate-12 opacity-20 animate-sheen"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-black/5" />
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_90%_at_50%_30%,black,transparent_65%)]" />

        {/* 5) Optional wish ribbon */}
        {isWish && (
          <div
            className="pointer-events-none absolute -right-10 top-8 w-[200px] rotate-45 text-center shadow-sm"
            aria-hidden="true"
          >
            <div className="rounded-md bg-gradient-to-r from-emerald-500 to-indigo-500 px-6 py-1.5 text-[11px] font-semibold tracking-wide text-white ring-1 ring-white/30">
              Wish Template
            </div>
          </div>
        )}

        {/* 6) Floating sparkles (CSS only, low-cost) */}
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="pointer-events-none absolute z-[1] animate-float"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              filter: "drop-shadow(0 0 12px rgba(255,200,90,0.45))",
            }}
            aria-hidden="true"
          >
            {/* sparkle svg */}
            <svg width="18" height="18" viewBox="0 0 24 24" className="text-amber-500">
              <path
                fill="currentColor"
                d="m12 2l1.8 4.4L18 8.2l-4.2 1.8L12 14l-1.8-4L6 8.2l4.2-1.8z"
                opacity="0.9"
              />
            </svg>
          </span>
        ))}

        {/* 7) Content */}
        <figcaption className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {/* Tiny badge */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/75 px-3 py-1 text-[11px] font-medium text-ink-700 shadow-sm backdrop-blur">
            <span className="inline-flex items-center gap-1">
              {emoji ? <span className="text-base">{emoji}</span> : <span className="text-base">🪔</span>}
              {badgeLabel ?? (isWish ? "Wish Preview" : "Festival Invite")}
            </span>
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Ready for WhatsApp
          </div>

          {/* Title */}
          <h2
            id={headingId}
            className="font-display max-w-[88%] text-[clamp(22px,6.2vw,42px)] leading-tight tracking-tight text-ink-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
          >
            {title}
          </h2>

          {/* Names pill with hairline gradient */}
          <div className={`mt-3 inline-flex rounded-full bg-gradient-to-r ${accent} p-[1px]`}>
            <div className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-ink-800 backdrop-blur">
              <span className="whitespace-pre-line">{names}</span>
            </div>
          </div>

          {/* Date / Venue (invites only) */}
          {!isWish && (
            <>
              <div className="mt-4 h-px w-36 overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-300/70 to-transparent" />
              <div className="mt-3 space-y-1 text-[0.95rem] text-ink-800">
                <p className="inline-flex items-center justify-center gap-2">
                  <CalendarIcon className="opacity-75" />
                  {date}
                </p>
                {venue ? (
                  <p className="inline-flex items-center justify-center gap-2 text-ink-700">
                    <PinIcon className="opacity-75" />
                    {venue}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </figcaption>
      </div>

      {/* Local CSS for micro-animations (no JS runtime needed) */}
      <style jsx>{`
        @keyframes sheen {
          0% { transform: translateX(-40%) rotate(-12deg); opacity: .08; }
          50% { transform: translateX(40%) rotate(-12deg); opacity: .20; }
          100% { transform: translateX(120%) rotate(-12deg); opacity: .08; }
        }
        .animate-sheen {
          animation: sheen 5s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0) scale(0.95); opacity: 0.0; }
          25% { transform: translateY(-8px) scale(1.0); opacity: 1; }
          50% { transform: translateY(-2px) scale(0.98); opacity: 0.9; }
          75% { transform: translateY(-10px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(0.95); opacity: 0.0; }
        }
        .animate-float {
          animation: float 6.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-sheen, .animate-float { animation: none !important; }
        }
      `}</style>
    </figure>
  );
}

/* ---------------- Icons (inline for no runtime deps) ---------------- */

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M7 2v2H5a2 2 0 0 0-2 2v1h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm14 7H3v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9ZM5 13h6v6H5v-6Z"
      />
    </svg>
  );
}

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5Z"
      />
    </svg>
  );
}

/* ---------------- Sparkle positions (deterministic) ---------------- */

const SPARKLES = [
  { left: "10%", top: "16%", delay: "0s" },
  { left: "20%", top: "36%", delay: "0.4s" },
  { left: "34%", top: "24%", delay: "0.7s" },
  { left: "62%", top: "20%", delay: "0.2s" },
  { left: "76%", top: "46%", delay: "0.8s" },
  { left: "18%", top: "70%", delay: "0.3s" },
  { left: "52%", top: "76%", delay: "0.6s" },
  { left: "84%", top: "66%", delay: "0.1s" },
];
