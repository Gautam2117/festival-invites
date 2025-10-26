// src/remotion/Root.tsx
import * as React from "react";
import { Composition, Still } from "remotion";
import { z } from "zod";

import { FestivalIntro } from "./FestivalIntro";
import { ImageCard } from "./ImageCard";
import { OGCard } from "./OGCard";
import { WishMontage } from "./WishMontage";

/* ============================================================================
   Global rendering config
============================================================================ */
const FPS = 30;

/* ============================================================================
   Schemas for prop validation (safety + DX)
============================================================================ */
const brandSchema = z.object({
  name: z.string().optional(),
  logoUrl: z.string().url().optional(),
  tagline: z.string().optional(),
  primary: z.string().optional(),
  secondary: z.string().optional(),
  ribbon: z.boolean().optional(),
  endCard: z.boolean().optional(),
});

const introSchema = z.object({
  title: z.string(),
  names: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
  bg: z.string().optional().nullable(),
  music: z.string().optional().nullable(),
  musicVolume: z.number().min(0).max(1).default(0.85),
  tier: z.enum(["free", "hd"]).default("free"),
  watermark: z.boolean().optional(),
  watermarkStrategy: z.enum(["ribbon", "tile", "ribbon+tile"]).optional(),
  wmSeed: z.number().int().optional(),
  wmText: z.string().optional(),
  wmOpacity: z.number().min(0).max(1).optional(),
  isWish: z.boolean().optional(),
  brand: brandSchema.optional(),
});

const wishSchema = z.object({
  message: z.string(),
  senderName: z.string().optional(),
  senderType: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
});

const montageSchema = z.object({
  wishes: z.array(wishSchema).default([]),
  bg: z.string().optional().nullable(),
  music: z.string().optional().nullable(),
  musicVolume: z.number().min(0).max(1).default(0.9),
  /** optional brand badge for end card / ribbon */
  brand: brandSchema.optional(),
});

const imageCardSchema = z.object({
  title: z.string(),
  names: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
  bg: z.string().optional().nullable(),
  tier: z.enum(["free", "hd"]).default("free"),
  watermark: z.boolean().optional(),
  watermarkStrategy: z.enum(["ribbon", "tile", "ribbon+tile"]).optional(),
  wmSeed: z.number().int().optional(),
  wmText: z.string().optional(),
  wmOpacity: z.number().min(0).max(1).optional(),
  isWish: z.boolean().optional(),
  brand: brandSchema.optional(),
});

const ogSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
  bg: z.string().optional().nullable(),
  theme: z.union([z.enum(["classic", "gold", "emerald", "rose"]), z.string()]).default("classic"),
  ownerName: z.string().optional(),
  ownerOrg: z.string().optional().nullable(),
});

/* ============================================================================
   Smart duration helpers
============================================================================ */
const perWishSeconds = 1.5; // visual sweet-spot for status montage
const introOutroSeconds = 1.2 + 1.2; // soft in/out
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

function getWishMontageFrames(wishes: unknown) {
  const parsed = montageSchema.shape.wishes.safeParse(wishes);
  const count = parsed.success ? parsed.data.length : 0;
  const seconds = introOutroSeconds + count * perWishSeconds;
  const bounded = clamp(seconds, 7, 15); // keep snappy for Status
  return Math.round(bounded * FPS);
}

/* ============================================================================
   Default props (premium, festive, WhatsApp-first)
============================================================================ */
const DEFAULT_BG = "/assets/backgrounds/diwali.jpg";
const DEFAULT_MUSIC_INTRO = "/assets/music/festive-brass.mp3";
const DEFAULT_MUSIC_SOFT = "/assets/music/soft-bed.mp3";

const defaultBrand = {
  name: "Festival Invites",
  primary: "#7C3AED",
  secondary: "#F59E0B",
  ribbon: true,
  endCard: true,
} as const;

