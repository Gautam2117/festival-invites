// remotion/ImageCard.tsx
"use client";

import { JSX } from "react";
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
};

const resolve = (src?: string | null) => {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  const p = src.startsWith("/") ? src : `/${src}`;
  return staticFile(p);
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* ---- Visual micro-elements -------------------------------------------- */

const Sheen: React.FC<{ x: number; rotate?: number; opacity?: number }> = ({
  x,
  rotate = -16,
  opacity = 0.16,
}) => (
  <div
    style={{
      position: "absolute",
      top: "18%",
      left: x,
      width: 220,
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

const Sparkles: React.FC<{ count: number; seed: string }> = ({ count, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const x = r(0) * width;
        const y = r(1) * height;
        // gentle twinkle (also resolves nicely on still frames)
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
      {new Array(count).fill(0).map((_, i) => {
        const r = (t: number) => random(`${seed}-${i}-${t}`);
        const size = 40 + r(0) * 70;
        const startX = r(1) * (width + 200) - 100;
        const baseY = r(2) * height;
        const speed = 12 + r(3) * 22; // px/sec
        const drift = Math.sin((frame / fps) * 1.2 + r(4) * 6.28) * 60;

        // slow upward float; still renders catch a nice snapshot
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

  const r = (k: number) => random(`wm-still-${seed}-${k}`);
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

/* ---- Main still composition ------------------------------------------- */

export const ImageCard: React.FC<Props> = ({
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
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 200, mass: 0.9 } });

  const mustWatermark = tier === "free" || !!watermark;
  const showRibbon =
    mustWatermark && (watermarkStrategy === "ribbon" || watermarkStrategy === "ribbon+tile");
  const showTile =
    mustWatermark && (watermarkStrategy === "tile" || watermarkStrategy === "ribbon+tile");
  const bgSrc = resolve(bg);

  // rotating conic glow for premium feel
  const angle = interpolate(frame, [0, durationInFrames || 150], [0, 360], {
    easing: Easing.linear,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // subtle Ken-Burns on background
  const kbScale = interpolate(frame, [0, 120], [1.06, 1.1], { extrapolateRight: "extend" });

  // sheen sweep across the card
  const sheenX = interpolate(frame % Math.round(fps * 2.2), [0, fps * 2.2], [-300, width + 300]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#070707" }}>
      {/* conic ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: "-18%",
          background: `conic-gradient(from ${angle}deg, #FFB74D, #FF7043, #F06292, #7C4DFF, #FFB74D)`,
          filter: "blur(60px) saturate(1.1)",
          opacity: 0.55,
        }}
      />

      {/* background image (or gradient) */}
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
            background: "linear-gradient(135deg,#FFB74D 0%,#FF7043 45%,#F06292 100%)",
          }}
        />
      )}

      {/* atmosphere */}
      <Bokeh count={22} seed="bokeh-still" />
      <Sparkles count={16} seed="sparkles-still" />

      {/* legibility veil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.55))",
        }}
      />

      {/* golden frame wrapper – now just a thin luxe border */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%,-50%) scale(${0.96 + intro * 0.04})`,
          width: Math.min(860, width * 0.9),
          borderRadius: 30,
          padding: 2,                         // gradient stroke thickness
          background:
            "linear-gradient(135deg,#FFD36E 0%,#FF9A5A 20%,#FF5FA8 55%,#8B6CFF 85%,#FFD36E 100%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* subtle inner wash to soften the border */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 28,
            background: "rgba(255,255,255,0.06)",
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />

        {/* quick sheen across the frame */}
        <Sheen x={sheenX} opacity={0.14} />

        {/* ------------------------------------------------------------------ */}
        {/*  ⬇️  NEW premium overlay (title-first, frosted glass)  ⬇️          */}
        {/* ------------------------------------------------------------------ */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "12%",
            transform: "translateX(-50%)",
            width: "min(88%, 720px)",
            textAlign: "center",
            color: "#fff",
            pointerEvents: "none",
            opacity: intro,               // spring entrance
          }}
        >
          {/* Title with glow + gradient stroke */}
          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 16,
              background:
                "linear-gradient(to right,rgba(0,0,0,0.38),rgba(0,0,0,0.18))",
              backdropFilter: "blur(6px) saturate(1.15)",
              WebkitBackdropFilter: "blur(6px) saturate(1.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 8px 26px rgba(0,0,0,0.35)",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 42,
                lineHeight: 1.1,
                letterSpacing: 0.25,
                textShadow: "0 2px 18px rgba(0,0,0,0.45)",
                background:
                  "linear-gradient(135deg,#ffffff 0%,#ffe8c6 45%,#ffd6ff 80%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Names + date/venue pill (hidden for wish templates) */}
          {!isWish && !!names && (
            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                background:
                  "linear-gradient(to right,rgba(0,0,0,0.32),rgba(0,0,0,0.15))",
                border: "1px solid rgba(255,255,255,0.20)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                fontWeight: 600,
                fontSize: 18,
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
                  <span style={{ opacity: 0.9 }}>
                    {date}
                    {venue ? ` · ${venue}` : ""}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* tiled watermark (FREE / forced watermark) */}
      {showTile && <WatermarkTile text={wmText} opacity={wmOpacity} seed={wmSeed} />}

      {/* watermark ribbon on FREE (if strategy includes ribbon) */}
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
    </AbsoluteFill>
  );
};
