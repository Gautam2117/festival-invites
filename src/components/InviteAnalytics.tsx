"use client";
import { useEffect } from "react";

export default function InviteAnalytics({ inviteId }: { inviteId: string }) {
  useEffect(() => {
    if (!inviteId) return;
    fetch(`/api/analytics/track/${inviteId}?ref=${encodeURIComponent(document.referrer || "")}`, {
      method: "POST",
    }).catch(() => {});
  }, [inviteId]);

  return null;
}
