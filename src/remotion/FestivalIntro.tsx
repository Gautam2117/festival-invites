// src/previews/FestivalIntro.tsx
"use client";

import * as React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Audio,
  random,
} from "remotion";

/* =============================================================================
   Types & Props (backwards compatible; only optional additions)
============================================================================= */

type BrandInput = {
  name?: string;
  logoUrl?: string;
  tagline?: string;
  primary?: string;
  secondary?: string;
  ribbon?: boolean;
  endCard?: boolean;
};

type Props = {
  title: string;
  names?: string;
  date?: string;
  venue?: string;
  /** background image path under /public or data: URL */
  bg?: string;
  /** music path under /public or data: URL */
  music?: string | null;
  musicVolume?: number; // 0..1
  /** free tier draws watermark + shorter anim, hd adds extra effects */
  tier?: "free" | "hd";
  /** keep for API compatibility — we show a watermark iff true OR tier==='free' */
  watermark?: boolean;

  /** Anti-crop watermark controls */
  watermarkStrategy?: "ribbon" | "tile" | "ribbon+tile";
  wmSeed?: number;
  wmText?: string;
  wmOpacity?: number;

  /** Wish-only templates hide names/date/venue */
  isWish?: boolean;

  /** Brand kit (ribbon + end-card) */
  brand?: BrandInput;

  /** Optional accent trio; affects aurora/garland/rangoli hues */
  accent?: {
    a?: string; // warm
    b?: string; // pink
    c?: string; // violet
  };
};

/* =============================================================================
   Utilities
============================================================================= */



// const resolveAsset = (src?: string | null) => {
//   if (!src) return null;
//   if (src.startsWith("data:")) return src;
//   const p = src.startsWith("/") ? src : `/${src}`;
//   return staticFile(p);
// };


const resolveAsset = (p?: string | null) => {
  if (!p) return undefined;
  // allow data:, blob:, absolute http(s), and already-rooted paths (/...)
  if (/^(data:|blob:|https?:\/\/|\/)/.test(p)) return p;
  // normalize relative like "assets/..." → "/assets/..."
  const clean = p.replace(/^\/+/, "").replace(/^public\//, "");
  return staticFile(clean);
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scales title font a bit for very long titles while keeping a luxury feel */
function titleSizeFor(length: number, base = 46) {
  if (length <= 22) return base;            // short & punchy
  if (length <= 34) return base - 4;        // medium
  if (length <= 50) return base - 8;        // long
  return Math.max(28, base - 12);           // ultra-long safeguard
}

/** Gentle bezier-like ease without importing a lib */
const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/* =============================================================================
   Atmosphere: sparkles, bokeh, garland, rangoli, grain
============================================================================= */

const SparklesTwinkle: React.FC<{ count: number; seed: string }> = ({ count, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const x = r(0) * width;
        const y = r(1) * height;
        const tw = Math.sin((frame / fps) * (0.8 + r(2) * 1.2) + r(3) * 6.28);
        const s = 1.2 + r(4) * 2.2;
        const opacity = 0.18 + 0.42 * (0.5 + 0.5 * tw);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s * 10,
              height: s * 10,
              background:
                "radial-gradient(circle, rgba(255,230,160,0.95), rgba(255,230,160,0.0) 60%)",
              filter: "blur(0.6px)",
              opacity,
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
        const speed = 10 + r(3) * 22; // px/s
        const drift = Math.sin((frame / fps) * 1.1 + r(4) * 6.28) * 60;
        const y = (baseY - (frame / fps) * speed) % (height + 160);
        const x = startX + drift;
        const o = 0.10 + r(5) * 0.15;

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

/** Subtle swinging garland along top edge */
const Garland: React.FC<{ t: number; colors: [string, string, string] }> = ({ t, colors }) => {
  const sway = Math.sin(t * 2.4) * 5; // degrees
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
          <linearGradient id="g-garland-premium" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
        </defs>
        <path
          d="M0,100 C200,40 400,220 600,120 C800,20 1000,200 1200,120"
          fill="none"
          stroke="url(#g-garland-premium)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.8"
        />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 60 + i * 120;
          const y = i % 2 === 0 ? 140 : 110;
          return <circle key={i} cx={x} cy={y} r="6" fill="url(#g-garland-premium)" />;
        })}
      </svg>
    </div>
  );
};

/** Little rangoli pulse at bottom center */
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

/** Film grain (ultra-subtle) */
const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  return (
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
};

/* =============================================================================
   Watermarks & Confetti
============================================================================= */

const WatermarkTile: React.FC<{
  text: string;
  opacity?: number;
  seed?: number;
}> = ({ text, opacity = 0.18, seed = 0 }) => {
  const { width, height } = useVideoConfig();
  const r = (k: number) => random(`wm-${seed}-${k}`);
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

const ConfettiBurst: React.FC<{ at: number; seed: string }> = ({ at, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = clamp01((frame - at) / (fps * 0.9));
  if (t <= 0 || t > 1) return null;

  const count = 42;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const angle = r(0) * Math.PI * 2;
        const speed = 420 + r(1) * 640;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const x = width / 2 + vx * t * 0.6;
        const y = height / 2 + vy * t * 0.45 + 120 * t * t;
        const rot = r(2) * 360 * t;
        const s = 6 + r(3) * 10;
        const bg = `hsl(${Math.floor(r(4) * 360)}, 80%, ${55 + r(5) * 20}%)`;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s + 6,
              height: s,
              background: bg,
              transform: `rotate(${rot}deg)`,
              borderRadius: 2,
              boxShadow: "0 0 6px rgba(0,0,0,0.25)",
              mixBlendMode: "plus-lighter",
              opacity: 1 - t,
            }}
          />
        );
      })}
    </>
  );
};

