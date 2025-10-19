// src/previews/ImageCard.tsx
"use client";

import * as React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  random,
} from "remotion";

/* ============================================================================
   Types (backward-compatible) + optional accent theme
============================================================================ */

type BrandInput = {
  name?: string;
  logoUrl?: string;
  tagline?: string;
  primary?: string;
  secondary?: string;
  ribbon?: boolean;   // visible on stills
  endCard?: boolean;  // ignored on stills
};

type Props = {
  title: string;
  names?: string;
  date?: string;
  venue?: string;
  bg?: string;
  tier?: "free" | "hd";
  watermark?: boolean;

  /** Anti-crop watermark controls (optional) */
  watermarkStrategy?: "ribbon" | "tile" | "ribbon+tile";
  wmSeed?: number;
  wmText?: string;
  wmOpacity?: number;

  /** Wish-only templates hide names/date/venue */
  isWish?: boolean;

  /** Brand kit (ribbon only on stills) */
  brand?: BrandInput;

  /** Optional accent trio; affects aurora/garland/rangoli hues */
  accent?: {
    a?: string; // warm
    b?: string; // pink
    c?: string; // violet
  };
};

/* ============================================================================
   Utilities
============================================================================ */

const resolve = (src?: string | null) => {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  const p = src.startsWith("/") ? src : `/${src}`;
  return staticFile(p);
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Adaptive title size to keep long headings classy */
const titleSizeFor = (len: number, base = 46) => {
  if (len <= 22) return base;
  if (len <= 34) return base - 4;
  if (len <= 50) return base - 8;
  return Math.max(28, base - 12);
};

const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/* ============================================================================
   Atmosphere layers (sparkles, bokeh, garland, rangoli, grain)
============================================================================ */

const Sparkles: React.FC<{ count: number; seed: string }> = ({ count, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const x = r(0) * width;
        const y = r(1) * height;
        const phase = r(2) * Math.PI * 2;
        const tw = Math.sin((frame / fps) * (0.8 + r(3) * 1.4) + phase);
        const base = 0.35 + r(4) * 0.55;
        const o = clamp01(base * (0.45 + 0.55 * (0.5 + 0.5 * tw)));
        const s = 8 + r(5) * 14;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: s,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 60%)",
              filter: "blur(0.6px)",
              opacity: o * 0.65,
              mixBlendMode: "plus-lighter",
            }}
          />
        );
      })}
    </>
  );
};

const Bokeh: React.FC<{ count: number; seed: string }> = ({ count, seed }) => {
  const frame = useCurrentFrame();
  const { height, width, fps } = useVideoConfig();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const r = (t: number) => random(`${seed}-${i}-${t}`);
        const size = 40 + r(0) * 70;
        const startX = r(1) * (width + 200) - 100;
        const baseY = r(2) * height;
        const speed = 12 + r(3) * 22; // px/sec
        const drift = Math.sin((frame / fps) * 1.2 + r(4) * 6.28) * 60;
        const y = (baseY - (frame / fps) * speed) % (height + 120);
        const x = startX + drift;
        const o = 0.12 + r(5) * 0.15;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0.0) 60%)",
              filter: "blur(0.5px)",
              opacity: o,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </>
  );
};

/** Top garland with gentle sway */
const Garland: React.FC<{ t: number; colors: [string, string, string] }> = ({ t, colors }) => {
  const sway = Math.sin(t * 2.4) * 5;
  return (
    <div
      style={{
        position: "absolute",
        top: -8,
        left: "50%",
        width: "140%",
        transform: `translateX(-50%) rotate(${sway}deg)`,
        opacity: 0.26,
        mixBlendMode: "multiply",
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
          opacity="0.8"
        />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 60 + i * 120;
          const y = i % 2 === 0 ? 140 : 110;
          return <circle key={i} cx={x} cy={y} r="6" fill="url(#g-garland)" />;
        })}
      </svg>
    </div>
  );
};

