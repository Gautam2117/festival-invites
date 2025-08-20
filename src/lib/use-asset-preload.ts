// src/lib/use-asset-preload.ts
import {useEffect, useMemo, useRef, useState} from "react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const withLeadingSlash = (p?: string | null) =>
  !p ? null : p.startsWith("/") ? p : `/${p}`;

/** Safely read Next.js build ID on the client (returns "" on SSR) */
const getBuildId = () =>
  typeof window !== "undefined"
    ? (window as any).__NEXT_DATA__?.buildId ?? ""
    : "";

/** Optionally append ?v=<buildId> for cache-busting */
const cacheBust = (url: string) => {
  const id = getBuildId();
  if (!id || url.startsWith("data:")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${id}`;
};

/* ------------------------------------------------------------------ */
/*  Image preload hook                                                */
/* ------------------------------------------------------------------ */

export function usePreloadImage(src: string | null) {
  const url = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("data:")) return src; // already decoded
    return withLeadingSlash(src);
  }, [src]);

  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );

  useEffect(() => {
    if (!url) {
      setReadyUrl(null);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const img = new Image();

    const done = () => {
      setReadyUrl(url);
      setStatus("ok");
    };
    const fail = () => {
      setReadyUrl(null);
      setStatus("error");
    };

    img.onload = done;
    img.onerror = fail;
    img.src = cacheBust(url);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return {readyUrl, status};
}

/* ------------------------------------------------------------------ */
/*  Audio preload hook                                                */
/* ------------------------------------------------------------------ */

export function usePreloadAudio(src: string | null) {
  const url = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    return withLeadingSlash(src);
  }, [src]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );

  useEffect(() => {
    if (!url) {
      setReadyUrl(null);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const a = new Audio();
    audioRef.current = a;
    a.preload = "auto";

    const ok = () => {
      setReadyUrl(url);
      setStatus("ok");
    };
    const fail = () => {
      setReadyUrl(null);
      setStatus("error");
    };

    a.addEventListener("canplaythrough", ok, {once: true});
    a.addEventListener("error",           fail, {once: true});
    a.src = cacheBust(url);
    a.load();

    return () => {
      a.removeEventListener("canplaythrough", ok);
      a.removeEventListener("error",           fail);
      audioRef.current = null;
    };
  }, [url]);

  return {readyUrl, status};
}
