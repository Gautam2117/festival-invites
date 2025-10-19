"use client";
import dynamic from "next/dynamic";

const SocialPreviewStudioNoSSR = dynamic(
  () => import("../SocialPreviewStudio"),
  { ssr: false, loading: () => null }
);

export default SocialPreviewStudioNoSSR;
