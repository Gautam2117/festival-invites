"use client";
import dynamic from "next/dynamic";

// Load only on the client, avoid SSR
const CaptionsPanelNoSSR = dynamic(() => import("../CaptionsPanel"), {
  ssr: false,
  loading: () => null,
});

export default CaptionsPanelNoSSR;
