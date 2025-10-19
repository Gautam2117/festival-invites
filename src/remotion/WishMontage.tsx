// src/remotion/WishMontage.tsx
"use client";

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Easing,
  interpolate,
  random,
  staticFile,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ============================================================================
   Types (unchanged public API)
============================================================================ */
type WishLite = {
  message: string;
  senderName?: string;
  senderType?: "company" | "family" | "personal";
  logoUrl?: string | null;
  createdAt?: number;
};

type BrandInput = {
  name?: string;
  logoUrl?: string;
  tagline?: string;
  primary?: string;
  secondary?: string;
  ribbon?: boolean;  // kept for parity (not used)
  endCard?: boolean; // kept for parity (not used)
};

type Props = {
  wishes: WishLite[];
  bg?: string;            // background image path or data: URL
  music?: string | null;  // optional gentle bed
  musicVolume?: number;   // 0..1
  brand?: BrandInput;     // optional accent colors/logo
  theme?: string;         // optional theme token (future)
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
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ============================================================================
   Atmosphere elements (lightweight + deterministic)
============================================================================ */
const Bokeh: React.FC<{ count: number; seed: string }> = ({ count, seed }) => {
  const frame = useCurrentFrame();
  const { height, width, fps } = useVideoConfig();

  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const r = (t: number) => random(`${seed}-${i}-${t}`);
        const size = 36 + r(0) * 72;
        const startX = r(1) * (width + 200) - 100;
        const baseY = r(2) * height;
        const speed = 10 + r(3) * 18; // px/sec
        const drift = Math.sin((frame / fps) * (0.8 + r(4) * 0.8) + r(5) * 6.28) * 60;

        // gentle float upwards (wrap around)
        const y = (baseY - (frame / fps) * speed) % (height + 160);
        const x = startX + drift;

        const o = 0.10 + r(6) * 0.16;
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
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.36), rgba(255,255,255,0.0) 60%)",
              filter: "blur(0.6px)",
              opacity: o,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </>
  );
};

const Twinkles: React.FC<{ count: number; seed: string }> = ({ count, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const x = r(0) * width;
        const y = r(1) * height * 0.9; // avoid extreme bottom
        const phase = r(2) * Math.PI * 2;
        const tw = Math.sin((frame / fps) * (0.9 + r(3) * 1.2) + phase);
        const base = 0.35 + r(4) * 0.55;
        const o = clamp01(base * (0.45 + 0.55 * (0.5 + 0.5 * tw)));
        const s = 7 + r(5) * 11;

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
              filter: "blur(0.5px)",
              opacity: o * 0.7,
              mixBlendMode: "plus-lighter",
            }}
          />
        );
      })}
    </>
  );
};

/* ============================================================================
   Wish card (premium glass with gradient stroke)
============================================================================ */
const Badge: React.FC<{ kind?: WishLite["senderType"] }> = ({ kind }) => {
  const label =
    kind === "company" ? "Company" : kind === "family" ? "Family" : "Personal";
  const hue = kind === "company" ? 210 : kind === "family" ? 28 : 320;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 999,
        background: `hsla(${hue}, 85%, 92%, .12)`,
        border: `1px solid hsla(${hue}, 70%, 70%, .25)`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.2,
        color: "#fff",
        opacity: 0.92,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: `hsl(${hue}, 90%, 60%)`,
          boxShadow: `0 0 8px hsla(${hue}, 90%, 60%, .6)`,
        }}
      />
      {label}
    </span>
  );
};

const FallbackInitial: React.FC<{ name?: string }> = ({ name }) => {
  const letter = (name || "A").trim().charAt(0).toUpperCase() || "A";
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background:
          "linear-gradient(135deg, rgba(255,255,255,.15), rgba(255,255,255,.05))",
        border: "1px solid rgba(255,255,255,.25)",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: 13,
      }}
    >
      {letter}
    </div>
  );
};