/* ============================================================================
   Root
============================================================================ */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* -------------------------------------------------------------
         Vertical video (9:16) — Premium intro
      -------------------------------------------------------------- */}
      <Composition
        id="festival-intro"
        component={FestivalIntro}
        schema={introSchema}
        fps={FPS}
        width={720}
        height={1280}
        durationInFrames={180}
        defaultProps={{
          title: "Diwali Celebration",
          names: "The Sharma Family",
          date: "Sun, Nov 2 · 7 PM",
          venue: "Sharma Residence, Pune",
          bg: DEFAULT_BG,
          music: DEFAULT_MUSIC_INTRO,
          musicVolume: 0.8,
          tier: "free",
          watermark: true,
          watermarkStrategy: "ribbon+tile",
          wmText: "Festival Invites — FREE PREVIEW",
          wmOpacity: 0.18,
          brand: defaultBrand,
        }}
      />

      {/* -------------------------------------------------------------
         Vertical video (9:16) — Status Lite (smaller canvas, same look)
      -------------------------------------------------------------- */}
      <Composition
        id="festival-intro-lite"
        component={FestivalIntro}
        schema={introSchema}
        fps={FPS}
        width={540}
        height={960}
        durationInFrames={150}
        defaultProps={{
          title: "Happy Navratri",
          names: "From the Patils",
          date: "Fri, Oct 3 · 6 PM",
          venue: "Community Hall, Nashik",
          bg: DEFAULT_BG,
          music: DEFAULT_MUSIC_INTRO,
          musicVolume: 0.75,
          tier: "free",
          watermark: true,
          watermarkStrategy: "ribbon",
          wmText: "Festival Invites — FREE PREVIEW",
          wmOpacity: 0.18,
          brand: { ...defaultBrand, ribbon: true, endCard: false },
        }}
      />

      {/* -------------------------------------------------------------
         NEW: Wishboard montage (vertical Status)
         Dynamic duration: intro/outro + 1.5s per wish (clamped 7–15s)
      -------------------------------------------------------------- */}
      <Composition
        id="wish-montage"
        component={WishMontage}
        schema={montageSchema}
        fps={FPS}
        width={720}
        height={1280}
        defaultProps={{
          wishes: [
            { message: "Have a wonderful celebration!", senderName: "A friend" },
            { message: "Wishing you joy and prosperity 🪔", senderName: "Sneha" },
            { message: "Lots of love and light ✨", senderName: "Rahul" },
          ],
          bg: DEFAULT_BG,
          music: DEFAULT_MUSIC_SOFT,
          musicVolume: 0.9,
          brand: { name: "Your Brand", primary: "#10b981", secondary: "#a78bfa", ribbon: true },
        }}
        // ⬇︎ (Remotion) dynamically size composition from props
        calculateMetadata={({ props }) => {
          const durationInFrames = getWishMontageFrames(props.wishes);
          return { durationInFrames, props };
        }}
      />

      {/* -------------------------------------------------------------
         Square video (1:1) — same ImageCard look but animated timeline
      -------------------------------------------------------------- */}
      <Composition
        id="image-card-video"
        component={ImageCard}
        schema={imageCardSchema}
        fps={FPS}
        width={1080}
        height={1080}
        durationInFrames={120}
        defaultProps={{
          title: "Happy Diwali",
          names: "From the Sharma Family",
          date: "Nov 2, 2025",
          venue: "Pune",
          bg: DEFAULT_BG,
          tier: "free",
          watermark: true,
          watermarkStrategy: "ribbon+tile",
          wmText: "Festival Invites — FREE PREVIEW",
        }}
      />

      {/* -------------------------------------------------------------
         Feed portrait (4:5) — still
      -------------------------------------------------------------- */}
      <Still
        id="image-card-4x5"
        component={ImageCard}
        schema={imageCardSchema}
        width={1080}
        height={1350}
        defaultProps={{
          title: "Gudi Padwa Greetings",
          names: "From the Deshmukh Family",
          date: "Apr 9, 2025",
          venue: "Mumbai",
          bg: DEFAULT_BG,
          tier: "free",
          watermark: true,
          watermarkStrategy: "ribbon",
          isWish: true,
          brand: { ...defaultBrand, endCard: false },
        }}
      />

      {/* -------------------------------------------------------------
         Square image (1:1) — still
      -------------------------------------------------------------- */}
      <Still
        id="image-card"
        component={ImageCard}
        schema={imageCardSchema}
        width={1080}
        height={1080}
        defaultProps={{
          title: "Happy Diwali",
          names: "From the Sharma Family",
          date: "Nov 2, 2025",
          venue: "Pune",
          bg: DEFAULT_BG,
          tier: "free",
          watermark: true,
          watermarkStrategy: "ribbon+tile",
          wmText: "Festival Invites — FREE PREVIEW",
        }}
      />

      {/* -------------------------------------------------------------
         Landscape OG (1200×630) — still (use Still for crisp social cards)
      -------------------------------------------------------------- */}
      <Still
        id="og-card"
        component={OGCard}
        schema={ogSchema}
        width={1200}
        height={630}
        defaultProps={{
          title: "Invitation",
          subtitle: "Join the celebration",
          date: "Sun, Nov 2 · 7 PM",
          venue: "Sharma Residence, Pune",
          bg: DEFAULT_BG,
          theme: "classic",
          ownerName: "Gautam",
          ownerOrg: "Botify",
        }}
      />

      {/* -------------------------------------------------------------
         Landscape video (16:9) — optional extra format
      -------------------------------------------------------------- */}
      <Composition
        id="festival-intro-16x9"
        component={FestivalIntro}
        schema={introSchema}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={180}
        defaultProps={{
          title: "Eid Celebrations",
          names: "With Family & Friends",
          date: "Sat, Apr 12 · 6 PM",
          venue: "City Club, Bengaluru",
          bg: DEFAULT_BG,
          music: DEFAULT_MUSIC_INTRO,
          tier: "hd",
          watermark: false,
          brand: { ...defaultBrand, ribbon: true, endCard: true },
        }}
      />
    </>
  );
};
