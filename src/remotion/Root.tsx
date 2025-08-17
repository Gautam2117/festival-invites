import React from "react";
import { Composition } from "remotion";
import { FestivalIntro } from "./FestivalIntro";
import { ImageCard } from "./ImageCard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Vertical video (9:16) */}
      <Composition
        id="festival-intro"
        component={FestivalIntro}
        fps={30}
        width={720}
        height={1280}
        durationInFrames={180} // 6s @30fps (premium pacing)
        defaultProps={{
          title: "Diwali Celebration",
          names: "The Sharma Family",
          date: "Sun, Nov 2 · 7 PM",
          venue: "Sharma Residence, Pune",
          // Point to real assets in /public
          bg: "/assets/bg/diwali.jpg",
          music: "/assets/music/festive-brass.mp3",
          musicVolume: 0.8,
          tier: "free",       // builder flips this to "hd" after payment
          watermark: true,    // ribbon visible for free tier
        }}
      />

      {/* Square image (1:1) — rendered as a still (we animate subtly for previews) */}
      <Composition
        id="image-card"
        component={ImageCard}
        fps={30}
        width={1080}
        height={1080}
        durationInFrames={120} // 4s in preview player; still renders pick a frame (e.g. 60)
        defaultProps={{
          title: "Happy Diwali",
          names: "From the Sharma Family",
          date: "Nov 2, 2025",
          venue: "Pune",
          bg: "/assets/bg/diwali.jpg",
          tier: "free",
          watermark: true,
        }}
      />
    </>
  );
};
