import {useEffect, useMemo, useState} from "react";

/* ─────────────────────────────────────────── */
/* Utilities                                  */
/* ─────────────────────────────────────────── */
const withLeadingSlash = (p?: string | null) =>
  !p ? null : p.startsWith("/") ? p : `/${p}`;

const getBuildId = () =>
  typeof window !== "undefined"
    ? (window as any).__NEXT_DATA__?.buildId ?? ""
    : "";

const cacheBust = (url: string) => {
  const id = getBuildId();
  if (!id || url.startsWith("data:")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${id}`;
};

/** Only makes the path absolute for http/https/data URLs */
const resolvePublicUrl = (src: string) =>
  src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")
    ? src
    : src.startsWith("/")
    ? src
    : `/${src}`;

const isDataSaver = () =>
  typeof navigator !== "undefined" && !!(navigator as any)?.connection?.saveData;

/* ─────────────────────────────────────────── */
/* Cross-hook cache                           */
/* ─────────────────────────────────────────── */
type Entry = {status: "ok" | "error" | "loading"; promise?: Promise<void>};

const GLOBAL = globalThis as any;
const __preloadCache: {img: Map<string, Entry>; audio: Map<string, Entry>} =
  GLOBAL.__preloadCache ||
  (Object.defineProperty(GLOBAL, "__preloadCache", {
    value: {img: new Map(), audio: new Map()},
    writable: false,
  }),
  GLOBAL.__preloadCache);

/* ─────────────────────────────────────────── */
/* Image preload                              */
/* ─────────────────────────────────────────── */
function preloadImageOnce(url: string) {
  const c = __preloadCache.img;
  const hit = c.get(url);
  if (hit) return hit.status === "ok" ? Promise.resolve() : Promise.reject();

  const img = new Image();
  img.crossOrigin = "anonymous";

  const p = new Promise<void>((res, rej) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      img.onload = img.onerror = null;
      c.set(url, {status: ok ? "ok" : "error"});
      (ok ? res : rej)();
    };

    img.onload  = () => finish(true);
    img.onerror = () => finish(false);
    img.src     = url;

    if (typeof (img as any).decode === "function") {
      (img as any).decode().then(() => finish(true)).catch(() => {});
    }
    if (img.complete && img.naturalWidth) finish(true);
  });

  c.set(url, {status: "loading", promise: p});
  return p;
}

export function usePreloadImage(src: string | null) {
  const url = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    return resolvePublicUrl(withLeadingSlash(src)!);
  }, [src]);

  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    if (!url) {
      setStatus("idle");
      setReadyUrl(null);
      return;
    }

    if (isDataSaver()) {
      setStatus("ok");
      setReadyUrl(cacheBust(url));
      return;
    }

    setStatus("loading");
    const finalUrl = cacheBust(url);

    preloadImageOnce(finalUrl)
      .then(() => !cancelled && (setReadyUrl(finalUrl), setStatus("ok")))
      .catch(() => !cancelled && (setReadyUrl(null), setStatus("error")));

    return () => { cancelled = true; };
  }, [url]);

  return {readyUrl, status};
}

/* ─────────────────────────────────────────── */
/* Audio preload (Safari/iOS-proof)           */
/* ─────────────────────────────────────────── */
function preloadAudioOnce(url: string) {
  const c = __preloadCache.audio;
  const hit = c.get(url);
  if (hit) return hit.status === "ok" ? Promise.resolve() : Promise.reject();

  const p = new Promise<void>((res, rej) => {
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.preload     = "auto";

    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      a.removeEventListener("canplaythrough", okH);
      a.removeEventListener("loadeddata",     okH);
      a.removeEventListener("loadedmetadata", okH);
      a.removeEventListener("error",          errH);
      try { a.src = ""; } catch {}
      c.set(url, {status: ok ? "ok" : "error"});
      (ok ? res : rej)();
    };

    const okH  = () => finish(true);
    const errH = () => finish(false);

    a.addEventListener("canplaythrough", okH,  {once: true});
    a.addEventListener("loadeddata",     okH,  {once: true});
    a.addEventListener("loadedmetadata", okH,  {once: true});
    a.addEventListener("error",          errH, {once: true});

    a.src = url;
    a.load();

    const timeout = setTimeout(() => finish(true), 4000); // stream rest
  });

  c.set(url, {status: "loading", promise: p});
  return p;
}

export function usePreloadAudio(src: string | null) {
  const url = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    return resolvePublicUrl(withLeadingSlash(src)!);
  }, [src]);

  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    if (!url) {
      setStatus("idle");
      setReadyUrl(null);
      return;
    }

    if (isDataSaver()) {
      setStatus("ok");
      setReadyUrl(cacheBust(url));
      return;
    }

    setStatus("loading");
    const finalUrl = cacheBust(url);

    preloadAudioOnce(finalUrl)
      .then(() => !cancelled && (setReadyUrl(finalUrl), setStatus("ok")))
      .catch(() => !cancelled && (setReadyUrl(null), setStatus("error")));

    return () => { cancelled = true; };
  }, [url]);

  return {readyUrl, status};
}