/** Bottom rangoli shimmer */
const Rangoli: React.FC<{ t: number; colors: [string, string, string] }> = ({ t, colors }) => {
  const base = 1 + Math.sin(t * 2.2) * 0.04;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 50,
        transform: `translateX(-50%) scale(${base})`,
        opacity: 0.55,
        filter: "blur(0.2px)",
      }}
    >
      <svg width="220" height="220" viewBox="0 0 200 200" aria-hidden>
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
          const cx = 100 + Math.cos(angle) * 46;
          const cy = 100 + Math.sin(angle) * 46;
          return <circle key={i} cx={cx} cy={cy} r="18" fill={i % 2 ? "url(#rg1)" : "url(#rg2)"} />;
        })}
        <circle cx="100" cy="100" r="12" fill={colors[0]} />
      </svg>
    </div>
  );
};

/** Ultra-subtle film grain for premium depth */
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
   Anti-crop watermarks
============================================================================ */

const WatermarkTile: React.FC<{ text: string; opacity?: number; seed?: number }> = ({
  text,
  opacity = 0.18,
  seed = 0,
}) => {
  const { width, height } = useVideoConfig();
  const r = (k: number) => random(`wm-still-${seed}-${k}`);
  const stepX = 260;
  const stepY = 160;
  const xOffset = Math.floor(r(1) * stepX);
  const yOffset = Math.floor(r(2) * stepY * 0.5);

  const cols = Math.ceil((width + stepX * 2) / stepX);
  const rows = Math.ceil((height + stepY * 2) / stepY);

  const items: React.ReactNode[] = [];
  for (let ry = -1; ry < rows; ry++) {
    for (let cx = -1; cx < cols; cx++) {
      const x = cx * stepX + xOffset;
      const y = ry * stepY + yOffset + (ry % 2 === 0 ? stepY * 0.35 : 0);
      items.push(
        <div
          key={`${cx}-${ry}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: "rotate(-24deg)",
            fontWeight: 800,
            letterSpacing: 1,
            fontSize: 18,
            color: "rgba(255,255,255,0.95)",
            opacity,
            textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            mixBlendMode: "overlay",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {text}
        </div>
      );
    }
  }
  return <>{items}</>;
};

/* ============================================================================
   Main Still Composition
============================================================================ */

export const ImageCard: React.FC<Props> = (props) => {
  const {
    title,
    names,
    date,
    venue,
    bg,
    tier = "free",
    watermark,

    watermarkStrategy = "ribbon",
    wmSeed = 0,
    wmText = "Festival Invites — FREE PREVIEW",
    wmOpacity = 0.18,

    isWish = false,
    brand,
    accent,
  } = props;

  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 200, mass: 0.9 } });
  const t = frame / Math.max(1, fps);

  // Theme hues
  const colA = accent?.a ?? "#FFB74D"; // warm amber
  const colB = accent?.b ?? "#F06292"; // pink
  const colC = accent?.c ?? "#7C4DFF"; // violet

  // Watermark logic
  const mustWatermark = tier === "free" || !!watermark;
  const showRibbon =
    mustWatermark && (watermarkStrategy === "ribbon" || watermarkStrategy === "ribbon+tile");
  const showTile =
    mustWatermark && (watermarkStrategy === "tile" || watermarkStrategy === "ribbon+tile");

  const bgSrc = resolve(bg);

  // Conic aurora rotation
  const angle = interpolate(frame, [0, durationInFrames || 150], [0, 360], {
    easing: Easing.linear,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ken Burns for background
  const kbScale = interpolate(frame, [0, 120], [1.06, 1.1], { extrapolateRight: "extend" });

  // Title shimmer sweep
  const shimmer = easeInOut(clamp01((Math.sin(t * 1.6) + 1) / 2));
  const titleSize = titleSizeFor((title || "").length, height < 1000 ? 42 : 46);

  return (
    <AbsoluteFill style={{ backgroundColor: "#070707", overflow: "hidden" }}>
      {/* Aurora / ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: "-18%",
          background: `conic-gradient(from ${angle}deg, ${colA}, ${colB}, ${colC}, ${colA})`,
          filter: "blur(60px) saturate(1.1)",
          opacity: 0.55,
        }}
      />

      {/* Background image */}
      {bgSrc ? (
        <Img
          src={bgSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${kbScale})`,
            filter: "saturate(1.05) contrast(1.03)",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${colA} 0%, ${colB} 45%, ${colC} 100%)`,
          }}
        />
      )}

      {/* Festive atmosphere */}
      <Bokeh count={22} seed="bokeh-still" />
      <Sparkles count={16} seed="sparkles-still" />
      <Garland t={t} colors={[colA, colB, colC]} />
      <Rangoli t={t} colors={[colA, colB, colC]} />

      {/* Legibility veil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.55))",
        }}
      />

      {/* ===== Lux Title Block (glass chip with gradient stroke) ===== */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "14%",
          transform: `translateX(-50%) scale(${0.94 + intro * 0.06})`,
          padding: 2,
          borderRadius: 28,
          background: `linear-gradient(135deg, ${colA} 0%, ${colB} 45%, ${colC} 100%)`,
          boxShadow: "0 16px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            borderRadius: 26,
            padding: isWish ? "24px 26px 20px" : "24px 26px 22px",
            background: "rgba(0,0,0,0.32)",
            WebkitBackdropFilter: "blur(8px) saturate(1.25)",
            backdropFilter: "blur(8px) saturate(1.25)",
            border: "1px solid rgba(255,255,255,0.25)",
            textAlign: "center",
            color: "#fff",
            pointerEvents: "none",
            opacity: intro,
          }}
        >
          {/* Title with animated shimmer mask */}
          <div
            style={{
              display: "inline-block",
              position: "relative",
              padding: "0 2px",
              background:
                "linear-gradient(135deg, #ffffff 0%, #fff2cf 35%, #ffd6ff 70%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 2px 18px rgba(0,0,0,0.45)",
              fontWeight: 800,
              fontSize: titleSize,
              lineHeight: 1.1,
              letterSpacing: 0.25,
              maskImage:
                "linear-gradient(120deg, rgba(0,0,0,0.10) 40%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.10) 60%)",
              WebkitMaskImage:
                "linear-gradient(120deg, rgba(0,0,0,0.10) 40%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.10) 60%)",
              maskPosition: `${-60 + 120 * shimmer}% 0%`,
              WebkitMaskPosition: `${-60 + 120 * shimmer}% 0%`,
              maskSize: "200% 100%",
              WebkitMaskSize: "200% 100%",
            }}
          >
            {title}
          </div>

          {/* Names + details (skip for wish) */}
          {!isWish && (
            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                background:
                  "linear-gradient(to right,rgba(255,255,255,0.18),rgba(255,255,255,0.08))",
                border: "1px solid rgba(255,255,255,0.22)",
                fontWeight: 600,
                fontSize: 18,
                textShadow: "0 1px 6px rgba(0,0,0,0.35)",
              }}
            >
              <span>{names}</span>
              {(date || venue) && (
                <>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.7)",
                    }}
                  />
                  <span style={{ opacity: 0.92 }}>
                    {date}
                    {venue ? ` · ${venue}` : ""}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Brand ribbon (top-right) */}
      {brand?.ribbon && (brand?.logoUrl || brand?.name) && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: brand?.primary || "#111827",
            color: "white",
            padding: "10px 14px",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            border: `1px solid ${brand?.secondary || "rgba(255,255,255,0.25)"}`,
          }}
        >
          {brand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoUrl}
              alt="logo"
              width={28}
              height={28}
              style={{ borderRadius: 6, objectFit: "cover" }}
            />
          ) : null}
          <div style={{ fontWeight: 700 }}>{brand?.name}</div>
        </div>
      )}

      {/* Anti-crop watermarks */}
      {showTile && <WatermarkTile text={wmText} opacity={wmOpacity} seed={wmSeed} />}

      {showRibbon && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "10px 14px",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontWeight: 700,
            letterSpacing: 0.4,
            fontSize: 16,
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          <span style={{ opacity: 0.9 }}>Made with Festival Invites</span>
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            FREE PREVIEW
          </span>
        </div>
      )}

      {/* Grain on top for a premium finish */}
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
