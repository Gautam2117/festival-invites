// src/lib/use-asset-preload.ts
import {useEffect, useMemo, useRef, useState} from "react";

const withLeadingSlash = (p?: string | null) =>
  !p ? null : p.startsWith("/") ? p : `/${p}`;

export function usePreloadImage(src: string | null) {
  const url = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("data:")) return src; // already ready
    return withLeadingSlash(src);
  }, [src]);

  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    if (!url) { setReadyUrl(null); setStatus("idle"); return; }
    setStatus("loading");
    const img = new Image();
    const done = () => { setReadyUrl(url); setStatus("ok"); };
    const fail = () => { setReadyUrl(null); setStatus("error"); };
    img.onload = done;
    img.onerror = fail;
    img.src = url + (url.startsWith("data:") ? "" : `?v=${__BUILD_ID__ ?? ""}`);
    return () => { img.onload = null; img.onerror = null as any; };
  }, [url]);

  return {readyUrl, status};
}

export function usePreloadAudio(src: string | null) {
  const url = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    return withLeadingSlash(src);
  }, [src]);

  const el = useRef<HTMLAudioElement | null>(null);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    if (!url) { setReadyUrl(null); setStatus("idle"); return; }
    setStatus("loading");
    const a = new Audio();
    el.current = a;
    a.preload = "auto";
    const ok = () => { setReadyUrl(url); setStatus("ok"); };
    const fail = () => { setReadyUrl(null); setStatus("error"); };
    a.addEventListener("canplaythrough", ok, {once: true});
    a.addEventListener("error", fail, {once: true});
    a.src = url + (url.startsWith("data:") ? "" : `?v=${__BUILD_ID__ ?? ""}`);
    a.load();
    return () => {
      a.removeEventListener("canplaythrough", ok);
      a.removeEventListener("error", fail);
      el.current = null;
    };
  }, [url]);

  return {readyUrl, status};
}

// tiny build id to bust stale caches (define in your app, optional)
declare global { var __BUILD_ID__: string | undefined; }
