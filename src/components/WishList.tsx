// src/components/WishList.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import WishCard from "./WishCard";

type Wish = {
  id: string | number;
  message: string;
  senderName?: string;
  senderType: "company" | "family" | "personal" | string;
  logoUrl?: string | null;
  createdAt: number;
};

export default function WishList({ inviteId }: { inviteId: string }) {
  const [items, setItems] = useState<Wish[]>([]);
  const [after, setAfter] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadMore(reset = false) {
    if (loading || (done && !reset)) return;
    setLoading(true);

    const cursor = reset ? 0 : after;
    const r = await fetch(
      `/api/wishes/${inviteId}` + (cursor ? `?after=${cursor}` : "")
    );
    const j = await r.json();
    const next: Wish[] = j.items || [];

    setItems((prev) => (reset ? next : [...prev, ...next]));
    if (next.length === 0 || next.length < 100) setDone(true);

    const last = next[next.length - 1];
    setAfter(last ? (last.createdAt as number) : cursor);
    setLoading(false);
  }

  // initial + refresh on submit
  useEffect(() => {
    setItems([]);
    setAfter(0);
    setDone(false);
    loadMore(true);

    const onSubmitted = () => {
      setDone(false);
      loadMore(true);
    };
    window.addEventListener("wish:submitted", onSubmitted);
    return () => window.removeEventListener("wish:submitted", onSubmitted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId]);

  // Infinite scroll (progressively enhance)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelRef.current, loading, done]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="mt-4">
      {items.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {items.map((w) => (
            <WishCard key={w.id} {...w} />
          ))}

          {/* Skeletons */}
          {loading && <SkeletonList />}

          {/* Load more button (fallback) */}
          {!done && (
            <div className="flex justify-center">
              <button
                onClick={() => loadMore()}
                disabled={loading}
                className="mt-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-1.5 text-sm hover:bg-white disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
          <div ref={sentinelRef} aria-hidden className="h-8" />
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid place-items-center rounded-2xl border border-white/60 bg-white/80 p-6 text-center dark:bg-zinc-900/50"
    >
      <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 text-white shadow-sm">
        🪔
      </div>
      <h4 className="mt-3 font-medium">No wishes yet</h4>
      <p className="mt-1 text-sm text-ink-700">
        Be the first to send a message!
      </p>
    </motion.div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/60 bg-white/80 p-4 dark:bg-zinc-900/50"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-3 w-24 rounded bg-ink-200/60" />
            <div className="h-5 w-16 rounded-full bg-ink-200/60" />
          </div>
          <div className="mt-3 h-4 w-3/4 rounded bg-ink-200/60" />
          <div className="mt-2 h-4 w-2/5 rounded bg-ink-200/60" />
          <div className="mt-3 h-6 w-32 rounded bg-ink-200/60" />
        </div>
      ))}
    </div>
  );
}
