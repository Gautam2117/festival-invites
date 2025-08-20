/**
 * The whole Builder UI is fully client-side.  Telling Next.js that
 * this page is “force-dynamic” prevents the static prerender pass
 * (which is what was triggering the “useSearchParams() should be
 * wrapped in a suspense boundary” build error).
 */
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useCallback } from "react";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { Player } from "@remotion/player";
import { motion } from "framer-motion";
import {
  Sparkles,
  Image as ImageIcon,
  Film,
  Music2,
  Upload,
  Download,
  CheckCircle2,
  Share2,
  Copy as CopyIcon,
  Link2,
} from "lucide-react";

import { FestivalIntro } from "@/remotion/FestivalIntro";
import { ImageCard } from "@/remotion/ImageCard";
import DecorativeBG from "@/components/DecorativeBG";
import { templates } from "@/templates";
import { copy, getDefaults, type Lang } from "@/i18n/packs";
import {
  bgForTemplate,
  defaultMusicByTemplate,
  curatedTracks,
  curatedMap,
} from "@/lib/media-presets";
import {usePreloadImage, usePreloadAudio} from "@/lib/use-asset-preload";

/** Wish-only slugs: no names/date/venue needed */
const WISH_SLUGS = new Set([
  "good-morning",
  "good-night",
  "congratulations",
  "best-of-luck",
  "get-well-soon",
  "thank-you",
]);

const baseSchema = z.object({
  template: z.string().min(1),
  language: z.enum(["en", "hi", "hinglish"]),
  title: z.string().min(1, "Title is required"),
  names: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
});

/** Build a dynamic schema based on whether the template is an event vs wish */
function schemaFor(slug: string) {
  if (WISH_SLUGS.has(slug)) {
    return baseSchema; // only title required
  }
  return baseSchema
    .extend({
      names: z.string().min(1, "Who’s hosting?"),
      date: z.string().min(1, "Date required"),
    })
    .required();
}

type Mode = "video" | "image";
type TrackId = (typeof curatedTracks)[number]["id"];

declare global {
  interface Window {
    Razorpay: any;
    ClipboardItem: any;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function downloadFromUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.open(url, "_blank", "noopener"), 900);
}

async function copyToClipboard(txt: string) {
  try {
    await navigator.clipboard.writeText(txt);
    alert("Link copied!");
  } catch {
    // silent
  }
}

