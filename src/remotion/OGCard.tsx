// src/previews/OGCard.tsx
import * as React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

/* ============================================================================
   Types (matches your existing API)
============================================================================ */
type Props = {
  title: string;
  subtitle?: string;
  date?: string;
  venue?: string;
  /** background image URL (absolute, relative, or data:) */
  bg?: string | null;
  /** preset name ("classic" | "gold" | "emerald" | "rose") or any string */
  theme?: "classic" | "gold" | "emerald" | "rose" | string;
  ownerName?: string;
  ownerOrg?: string | null;
};

/* ============================================================================
   Theming & Utilities
============================================================================ */
const THEME_MAP: Record<
  string,
  { a: string; b: string; c: string; ribbonBg: string; ribbonText: string }
> = {
  classic: {
    a: "#6366F1", // indigo
    b: "#A855F7", // violet
    c: "#F472B6", // pink
    ribbonBg: "#111827",
    ribbonText: "#FFFFFF",
  },
  gold: {
    a: "#F59E0B", // amber
    b: "#F43F5E", // rose
    c: "#FB7185", // pinkish
    ribbonBg: "#0B0B0B",
    ribbonText: "#FFFFFF",
  },
  emerald: {
    a: "#10B981",
    b: "#34D399",
    c: "#22D3EE",
    ribbonBg: "#052e23",
    ribbonText: "#D1FAE5",
  },
  rose: {
    a: "#FB7185",
    b: "#F472B6",
    c: "#C084FC",
    ribbonBg: "#3b0c19",
    ribbonText: "#FFE4E6",
  },
};

const resolve = (src?: string | null) => {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  // Allow using /public assets with Remotion
  const p = src.startsWith("/") ? src : `/${src}`;
  return staticFile(p);
};

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const clamp01 = (n: number) => clamp(n, 0, 1);

/** Adaptive title size to keep long headings classy in 1200×630 */
const titleSizeFor = (title: string, width: number) => {
  const L = (title || "").length;
  const base = width >= 1400 ? 86 : width >= 1200 ? 78 : 70;
  if (L <= 30) return base;
  if (L <= 44) return base - 8;
  if (L <= 60) return base - 14;
  return Math.max(44, base - 22);
};

/* ============================================================================
   Micro elements: Sparkles, Garland, Rangoli, Grain
============================================================================ */
const Sparkles: React.FC<{ count?: number }> = ({ count = 28 }) => {
  const { width, height } = useVideoConfig();
  const dots = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        s: 6 + Math.random() * 12,
        o: 0.25 + Math.random() * 0.5,
      })),
    [count, width, height]
  );

  return (
    <>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: d.y,
            width: d.s,
            height: d.s,
            borderRadius: d.s,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 60%)",
            filter: "blur(0.6px)",
            opacity: d.o * 0.65,
            mixBlendMode: "plus-lighter",
          }}
        />
      ))}
    </>
  );
};

const Garland: React.FC<{ colors: [string, string, string] }> = ({ colors }) => (
  <div
    style={{
      position: "absolute",
      top: -6,
      left: "50%",
      width: "140%",
      transform: "translateX(-50%)",
      opacity: 0.25,
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  >
    <svg viewBox="0 0 1200 220" width="100%" aria-hidden>
      <defs>
        <linearGradient id="g-garland" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="50%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
      </defs>
      <path
        d="M0,100 C200,40 400,220 600,120 C800,20 1000,200 1200,120"
        fill="none"
        stroke="url(#g-garland)"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.85"
      />
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 60 + i * 120;
        const y = i % 2 === 0 ? 140 : 110;
        return <circle key={i} cx={x} cy={y} r="6" fill="url(#g-garland)" />;
      })}
    </svg>
  </div>
);