/* =============================================================================
   Main Composition
============================================================================= */

export const FestivalIntro: React.FC<Props> = (p) => {
  const {
    title,
    names,
    date,
    venue,
    bg,
    music,
    musicVolume = 0.85,
    tier = "free",
    watermark = false,

    watermarkStrategy = "ribbon",
    wmSeed = 0,
    wmText = "Festival Invites — FREE PREVIEW",
    wmOpacity = 0.18,

    isWish = false,
    brand,
    accent,
  } = p;

  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Theme hues
  const colA = accent?.a ?? "#FFB74D"; // warm amber
  const colB = accent?.b ?? "#F06292"; // pink
  const colC = accent?.c ?? "#7C4DFF"; // violet

  // Base entrances
  const intro = spring({ frame, fps, config: { damping: 200, mass: 0.8 } });

  // Animated conic gradient underlay (slow rotation)
  const angle = interpolate(frame, [0, durationInFrames], [0, 360], { easing: Easing.linear });

  // Ken Burns on bg image (tasteful)
  const kbScale = interpolate(frame, [0, durationInFrames], [1.08, 1.18]);
  const kbX = interpolate(frame, [0, durationInFrames], [-0.02 * width, 0.02 * width]);
  const kbY = interpolate(frame, [0, durationInFrames], [0.01 * height, -0.015 * height]);
  const kbRot = interpolate(frame, [0, durationInFrames], [-0.6, 0.6]); // degrees

  const time = frame / fps;
  const bgSrc = resolveAsset(bg);
  const musicSrc = resolveAsset(music);

  // Free vs HD differences
  const isFree = tier === "free";
  const mustWatermark = isFree || watermark;
  const showRibbon =
    mustWatermark && (watermarkStrategy === "ribbon" || watermarkStrategy === "ribbon+tile");
  const showTile =
    mustWatermark && (watermarkStrategy === "tile" || watermarkStrategy === "ribbon+tile");

  // End-card timing
  const appear = interpolate(
    frame,
    [durationInFrames - fps, durationInFrames - fps / 3],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Title shimmer sweep
  const shimmer = easeInOut(clamp01((Math.sin(time * 1.6) + 1) / 2));
  const titleSize = titleSizeFor((title || "").length, height < 1000 ? 42 : 46);

  return (
    <AbsoluteFill style={{ backgroundColor: "#060606", overflow: "hidden" }}>
      {/* Aurora underlay */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `conic-gradient(from ${angle}deg, ${colA}, ${colB}, ${colC}, ${colA})`,
          filter: "blur(60px) saturate(1.12)",
          opacity: 0.52,
        }}
      />

      {/* Background image with parallax/tilt */}
      {bgSrc && (
        <Img
          src={bgSrc}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${kbX}px, ${kbY}px) rotate(${kbRot}deg) scale(${kbScale})`,
            filter: "saturate(1.05) contrast(1.02)",
          }}
        />
      )}

      {/* Atmosphere layers */}
      <Bokeh count={24} seed="bokeh" />
      <SparklesTwinkle count={18} seed="twinkle" />
      <Garland t={time} colors={[colA, colB, colC]} />
      <Rangoli t={time} colors={[colA, colB, colC]} />

      {/* Veil for legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(0,0,0,0.28) 65%, rgba(0,0,0,0.58))",
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
              // shimmer mask sweep
              maskImage:
                "linear-gradient(120deg, rgba(0,0,0,0.10) 40%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.10) 60%)",
              WebkitMaskImage:
                "linear-gradient(120deg, rgba(0,0,0,0.10) 40%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.10) 60%)",
              maskPosition: `${lerp(-60, 60, shimmer)}% 0%`,
              maskSize: "200% 100%",
              WebkitMaskPosition: `${lerp(-60, 60, shimmer)}% 0%`,
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

      {/* Extra festivities for HD */}
      {tier === "hd" && (
        <>
          <ConfettiBurst at={Math.round(fps * 1.2)} seed="c1" />
          <ConfettiBurst at={Math.round(durationInFrames - fps * 1.6)} seed="c2" />
        </>
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

      {/* End-card (brandable) */}
      {brand?.endCard && (
        <AbsoluteFill
          style={{
            opacity: appear,
            background: "rgba(0,0,0,.72)",
            color: "white",
            display: "grid",
            placeItems: "center",
            padding: 40,
          }}
        >
          <div style={{ textAlign: "center" }}>
            {brand?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logoUrl}
                alt="logo"
                width={96}
                height={96}
                style={{ display: "inline-block", borderRadius: 16, marginBottom: 16 }}
              />
            )}
            <div style={{ fontSize: 40, fontWeight: 800 }}>
              {brand?.name || "With love"}
            </div>
            {brand?.tagline && (
              <div style={{ marginTop: 8, fontSize: 22, opacity: 0.9 }}>
                {brand.tagline}
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* Grain (top-most, faint) */}
      <Grain opacity={0.05} />

      {/* Music with soft fades */}
      {musicSrc && (
        <Audio
          src={musicSrc}
          volume={(f) => {
            const fadeIn = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
            const fadeOut = interpolate(
              f,
              [durationInFrames - 24, durationInFrames],
              [1, 0],
              { extrapolateLeft: "clamp" }
            );
            return clamp01(musicVolume) * fadeIn * fadeOut;
          }}
        />
      )}
    </AbsoluteFill>
  );
};