function shareToWhatsApp(url: string, message = "Check this out!") {
  const shareText = `${message} ${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(wa, "_blank", "noopener");
}

async function shareFileOrLink(url: string, filename: string, mimeHint: string, title = "Festival Invites") {
  try {
    if (navigator.share) {
      // Try file share first (iOS/Android support); fallback to link share.
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const type = blob.type || mimeHint;
        const file = new File([blob], filename, { type });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title, text: "Made with Festival Invites" });
          return;
        }
      } catch {
        // ignore and try link share
      }
      await navigator.share({ url, title, text: "Made with Festival Invites" });
      return;
    }
  } catch {
    // ignore
  }
  await copyToClipboard(url);
}

function BuilderPageInner() {
  const params = useSearchParams();
  const preselect = params.get("template") || "diwali";

  const [template, setTemplate] = useState(preselect);
  const [language, setLanguage] = useState<Lang>("en");

  const defaultsRef = useRef(getDefaults(preselect, "en"));
  const [names, setNames] = useState(defaultsRef.current.names);
  const [title, setTitle] = useState(defaultsRef.current.title);
  const [date, setDate] = useState(defaultsRef.current.date);
  const [venue, setVenue] = useState(defaultsRef.current.venue);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("video");

  const meta = useMemo(
    () => templates.find((t) => t.slug === template) ?? templates[0],
    [template]
  );

  const [paid, setPaid] = useState(false);
  const [exportingWhich, setExportingWhich] = useState<null | "free" | "hd">(null);
  const exporting = exportingWhich !== null;
  const [rzReady, setRzReady] = useState(false);

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("invite.mp4");
  const hasOutput = !!downloadUrl;

  // Background
  const [customBgDataUrl, setCustomBgDataUrl] = useState<string | null>(null);
  const defaultBgPath = bgForTemplate(template);
  const bgCandidate   = customBgDataUrl ?? defaultBgPath;

  // Music
  const autoPreset = defaultMusicByTemplate[template] ?? { file: "", label: "", volume: 0.8 };
  const [trackId, setTrackId] = useState<TrackId>("auto");
  const [customMusic, setCustomMusic] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState<number>(autoPreset.volume);

  const musicFromCurated = curatedMap[trackId] || "";
  const musicCandidate =
    customMusic ?? (trackId === "auto" ? autoPreset.file : trackId === "none" ? null : musicFromCurated);

  /*  🔥 1-line preload */
  const {readyUrl: bgReadyUrl,    status: bgStatus}    = usePreloadImage(bgCandidate);
  const {readyUrl: musicReadyUrl, status: musicStatus} = usePreloadAudio(musicCandidate);
  /*  Pass only when decoded */
  const bgForPlayer:    string | undefined = bgReadyUrl ?? undefined;
  const musicForPlayer: string | undefined = musicReadyUrl ?? undefined;

  /*  Force-remount Player when these change (kills stale frames)  */
  const playerKey =
   `${mode}-${template}-${bgForPlayer ?? "noBg"}-${musicForPlayer ?? "noMusic"}-${paid?"hd":"free"}`;

  const isVideo = mode === "video";
  const isWish = WISH_SLUGS.has(template);

  // Stronger anti-crop watermark hints (used by Remotion comps that support them)
  const wmSeed = useMemo(() => Math.floor(Math.random() * 1e9), [template, language]);
  const wmText = "Festival Invites — FREE PREVIEW";
  const wmStrategy: "ribbon" | "tile" | "ribbon+tile" = "ribbon+tile";
  const wmOpacity = 0.18; // subtle but visible

  function handleContinue() {
    document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handlePayAndExport() {
    try {
      if (!window.Razorpay) throw new Error("Razorpay script not loaded yet. Please try again in a moment.");

      const orderRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 4900, currency: "INR" }),
      }).then((r) => r.json());

      if (!orderRes?.orderId || !orderRes?.keyId) throw new Error("Order creation failed");

      const rz = new window.Razorpay({
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Festival Invites",
        description: "HD Export",
        order_id: orderRes.orderId,
        handler: async (rsp: any) => {
          const ok = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: rsp.razorpay_order_id,
              razorpay_payment_id: rsp.razorpay_payment_id,
              razorpay_signature: rsp.razorpay_signature,
            }),
          }).then((r) => r.json());

          if (ok?.ok) {
            setPaid(true);
            await doExportLambda("hd");
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: { name: "Guest", email: "guest@example.com" },
        theme: { color: "#2563EB" },
      });

      rz.open();
    } catch (e: any) {
      alert(e?.message || "Payment failed to start");
    }
  }

  // Export (same robust logic; polished toasts & states around it)
  async function doExportLambda(quality: "free" | "hd") {
    try {
      setExportingWhich(quality);
      setDownloadUrl(null);

      const compositionId: "festival-intro" | "image-card" =
        isVideo ? "festival-intro" : "image-card";
      const endpoint = isVideo ? "/api/lambda/queue" : "/api/lambda/still";

      // NEW: short per-export fingerprint
      const watermarkId = `wm_${Math.random().toString(36).slice(2, 8)}`;

      const payload: any = {
        compositionId,
        quality,
        inputProps: {
          title,
          names,
          date,
          venue,
          bg: bgForPlayer,
          music: musicForPlayer,
          musicVolume,
          tier: quality === "free" ? "free" : "hd",
          // stronger watermark signals for FREE renders (backward compatible)
          watermark: quality === "free",
          watermarkStrategy: quality === "free" ? wmStrategy : "ribbon",
          wmSeed,
          wmText,
          wmOpacity,
          isWish,
          watermarkId, // NEW
        },
      };
      if (!isVideo) {
        payload.frame = 60;
        payload.format = "png"; // or "jpeg"
      }

      const queued = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (!queued?.renderId || !queued?.bucketName) {
        throw new Error(queued?.error || "Queue error");
      }

      const ext = isVideo ? "mp4" : (payload.format as "png" | "jpeg");
      const guessedKey = queued?.outKey || `renders/${queued.renderId}/out.${ext}`;

      // Always sign final URL server-side (avoids S3 CORS headaches)
      const signed = await fetch(
        `/api/lambda/file?bucketName=${queued.bucketName}&outKey=${encodeURIComponent(
          guessedKey
        )}&ext=${ext}`
      ).then((r) => r.json());
      if (!signed?.url) throw new Error("Failed to presign output URL");

      let finalUrl: string | null = null;
      const deadline = Date.now() + (isVideo ? 180_000 : 60_000); // 3m video, 1m still
      let delay = 900;

      if (isVideo) {
        while (Date.now() < deadline) {
          try {
            const res = await fetch(
              `/api/lambda/progress?renderId=${queued.renderId}&bucketName=${queued.bucketName}&functionName=${encodeURIComponent(
                queued.functionName
              )}`
            );

            if (res.status === 429) {
              await new Promise((r) => setTimeout(r, delay));
              delay = Math.min(delay * 1.6, 8000);
              continue;
            }

            const prog = await res.json();

            if (typeof prog?.error === "string") {
              if (prog.error.includes("Rate Exceeded")) {
                await new Promise((r) => setTimeout(r, delay));
                delay = Math.min(delay * 1.6, 8000);
                continue;
              }
              throw new Error(prog.error);
            }
            if (Array.isArray(prog?.errors) && prog.errors.length) {
              throw new Error(prog.errors[0]?.message || "Render failed");
            }
            if (prog?.done) {
              finalUrl = signed.url;
              break;
            }
          } catch {
            // network hiccup -> backoff
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 1.25 + Math.random() * 200, 3000);
        }
      } else {
        while (Date.now() < deadline) {
          const probe = await fetch(
            `/api/lambda/probe?bucketName=${queued.bucketName}&outKey=${encodeURIComponent(
              guessedKey
            )}`
          ).then((r) => r.json());

          if (probe?.exists) {
            finalUrl = signed.url;
            break;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 1.4, 5000);
        }
      }

      if (!finalUrl) throw new Error("Timed out waiting for render to finish");

      const filename = isVideo ? "invite.mp4" : "invite.png";
      setDownloadUrl(finalUrl);
      setDownloadName(filename);
      downloadFromUrl(finalUrl, filename);
    } catch (e: any) {
      console.error("EXPORT ERROR", e);
      alert(e?.message || "Export error");
    } finally {
      setExportingWhich(null);
    }
  }

  const syncDefaults = (slug: string, lang: Lang) => {
    const next = getDefaults(slug, lang);
    const prev = defaultsRef.current;
    const same = (a: string, b: string) => (a ?? "").trim() === (b ?? "").trim();
    if (same(title, prev.title)) setTitle(next.title);
    if (same(names ?? "", prev.names ?? "")) setNames(next.names ?? "");
    if (same(date ?? "", prev.date ?? "")) setDate(next.date ?? "");
    if (same(venue ?? "", prev.venue ?? "")) setVenue(next.venue ?? "");
    defaultsRef.current = next;
  };

  useEffect(() => {
    syncDefaults(template, language);
    setCustomBgDataUrl(null);
    if (!customMusic) {
      setTrackId("auto");
      const next = defaultMusicByTemplate[template];
      if (next) setMusicVolume(next.volume);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, language, customMusic]);

  /* ------------------------------------------------------------------ */
  /*  🚀  NEW: Prefetch background for instant swaps                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const bg = customBgDataUrl ?? bgForTemplate(template);
    if (!bg || bg.startsWith("data:")) return;          // skip custom data URLs

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = bg.startsWith("/") ? bg : `/${bg}`;     // ensure absolute path
    document.head.appendChild(link);

    return () => {
      // clean-up so we don’t leak <link> tags when switching many times
      document.head.removeChild(link);
    };
  }, [template, customBgDataUrl]);                      // ← dependencies
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const schema = schemaFor(template);
    const parsed = schema.safeParse({ template, language, names, title, date, venue });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const issue of parsed.error.issues) e[issue.path[0] as string] = issue.message;
      setErrors(e);
    } else setErrors({});
  }, [template, language, names, title, date, venue]);

  const labels = copy[language].labels;
  const tierPreview: "free" | "hd" = paid ? "hd" : "free";

  const handleShare = useCallback(async () => {
    if (!downloadUrl) return;
    const isMp4 = downloadName.toLowerCase().endsWith(".mp4");
    const mime = isMp4 ? "video/mp4" : "image/png";
    await shareFileOrLink(downloadUrl, downloadName, mime, "Festival Invites");
  }, [downloadUrl, downloadName]);

  return (
    <>
      <DecorativeBG />

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRzReady(true)}
      />

      {/* Toast: File ready */}
      {downloadUrl && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-3xl w-full rounded-2xl border border-white/50 bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-lime-400 text-white shadow">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-ink-900">Your file is ready</div>
                <div className="text-ink-700">If the download didn’t start, use the buttons.</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadFromUrl(downloadUrl, downloadName)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                title="Share via device share sheet"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                type="button"
                onClick={() => shareToWhatsApp(downloadUrl!, "Here’s my invite:")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                title="Share to WhatsApp"
              >
                <Link2 className="h-4 w-4" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(downloadUrl!)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                title="Copy link"
              >
                <CopyIcon className="h-4 w-4" />
                Copy link
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-sm backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="font-medium text-ink-700">Festive wishes & invite builder</span>
          </div>
          <h1 className="font-display mt-4 text-3xl sm:text-4xl leading-tight">
            Craft <span className="bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">mind-blowing invites</span> in seconds
          </h1>
          <p className="text-ink-700 mt-2">
            Pick a template, personalize details, add music — export & share on WhatsApp.
          </p>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: Form */}
          <section className="rounded-2xl border border-white/50 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-6">
            <h2 className="font-display text-xl mb-4">1) Occasion & Language</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Occasion</label>
                <div className="relative">
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pr-8"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <span
                    className={`pointer-events-none absolute inset-y-0 right-2 my-auto h-6 w-6 rounded-full bg-gradient-to-tr ${meta.accent} opacity-80`}
                    aria-hidden
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Lang)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>
            </div>

            <h2 className="font-display text-xl mt-8 mb-4">2) Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">{labels.eventTitle}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                  placeholder={copy[language].defaults[template]?.title ?? "Event Title"}
                />
                {errors.title && <p className="mt-1 text-sm text-rose-600">{errors.title}</p>}
              </div>

              {!isWish && (
                <>
                  <div>
                    <label className="block text-sm mb-1">{labels.hosts}</label>
                    <input
                      value={names}
                      onChange={(e) => setNames(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                      placeholder={copy[language].defaults[template]?.names ?? "Hosts"}
                    />
                    {errors.names && <p className="mt-1 text-sm text-rose-600">{errors.names}</p>}
                  </div>

                  <div>
                    <label className="block text-sm mb-1">{labels.dateTime}</label>
                    <input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                      placeholder={copy[language].defaults[template]?.date ?? "Date & Time"}
                    />
                    {errors.date && <p className="mt-1 text-sm text-rose-600">{errors.date}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm mb-1">{labels.venue}</label>
                    <input
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                      placeholder={copy[language].defaults[template]?.venue ?? "Venue"}
                    />
                  </div>
                </>
              )}
            </div>

            {/* 3) Background */}
            <h2 className="font-display text-xl mt-8 mb-2">3) Background</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
              <div className="text-sm text-gray-700">
                Using{" "}
                <code className="rounded bg-gray-100 px-1.5 py-0.5">
                  {customBgDataUrl ? "Custom upload" : defaultBgPath}
                </code>
              </div>
              <div className="flex gap-2">
                <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const data = await readFileAsDataUrl(f);
                      setCustomBgDataUrl(data);
                    }}
                  />
                  Upload image
                </label>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                  onClick={() => setCustomBgDataUrl(null)}
                  title="Use template default"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* 4) Music */}
            <h2 className="font-display text-xl mt-8 mb-2">4) Music</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-ink-700" />
                <select
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value as TrackId)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2"
                >
                  {curatedTracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id === "auto" && defaultMusicByTemplate[template]
                        ? `Auto (recommended: ${defaultMusicByTemplate[template].label})`
                        : t.label}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 text-sm">
                  Volume
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  />
                </label>
              </div>

              <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 cursor-pointer">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const data = await readFileAsDataUrl(f);
                    setCustomMusic(data);
                    setTrackId("none");
                  }}
                />
                Upload music
              </label>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {/* Free */}
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                onClick={() => doExportLambda("free")}
                disabled={exporting}
                aria-label="Download free with watermark"
                aria-busy={exportingWhich === "free"}
                title="SD + robust watermark"
              >
                {exportingWhich === "free" ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2v4a1 1 0 0 1-2 0V2a10 10 0 1 0 10 10h-4a1 1 0 0 1 0-2h4A10 10 0 0 0 12 2z"
                      />
                    </svg>
                    Rendering…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {isVideo ? "Download free (watermark)" : "Download image (watermark)"}
                  </>
                )}
              </button>

              {/* HD */}
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-4 py-2 text-white text-sm font-medium shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => (paid ? doExportLambda("hd") : handlePayAndExport())}
                disabled={exporting || !rzReady}
                aria-busy={exportingWhich === "hd"}
                title={!rzReady ? "Loading payment…" : "HD, no watermark, premium effects"}
                aria-label="Export HD without watermark"
              >
                {exportingWhich === "hd" ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2v4a1 1 0 0 1-2 0V2a10 10 0 1 0 10 10h-4a1 1 0 0 1 0-2h4A10 10 0 0 0 12 2z"
                      />
                    </svg>
                    Exporting…
                  </>
                ) : paid ? (
                  <>Export HD {isVideo ? "" : "(PNG)"} </>
                ) : (
                  <>Unlock HD (₹49)</>
                )}
              </button>

              {/* Share (enabled once we have a file) */}
              <button
                type="button"
                onClick={handleShare}
                disabled={!hasOutput}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                title={hasOutput ? "Share your file" : "Export first to share"}
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              <button
                type="button"
                onClick={() => (hasOutput ? shareToWhatsApp(downloadUrl!, "Here’s my invite:") : null)}
                disabled={!hasOutput}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                title={hasOutput ? "Share on WhatsApp" : "Export first to share"}
              >
                <Link2 className="h-4 w-4" />
                WhatsApp
              </button>

              <div className="text-sm text-gray-700 space-y-1">
                <div>Free: SD + robust watermark (anti-crop)</div>
                <div>HD: No watermark · Sharper · Premium effects</div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Continue
              </button>
            </div>
          </section>

          {/* Right: Preview */}
          <section
            id="preview"
            className="rounded-2xl border border-white/50 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">{isWish ? "Wish Preview" : "Live Preview"}</h2>

              <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setMode("video")}
                  className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                    mode === "video" ? "bg-indigo-600 text-white" : "text-gray-800"
                  }`}
                >
                  <Film className="h-4 w-4" />
                  Video 9:16
                </button>
                <button
                  type="button"
                  onClick={() => setMode("image")}
                  className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                    mode === "image" ? "bg-indigo-600 text-white" : "text-gray-800"
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  Image 1:1
                </button>
              </div>
            </div>

            {/* Fancy preview frame with dynamic accent */}
            <div className={`rounded-xl overflow-hidden border bg-white relative`}>
              <div
                className={`pointer-events-none absolute inset-0 opacity-30 bg-gradient-to-tr ${meta.accent}`}
                aria-hidden
              />
              <div className="relative">
                {isVideo ? (
                  <Player
                    key={playerKey}
                    component={FestivalIntro}
                    autoPlay
                    loop
                    durationInFrames={paid ? 180 : 150}
                    fps={30}
                    compositionWidth={720}
                    compositionHeight={1280}
                    inputProps={{
                      title,
                      names,
                      date,
                      venue,
                      bg: bgForPlayer,
                      music: musicForPlayer,
                      musicVolume,
                      tier: paid ? "hd" : "free",
                      watermark: !paid,
                      // new anti-crop hints (composition may choose to use them)
                      watermarkStrategy: !paid ? wmStrategy : "ribbon",
                      wmSeed,
                      wmText,
                      wmOpacity,
                      isWish,
                    }}
                    acknowledgeRemotionLicense
                    style={{ width: "100%", height: 520, background: "transparent" }}
                  />
                ) : (
                  <Player
                    key={playerKey}
                    component={ImageCard}
                    autoPlay
                    loop
                    durationInFrames={120}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1080}
                    inputProps={{
                      title,
                      names,
                      date,
                      venue,
                      bg: bgForPlayer,
                      tier: paid ? "hd" : "free",
                      watermark: !paid,
                      watermarkStrategy: !paid ? wmStrategy : "ribbon",
                      wmSeed,
                      wmText,
                      wmOpacity,
                      isWish,
                    }}
                    acknowledgeRemotionLicense
                    style={{ width: "100%", height: 520, background: "transparent" }}
                  />
                )}
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-700">
              Free preview shows an anti-crop watermark. HD removes it and adds premium effects.
            </p>
            {/* tiny badge while swapping assets */}
            {(bgStatus==="loading" || musicStatus==="loading") && (
              <span className="absolute right-3 top-3 rounded-full bg-black/60 text-white px-2 py-0.5 text-xs">
                Updating preview…
              </span>
            )}  
          </section>
        </div>
      </main>
    </>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={null /* or a fancy loader */}>
      <BuilderPageInner />
    </Suspense>
  );
}
