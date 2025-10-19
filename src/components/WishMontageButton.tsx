// src/components/WishMontageButton.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function WishMontageButton({ inviteId }: { inviteId: string }) {
  const [busy, setBusy] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/montage/wishes/${inviteId}?count=6&seconds=12`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to compile");
      setLastUrl(j.url);
      download(j.url, "wishboard-status.mp4");

      // Try native share (best for WhatsApp Status)
      if (typeof navigator.share === "function") {
        try {
          const resp = await fetch(j.url);
          const blob = await resp.blob();
          const file = new File([blob], "wishboard-status.mp4", {
            type: "video/mp4",
          });
          if ((navigator as any).canShare?.({ files: [file] })) {
            await (navigator as any).share({
              files: [file],
              title: "Wishboard Status",
              text: "Post to your WhatsApp Status 🎉",
            });
          }
        } catch {
          // silently ignore share errors
        }
      }
    } catch (e: any) {
      setErr(e?.message || "Failed to create montage");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={create}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
        title="Compile top wishes into a short status video"
        aria-live="polite"
      >
        {busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Compiling…
          </>
        ) : (
          <>
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            Create Wish Status
          </>
        )}
      </motion.button>

      <div className="mt-1 flex items-center gap-2">
        {lastUrl && !busy && (
          <a
            href={lastUrl}
            download="wishboard-status.mp4"
            className="text-xs underline"
          >
            Re-download last
          </a>
        )}
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </div>
    </div>
  );
}