const Rangoli: React.FC<{ colors: [string, string, string] }> = ({ colors }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: 36,
      transform: "translateX(-50%)",
      opacity: 0.55,
      filter: "blur(0.2px)",
      pointerEvents: "none",
    }}
  >
    <svg width="210" height="210" viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id="rg1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
          <stop offset="100%" stopColor={colors[1]} stopOpacity="0.25" />
        </radialGradient>
        <radialGradient id="rg2">
          <stop offset="0%" stopColor={colors[1]} stopOpacity="1" />
          <stop offset="100%" stopColor={colors[2]} stopOpacity="0.25" />
        </radialGradient>
      </defs>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const cx = 100 + Math.cos(angle) * 42;
        const cy = 100 + Math.sin(angle) * 42;
        return <circle key={i} cx={cx} cy={cy} r="16" fill={i % 2 ? "url(#rg1)" : "url(#rg2)"} />;
      })}
      <circle cx="100" cy="100" r="10" fill={colors[0]} />
    </svg>
  </div>
);

const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 40 40'><circle cx='1' cy='1' r='1' fill='black' opacity='0.7'/></svg>\")",
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  />
);

/* ============================================================================
   Main OG Card
============================================================================ */
export const OGCard: React.FC<Props> = ({
  title,
  subtitle,
  date,
  venue,
  bg,
  theme = "classic",
  ownerName,
  ownerOrg,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Fade-in for hero text
  const fade = interpolate(frame, [0, fps / 2], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Theme colors (fall back to classic if unknown)
  const t =
    THEME_MAP[theme] ||
    THEME_MAP.classic;
  const colors: [string, string, string] = [t.a, t.b, t.c];

  const bgSrc = resolve(bg);
  const titleSize = titleSizeFor(title, width);

  return (
    <AbsoluteFill
      style={{
        background: bgSrc
          ? `#0A0A0A url(${bgSrc}) center/cover no-repeat`
          : `linear-gradient(135deg, ${t.a} 0%, ${t.b} 45%, ${t.c} 100%)`,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
        color: "#0f172a",
      }}
    >
      {/* Frosted glass veil for legibility */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.84))",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Conic aurora accent in the corner */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `conic-gradient(from 220deg, ${t.a}, ${t.b}, ${t.c}, ${t.a})`,
          opacity: 0.18,
          maskImage:
            "radial-gradient(120% 120% at 110% -10%, black 20%, transparent 62%)",
        }}
      />

      {/* Festive décor */}
      <Garland colors={colors} />
      <Rangoli colors={colors} />
      <Sparkles count={32} />
      <Grain opacity={0.05} />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: width >= 1400 ? 72 : 56,
          display: "grid",
          gridTemplateRows: "1fr auto",
        }}
      >
        {/* Center */}
        <div style={{ alignSelf: "center", maxWidth: 1040 }}>
          {subtitle ? (
            <div
              style={{
                fontSize: width >= 1400 ? 30 : 26,
                color: "#334155",
                marginBottom: 12,
                opacity: 0.92,
                fontWeight: 600,
                letterSpacing: 0.2,
              }}
            >
              {subtitle}
            </div>
          ) : null}

          <div
            style={{
              fontWeight: 900,
              fontSize: titleSize,
              lineHeight: 1.05,
              // color: "#0f172a", // Removed duplicate color property
              textShadow: "0 1px 0 #fff",
              opacity: fade,
              // Elegant gradient fill with text clip
              background:
                "linear-gradient(135deg,#0f172a 0%,#111827 40%,#1f2937 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {title}
          </div>

          {(date || venue) && (
            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 26,
                color: "#334155",
                flexWrap: "wrap",
              }}
            >
              {date && (
                <div style={{ fontSize: width >= 1400 ? 26 : 24 }}>
                  📅 {date}
                </div>
              )}
              {venue && (
                <div style={{ fontSize: width >= 1400 ? 26 : 24 }}>
                  📍 {venue}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer row */}
        {(ownerName || ownerOrg) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 18, color: "#475569" }}>
              Made by{" "}
              <strong style={{ color: "#0f172a" }}>
                {ownerName || "Guest"}
              </strong>
              {ownerOrg ? ` · ${ownerOrg}` : ""}
            </div>

            <div
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                background: t.ribbonBg,
                color: t.ribbonText,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 0.2,
                boxShadow: "0 10px 28px rgba(0,0,0,.18)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              festivalinvites.app
            </div>
          </div>
        )}
      </div>

      {/* Inset premium border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.7)",
          boxShadow: "0 30px 80px rgba(0,0,0,.18) inset",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
