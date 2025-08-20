// remotion/FestivalIntro.tsx
"use client";

import { JSX } from "react";
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

  /** Anti-crop watermark controls (optional, defaults are safe). */
  watermarkStrategy?: "ribbon" | "tile" | "ribbon+tile";
  wmSeed?: number;
  wmText?: string;
  wmOpacity?: number;

  /** Wish-only templates hide names/date/venue */
  isWish?: boolean;
};

const resolveAsset = (src?: string | null) => {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  const p = src.startsWith("/") ? src : `/${src}`;
  return staticFile(p);
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* --- Visual micro-systems ------------------------------------------------ */

const Sheen: React.FC<{ x: number; rotate?: number; opacity?: number }> = ({
  x,
  rotate = -16,
  opacity = 0.22,
}) => (
  <div
    style={{
      position: "absolute",
      top: "18%",
      left: x,
      width: 240,
      height: "64%",
      transform: `rotate(${rotate}deg)`,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)",
      filter: "blur(8px)",
      opacity,
      pointerEvents: "none",
      mixBlendMode: "overlay",
    }}
  />
);

const SparklesTwinkle: React.FC<{ count: number; seed: string }> = ({
  count,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const x = r(0) * width;
        const y = r(1) * height;
        const base = 0.3 + r(2) * 0.6;
        const tw = Math.sin((frame / fps) * (0.8 + r(3) * 1.4) + r(4) * 6.28);
        const s = 1.4 + r(5) * 2.2;
        const o = clamp01(base * (0.45 + 0.55 * (0.5 + 0.5 * tw)));

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s * 9,
              height: s * 9,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 60%)",
              filter: "blur(0.6px)",
              opacity: o * 0.6,
              mixBlendMode: "plus-lighter",
            }}
          />
        );
      })}
    </>
  );
};