const WishCardPro: React.FC<{
  w: WishLite;
  slotStart: number;
  slotEnd: number;
  primary: string;
  secondary: string;
  index: number;
}> = ({ w, slotStart, slotEnd, primary, secondary, index }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // animate within the slot
  const inDur = Math.round(fps * 0.35);
  const outDur = Math.round(fps * 0.4);
  const fadeIn = interpolate(frame, [slotStart, slotStart + inDur], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [slotEnd - outDur, slotEnd], [1, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appear = clamp01(fadeIn * fadeOut);

  // subtle entrance motion (x and scale)
  const enter = spring({
    fps,
    frame: frame - slotStart,
    config: { damping: 200, mass: 0.7, stiffness: 120 },
  });

  // alternate left/center/right positions for variety
  const layoutCycle = index % 3;
  const targetX =
    layoutCycle === 0 ? width * 0.5 : layoutCycle === 1 ? width * 0.36 : width * 0.64;
  const fromX = layoutCycle === 0 ? width * 0.5 : layoutCycle === 1 ? width * 0.18 : width * 0.82;
  const x = lerp(fromX, targetX, enter);

  // gentle vertical drift
  const yDrift = interpolate(frame, [slotStart, slotEnd], [8, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: `calc(50% + ${yDrift}px)`,
        transform: "translate(-50%, -50%)",
        width: Math.min(560, 0.78 * width),
        opacity: appear,
      }}
    >
      {/* Thin gradient frame */}
      <div
        style={{
          padding: 2,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          boxShadow: "0 16px 48px rgba(0,0,0,.35)",
        }}
      >
        {/* Frosted glass card */}
        <div
          style={{
            borderRadius: 18,
            padding: "16px 18px",
            background: "rgba(0,0,0,.34)",
            border: "1px solid rgba(255,255,255,.22)",
            color: "#fff",
            backdropFilter: "blur(8px) saturate(1.15)",
            WebkitBackdropFilter: "blur(8px) saturate(1.15)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {w.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.logoUrl}
                  width={26}
                  height={26}
                  alt="logo"
                  style={{ borderRadius: 6, objectFit: "cover" }}
                />
              ) : (
                <FallbackInitial name={w.senderName} />
              )}
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: 0.2,
                  opacity: 0.95,
                }}
              >
                {w.senderName ?? "Anonymous"}
              </div>
            </div>
            <Badge kind={w.senderType} />
          </div>

          {/* Message */}
          <div
            style={{
              fontSize: 20,
              lineHeight: 1.35,
              fontWeight: 700,
              letterSpacing: 0.2,
              textWrap: "balance",
              hyphens: "auto",
            }}
          >
            {w.message}
          </div>

          {/* Accent hairline */}
          <div
            style={{
              marginTop: 12,
              width: 54,
              height: 3,
              borderRadius: 3,
              background: secondary,
              opacity: 0.95,
              boxShadow: "0 0 12px rgba(255,255,255,.25)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   Main composition
============================================================================ */
export const WishMontage: React.FC<Props> = ({
  wishes,
  bg,
  music,
  musicVolume = 0.85,
  brand,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const bgSrc = resolve(bg);
  const musicSrc = resolve(music);

  // Animated conic glow
  const angle = interpolate(frame, [0, durationInFrames], [0, 360], {
    easing: Easing.linear,
  });

  // Auto slotting (keeps pacing snappy for Status)
  const maxShow = clamp(wishes.length || 1, 1, 10);
  const intro = Math.round(fps * 0.6);
  const outro = Math.round(fps * 0.6);
  const body = Math.max(1, durationInFrames - intro - outro);
  const per = Math.max(Math.round(body / maxShow), Math.round(fps * 1.35)); // ≥1.35s per wish

  const primary = brand?.primary || "#8B5CF6";   // violet-500
  const secondary = brand?.secondary || "#F59E0B"; // amber-500

  return (
    <AbsoluteFill style={{ backgroundColor: "#060606", overflow: "hidden" }}>
      {/* Luxe conic glow underlay */}
      <div
        style={{
          position: "absolute",
          inset: "-22%",
          background: `conic-gradient(from ${angle}deg, #FFB74D, #FF7043, #F06292, #7C4DFF, #FFB74D)`,
          filter: "blur(70px) saturate(1.12)",
          opacity: 0.52,
        }}
      />

      {/* Background image with subtle scale */}
      {bgSrc ? (
        <Img
          src={bgSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.08)",
            filter: "saturate(1.04) contrast(1.02)",
          }}
        />
      ) : null}

      {/* Atmosphere */}
      <Bokeh count={26} seed="wb-bokeh" />
      <Twinkles count={14} seed="wb-twinkle" />

      {/* Legibility veil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.28) 70%, rgba(0,0,0,0.58))",
        }}
      />

      {/* Title chip (top) */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.34)",
          border: "1px solid rgba(255,255,255,0.22)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.35,
          boxShadow: "0 8px 20px rgba(0,0,0,.25)",
        }}
      >
        WISHBOARD HIGHLIGHTS
      </div>

      {/* Wishes timeline */}
      {wishes.slice(0, maxShow).map((w, i) => {
        const slotStart = intro + i * per;
        const slotEnd = Math.min(durationInFrames - outro, slotStart + per);
        return (
          <WishCardPro
            key={i}
            w={w}
            slotStart={slotStart}
            slotEnd={slotEnd}
            primary={primary}
            secondary={secondary}
            index={i}
          />
        );
      })}

      {/* Brand chip (bottom) */}
      {(brand?.logoUrl || brand?.name) && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.34)",
            border: "1px solid rgba(255,255,255,0.22)",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(0,0,0,.25)",
          }}
        >
          {brand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoUrl}
              alt="logo"
              width={20}
              height={20}
              style={{ borderRadius: 6, objectFit: "cover" }}
            />
          ) : null}
          <span style={{ fontSize: 12, fontWeight: 800 }}>{brand?.name}</span>
        </div>
      )}

      {/* Music with gentle fade in/out */}
      {musicSrc && (
        <Audio
          src={musicSrc}
          volume={(f) => {
            const fadeIn = interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp" });
            const fadeOut = interpolate(
              f,
              [durationInFrames - 24, durationInFrames],
              [1, 0],
              { extrapolateLeft: "clamp" }
            );
            return clamp01((musicVolume ?? 0.85) * fadeIn * fadeOut);
          }}
        />
      )}

      {/* Soft border & vignette for premium finish */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,.35)",
          boxShadow: "inset 0 40px 140px rgba(0,0,0,.22)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
