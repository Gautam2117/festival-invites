"use client";
import dynamic from "next/dynamic";

const InviteAnalyticsNoSSR = dynamic(() => import("../InviteAnalytics"), {
  ssr: false,
  loading: () => null,
});

export default InviteAnalyticsNoSSR;