/** floating bokeh lights (deterministic using remotion/random) */
const Bokeh: React.FC<{ count: number; seed: string }> = ({ count, seed }) => {
  const frame = useCurrentFrame();
  const { height, width, fps } = useVideoConfig();

  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const r = (t: number) => random(`${seed}-${i}-${t}`);
        const size = 40 + r(0) * 70;
        const startX = r(1) * (width + 200) - 100;
        const baseY = r(2) * height;
        const speed = 12 + r(3) * 22; // px/sec
        const drift = Math.sin((frame / fps) * 1.2 + r(4) * 6.28) * 60;

        // float upwards slowly
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

/** tiled anti-crop watermark overlay */
const WatermarkTile: React.FC<{
  text: string;
  opacity?: number;
  seed?: number;
}> = ({ text, opacity = 0.18, seed = 0 }) => {
  const { width, height } = useVideoConfig();

  // Staggered grid with deterministic offset
  const r = (k: number) => random(`wm-${seed}-${k}`);
  const stepX = 260;
  const stepY = 160;
  const xOffset = Math.floor(r(1) * stepX);
  const yOffset = Math.floor(r(2) * stepY * 0.5);

  const cols = Math.ceil((width + stepX * 2) / stepX);
  const rows = Math.ceil((height + stepY * 2) / stepY);

  const items: JSX.Element[] = [];
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

/** paid-only confetti burst */
const ConfettiBurst: React.FC<{ at: number; seed: string }> = ({ at, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = clamp01((frame - at) / (fps * 0.9)); // ~0.9s burst
  if (t <= 0 || t > 1) return null;

  const count = 42;
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const angle = r(0) * Math.PI * 2;
        const speed = 420 + r(1) * 640;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const x = width / 2 + vx * t * 0.6;
        const y = height / 2 + vy * t * 0.45 + 120 * t * t; // gravity
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

/* --- Main composition ---------------------------------------------------- */

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
  } = p;

  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // base entrances
  const intro = spring({ frame, fps, config: { damping: 200, mass: 0.8 } });
  const intro2 = spring({ frame: frame - 10, fps, config: { damping: 200, mass: 0.8 } });
  const intro3 = spring({ frame: frame - 18, fps, config: { damping: 200, mass: 0.8 } });

  // Animated gradient background (slow rotation)
  const angle = interpolate(frame, [0, durationInFrames], [0, 360], { easing: Easing.linear });

  // Ken Burns on bg image: scale + subtle pan + tilt
  const kbScale = interpolate(frame, [0, durationInFrames], [1.08, 1.18]);
  const kbX = interpolate(frame, [0, durationInFrames], [-0.02 * width, 0.02 * width]);
  const kbY = interpolate(frame, [0, durationInFrames], [0.01 * height, -0.015 * height]);
  const kbRot = interpolate(frame, [0, durationInFrames], [-0.6, 0.6]); // degrees

  // Title shimmer
  const shimmerX = interpolate(
    frame % Math.round(fps * 2.2),
    [0, fps * 1.1, fps * 2.2],
    [-320, width + 320, width + 320]
  );

  const bgSrc = resolveAsset(bg);
  const musicSrc = resolveAsset(music);

  // Free vs HD differences
  const isFree = tier === "free";
  const mustWatermark = isFree || watermark;
  const showRibbon =
    mustWatermark && (watermarkStrategy === "ribbon" || watermarkStrategy === "ribbon+tile");
  const showTile =
    mustWatermark && (watermarkStrategy === "tile" || watermarkStrategy === "ribbon+tile");

  return (
    <AbsoluteFill style={{ backgroundColor: "#060606", overflow: "hidden" }}>
      {/* Animated conic gradient underlay */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `conic-gradient(from ${angle}deg, #FFB74D, #FF7043, #F06292, #7C4DFF, #FFB74D)`,
          filter: "blur(60px) saturate(1.15)",
          opacity: 0.55,
        }}
      />

      {/* Background image with parallax/tilt */}
      {bgSrc && (
        <Img
          src={bgSrc}
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

      {/* Atmosphere */}
      <Bokeh count={26} seed="bokeh" />
      <SparklesTwinkle count={18} seed="twinkle" />

      {/* Subtle veil to help text legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.55))",
        }}
      />

      /* ------------------------------------------------------------------ */
      /*  Aurora-glass invite card – prettier, lighter, more modern ✨       */
      /* ------------------------------------------------------------------ */

      {/* Aurora frame with animated sweep */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: `translate(-50%, -50%) scale(${0.94 + intro * 0.06})`,
          width: Math.min(720, width * 0.9),
          borderRadius: 34,
          padding: 3,
          background:
            "linear-gradient(135deg,#FFD36E 0%,#FF9A5A 18%,#FF67B0 46%,#8B6CFF 78%,#FFD36E 100%)",
          boxShadow: "0 28px 90px rgba(0,0,0,0.38)",
          overflow: "hidden",
        }}
      >
        {/* moving aurora sweep inside the stroke */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient( 60deg, rgba(255,255,255,0.15) 0 2px, transparent 2px 8px )",
            opacity: 0.35,
            transform: `translateX(${(frame % (fps * 8)) / (fps * 8) * -100}%)`,
          }}
        />

        {/* Frosted-glass inner card */}
        <div
          style={{
            position: "relative",
            borderRadius: 30,
            padding: isWish ? "40px 34px 34px" : "34px 34px 28px",
            background: "rgba(255,255,255,0.90)",
            WebkitBackdropFilter: "blur(10px) saturate(1.35)",
            backdropFilter: "blur(10px) saturate(1.35)",
            border: "1px solid rgba(255,255,255,0.6)",
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          {/* faint radial glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 0%, rgba(255,215,155,0.32) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* shimmering diagonal sheen */}
          <Sheen x={shimmerX} opacity={0.14} />

          {/* ----- Content ----- */}

          {/* Title with gold-pink gradient text */}
          <h1
            style={{
              margin: 0,
              fontSize: 48,
              lineHeight: 1.05,
              letterSpacing: 0.3,
              fontWeight: 800,
              background:
                "linear-gradient(135deg,#e29500 0%,#ff586e 50%,#925bff 100%)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 2px 6px rgba(255,255,255,0.5)",
              transform: `translateY(${(1 - intro) * 14}px)`,
              opacity: intro,
            }}
          >
            {title}
          </h1>

          {/* Host / Names pill */}
          {!isWish && !!names && (
            <div
              style={{
                marginTop: 16,
                display: "inline-block",
                borderRadius: 999,
                padding: 2,
                background:
                  "linear-gradient(90deg,rgba(255,211,110,1),rgba(255,95,168,1),rgba(139,108,255,1))",
                transform: `translateY(${(1 - intro2) * 14}px)`,
                opacity: intro2,
              }}
            >
              <div
                style={{
                  borderRadius: 999,
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.88)",
                  fontWeight: 700,
                  color: "#222",
                  fontSize: 17,
                }}
              >
                {names}
              </div>
            </div>
          )}

          {/* Divider + date / venue */}
          {!isWish && (date || venue) && (
            <>
              <div
                style={{
                  margin: "18px auto 0",
                  height: 1,
                  width: 180,
                  background:
                    "linear-gradient(90deg,transparent,rgba(0,0,0,0.3),transparent)",
                }}
              />
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 19,
                  fontWeight: 500,
                  color: "#51525c",
                  transform: `translateY(${(1 - intro3) * 14}px)`,
                  opacity: intro3,
                }}
              >
                {date}
                {venue ? ` · ${venue}` : ""}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Extra festivities for HD */}
      {tier === "hd" && (
        <>
          <ConfettiBurst at={Math.round(fps * 1.2)} seed="c1" />
          <ConfettiBurst at={Math.round(durationInFrames - fps * 1.6)} seed="c2" />
        </>
      )}

      {/* Tiled anti-crop watermark (FREE / forced watermark) */}
      {showTile && <WatermarkTile text={wmText} opacity={wmOpacity} seed={wmSeed} />}

      {/* Bottom ribbon watermark – visible on FREE if strategy includes ribbon */}
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

      {/* Music – use callback to avoid Remotion volume warning */}
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
