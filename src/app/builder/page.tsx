/**
 * Builder: modern compact UI - festive polish, collapsible steps, sticky preview,
 * mobile bottom action bar, smart sharing, payments, export, captions, merge, studio.
 */
"use client";
export const dynamic = "force-dynamic";

import { loadRazorpay } from "@/lib/loadRazorpay";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
  JSX,
  MutableRefObject,
} from "react";
import { z } from "zod";
import { Player } from "@remotion/player";
import { motion, useReducedMotion } from "framer-motion";
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
  Tag,
  Palette,
  Wand2,
} from "lucide-react";

// import DecorativeBG from "@/components/DecorativeBG";
import { FestivalIntro } from "@/remotion/FestivalIntro";
import { ImageCard } from "@/remotion/ImageCard";
import { templates } from "@/templates";
import { copy, getDefaults, type Lang } from "@/i18n/packs";
import {
  bgForTemplate,
  defaultMusicByTemplate,
  curatedTracks,
  curatedMap,
} from "@/lib/media-presets";
import { usePreloadImage, usePreloadAudio } from "@/lib/use-asset-preload";
import { nextFestival } from "@/lib/festivals";
import { MAX_PARALLEL_RENDERS } from "@/lib/env";

import NextDynamic from "next/dynamic";

// ─────────────────────────────────────────────────────────────────────────
// Global counter – lives on the window object so every tab shares it
// ─────────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    __activeRenders?: number;
  }
}

if (typeof window !== "undefined") {
  // Protect against “undefined → NaN” if the module runs twice in bfcache
  window.__activeRenders = window.__activeRenders ?? 0;
}

// if (typeof window !== "undefined" && window.__activeRenders == null) {
//   window.__activeRenders = 0; // initialise once
// }

function MobileBG() {
  // Fixed, behind everything, very light on mobile to avoid “white plates”
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 isolate"
    >
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(255,193,7,0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_110%_20%,rgba(244,67,54,0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(700px_500px_at_-10%_110%,rgba(103,58,183,0.10),transparent_60%)]" />
    </div>
  );
}

const MergeNames = NextDynamic(() => import("@/components/MergeNames"), {
  ssr: false,
});
const CaptionsPanel = NextDynamic(() => import("@/components/CaptionsPanel"), {
  ssr: false,
});
const SocialPreviewStudio = NextDynamic(
  () => import("@/components/SocialPreviewStudio"),
  { ssr: false }
);

type ExportPreset = "free" | "hd" | "status" | "gif";

/* --------------------------------------------- */
/* Small UI helpers                               */
/* --------------------------------------------- */
function Card(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={
        "isolate rounded-2xl border border-white/60 bg-white/90 supports-[backdrop-filter]:md:backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] " +
        (props.className || "")
      }
    >
      {props.children}
    </div>
  );
}

function Section({
  id,
  icon,
  title,
  defaultOpen = true,
  children,
}: PropsWithChildren<{
  id: string;
  icon: JSX.Element;
  title: string;
  defaultOpen?: boolean;
}>) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-2xl border border-white/60 bg-white/95 supports-[backdrop-filter]:md:backdrop-blur-xl scroll-mt-24"
    >
      <summary className="list-none select-none cursor-pointer px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-400 to-fuchsia-500 text-white shadow-sm">
            {icon}
          </div>
          <h3 className="font-display text-[15px] sm:text-base">{title}</h3>
        </div>
        <Sparkles className="h-5 w-5 text-amber-500 opacity-0 transition-opacity duration-300 group-open:opacity-100" />
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

function AnchorButton({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`text-sm rounded-xl px-3 py-2 inline-flex items-center justify-center transition-all ${
        active
          ? "bg-ink-900 text-white"
          : "bg-white/90 text-ink-800 hover:bg-white"
      } border border-white/60 shadow-sm`}
    >
      {label}
    </a>
  );
}

/* --------------------------------------------- */
/* Query helper - no useSearchParams required    */
/* --------------------------------------------- */
function useQueryParam(name: string) {
  const getNow = () =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get(name) || ""
      : "";

  const [val, setVal] = useState(getNow);

  useEffect(() => {
    const handler = () => setVal(getNow());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [name]);

  return val;
}

/* --------------------------------------------- */
/* Pointer + viewport helpers                     */
/* --------------------------------------------- */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if ("matchMedia" in window) {
      setFine(window.matchMedia("(pointer:fine)").matches);
    }
  }, []);
  return fine;
}

function useInViewport<T extends Element>(
  ref: MutableRefObject<T | null>,
  rootMargin = "0px"
) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!ref.current || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setInView(!!e?.isIntersecting);
      },
      { root: null, rootMargin, threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/* --------------------------------------------- */
/* Festival → Template preselect map             */
/* --------------------------------------------- */
const FESTIVAL_TO_TEMPLATE: Record<string, string> = {
  diwali: "diwali",
  "chhath-puja": "chhath", // ← fix here
  "guru-nanak-jayanti": "guru-nanak",
  christmas: "christmas",
  "new-year": "new-year",
  lohri: "lohri",
  "makar-sankranti": "sankranti",
  pongal: "pongal",
  "republic-day": "republic-day",
  "durga-puja": "durga-puja",

  /* ❌ you no longer need this alias –
     keeping it just creates two entries that map to the same template
     and invites mistakes later.  */
  // chhath: "chhath",

  baisakhi: "baisakhi",
  vishu: "vishu",
};

/** Wish-only slugs */
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

function schemaFor(slug: string) {
  if (WISH_SLUGS.has(slug)) return baseSchema;
  return baseSchema
    .extend({
      names: z.string().min(1, "Who is hosting?"),
      date: z.string().min(1, "Date required"),
    })
    .required();
}

type Mode = "video" | "image";
type TrackId = (typeof curatedTracks)[number]["id"];

/* --------------------------------------------- */
/* File + share utils                            */
/* --------------------------------------------- */
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
  setTimeout(() => window.open(url, "_blank", "noopener"), 600);
}

async function safeDownload(url: string, filename: string) {
  try {
    const res = await fetch(url, { cache: "no-store", mode: "cors" });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch {
    // Fallback: open in a new tab (iOS Safari)
    window.open(url, "_blank", "noopener");
  }
}

async function copyToClipboard(txt: string) {
  try {
    await navigator.clipboard.writeText(txt);
    alert("Link copied!");
  } catch {}
}

function shareToWhatsApp(url: string, message = "Check this out!") {
  const shareText = `${message} ${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(wa, "_blank", "noopener");
}

function navigate(url: string) {
  if (typeof window !== "undefined") window.location.assign(url);
}
const isMp4 = (name: string) => name.toLowerCase().endsWith(".mp4");
const isGif = (name: string) => name.toLowerCase().endsWith(".gif");
const mimeFromName = (name: string) =>
  isMp4(name) ? "video/mp4" : isGif(name) ? "image/gif" : "image/png";

async function shareSmartFileOrLink(opts: {
  url: string;
  filename: string;
  mimeHint: string;
  preset?: ExportPreset | null;
}) {
  const { url, filename, mimeHint, preset } = opts;
  try {
    if (navigator.share) {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const type = blob.type || mimeHint;
      const file = new File([blob], filename, { type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Festival Invites",
          text:
            preset === "status"
              ? "Post this to your WhatsApp Status"
              : preset === "gif"
              ? "Share this festive GIF"
              : "Made with Festival Invites",
        });
        return true;
      }
      await navigator.share({
        url,
        title: "Festival Invites",
        text: "Made with Festival Invites",
      });
      return true;
    }
  } catch {}
  try {
    const msg =
      preset === "status"
        ? "Here is my invite. Post it to your WhatsApp Status:"
        : "Check out my invite:";
    const wa = `https://wa.me/?text=${encodeURIComponent(`${msg} ${url}`)}`;
    window.open(wa, "_blank", "noopener");
    return true;
  } catch {}
  await copyToClipboard(url);
  alert("Link copied!");
  return false;
}

function shortId(len = 8) {
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const dict = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (const b of bytes) out += dict[b % dict.length];
  return out;
}

/* --------------------------------------------- */
/* Inner page                                    */
/* --------------------------------------------- */
function BuilderPageInner() {
  const prefersReducedMotion = useReducedMotion();
  const finePointer = useFinePointer();

  const festivalSlugQP =
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search)
          .get("festival")
          ?.toLowerCase() ?? "";

  const directTemplateQP = useQueryParam("template");

  const mappedFromFestival = festivalSlugQP
    ? FESTIVAL_TO_TEMPLATE[festivalSlugQP]
    : "";
  const initialSlug = directTemplateQP || mappedFromFestival || "diwali";

  const [template, setTemplate] = useState(initialSlug);
  const [language, setLanguage] = useState<Lang>("en");

  const selectedFestival = useMemo(
    () => (festivalSlugQP ? festivalSlugQP : ""),
    [festivalSlugQP]
  );

  const festivalSlugForDate = selectedFestival || template;
  const nf = useMemo(
    () => nextFestival(festivalSlugForDate),
    [festivalSlugForDate]
  );
  const nfDate = useMemo(
    () => (nf ? new Date(nf.date_iso + "T00:00:00.000Z") : null),
    [nf]
  );

  const defaultsRef = useRef(getDefaults(initialSlug, "en"));
  const [names, setNames] = useState(defaultsRef.current.names);
  const [title, setTitle] = useState(defaultsRef.current.title);
  const [date, setDate] = useState(defaultsRef.current.date);
  const [venue, setVenue] = useState(defaultsRef.current.venue);

  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerOrg, setOwnerOrg] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("video");

  const [paid, setPaid] = useState(false);
  const [exportingWhich, setExportingWhich] = useState<null | "free" | "hd">(
    null
  );
  const exporting = exportingWhich !== null;

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("invite.mp4");
  const hasOutput = !!downloadUrl;

  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [lastPreset, setLastPreset] = useState<ExportPreset | null>(null);

  const [inviteId] = useState<string>(() => shortId(8));

  const meta = useMemo(
    () => templates.find((t) => t.slug === template) ?? templates[0],
    [template]
  );
  const isVideo = mode === "video";
  const isWish = WISH_SLUGS.has(template);

  const [customBgDataUrl, setCustomBgDataUrl] = useState<string | null>(null);
  const defaultBgPath = bgForTemplate(template);
  const bgCandidate = customBgDataUrl ?? defaultBgPath;

  const autoPreset = defaultMusicByTemplate[template] ?? {
    file: "",
    label: "",
    volume: 0.8,
  };
  const [trackId, setTrackId] = useState<TrackId>("auto");
  const [customMusic, setCustomMusic] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState<number>(autoPreset.volume);
  const musicFromCurated = curatedMap[trackId] || "";
  const musicCandidate =
    customMusic ??
    (trackId === "auto"
      ? autoPreset.file
      : trackId === "none"
      ? null
      : musicFromCurated);

  const { readyUrl: bgReadyUrl, status: bgStatus } =
    usePreloadImage(bgCandidate);
  const { readyUrl: musicReadyUrl, status: musicStatus } =
    usePreloadAudio(musicCandidate);
  // ----------------------------------------------------------------
  // Gracefully ignore a missing / 404 asset so the render still works
  // ----------------------------------------------------------------
  const bgForPlayer: string | undefined =
    bgStatus === "error" ? undefined : bgReadyUrl ?? undefined;

  const musicForPlayer: string | undefined =
    musicStatus === "error" ? undefined : musicReadyUrl ?? undefined;

  const playerKey = `${mode}-${template}-${bgForPlayer ?? "noBg"}-${
    musicForPlayer ?? "noMusic"
  }-${paid ? "hd" : "free"}`;

  const wmSeed = useMemo(
    () => Math.floor(Math.random() * 1e9),
    [template, language]
  );
  const wmText = "Festival Invites - FREE PREVIEW";
  const wmStrategy: "ribbon" | "tile" | "ribbon+tile" = "ribbon+tile";
  const wmOpacity = 0.18;
  const [renderPct, setRenderPct] = useState<number | null>(null);
  const [etaText, setEtaText] = useState<string | null>(null);

  // load Razorpay script in the background (do NOT disable the button until loaded)
  useEffect(() => {
    loadRazorpay().catch(() => {});
  }, []);

  const syncDefaults = (slug: string, lang: Lang) => {
    const next = getDefaults(slug, lang);
    const prev = defaultsRef.current;
    const same = (a: string, b: string) =>
      (a ?? "").trim() === (b ?? "").trim();
    if (same(title, prev.title)) setTitle(next.title);
    if (same(names ?? "", prev.names ?? "")) setNames(next.names ?? "");
    if (same(date ?? "", prev.date ?? "")) setDate(next.date ?? "");
    if (same(venue ?? "", prev.venue ?? "")) setVenue(next.venue ?? "");
    defaultsRef.current = next;
  };

  useEffect(() => {
    if (mappedFromFestival && mappedFromFestival !== template) {
      setTemplate(mappedFromFestival);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    const schema = schemaFor(template);
    const parsed = schema.safeParse({
      template,
      language,
      names,
      title,
      date,
      venue,
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        e[issue.path[0] as string] = issue.message;
      setErrors(e);
    } else setErrors({});
  }, [template, language, names, title, date, venue]);

  useEffect(() => {
    const bg = customBgDataUrl ?? bgForTemplate(template);
    if (!bg || bg.startsWith("data:")) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = bg.startsWith("/") ? bg : `/${bg}`;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [template, customBgDataUrl]);

  const handleShare = useCallback(async () => {
    if (publicUrl) {
      await shareSmartFileOrLink({
        url: publicUrl,
        filename: "invite.html",
        mimeHint: "text/html",
        preset: lastPreset,
      });
      return;
    }
    if (!downloadUrl) return;
    await shareSmartFileOrLink({
      url: downloadUrl,
      filename: downloadName,
      mimeHint: mimeFromName(downloadName),
      preset: lastPreset,
    });
  }, [publicUrl, downloadUrl, downloadName, lastPreset]);

  const [brandLogo, setBrandLogo] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");
  const [brandTagline, setBrandTagline] = useState<string>("");
  const [brandPrimary, setBrandPrimary] = useState<string>("#2563eb");
  const [brandSecondary, setBrandSecondary] = useState<string>("#a855f7");
  const [brandRibbon, setBrandRibbon] = useState<boolean>(true);
  const [brandEndCard, setBrandEndCard] = useState<boolean>(true);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [myBrands, setMyBrands] = useState<Array<{
    id: string;
    name: string;
  }> | null>(null);
  const [quickWishInFlight, setQuickWishInFlight] = useState(false);

  const [showSkeleton, setShowSkeleton] = useState(true);
  useEffect(() => {
    // Hide skeleton shortly after the player mounts/changes
    const t = setTimeout(() => setShowSkeleton(false), 350);
    return () => clearTimeout(t);
  }, [playerKey]);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((j) => {
        const items = (j.items || []).map((x: any) => ({
          id: x.id,
          name: x.name || "(untitled)",
        }));
        setMyBrands(items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // picked directly via ?template=…           ↴
    if (directTemplateQP && directTemplateQP !== template) {
      setTemplate(directTemplateQP);
      return; // ⬅ early-exit so festival logic below doesn’t overwrite it
    }

    // mapped via ?festival=… → FESTIVAL_TO_TEMPLATE
    if (mappedFromFestival && mappedFromFestival !== template) {
      setTemplate(mappedFromFestival);
    }
  }, [directTemplateQP, mappedFromFestival, template]);

  function handleContinue() {
    document
      .getElementById("preview")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* --------------------------------------------- */
  /* Payment + export                              */
  /* --------------------------------------------- */
  async function handlePayAndExport() {
    try {
      await loadRazorpay();
      if (!window.Razorpay)
        throw new Error("Payment is loading. Please try again in a moment.");

      const planId = isVideo ? "video_hd" : "image_hd";
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          inviteId,
          customer: { name: ownerName || "Guest" },
        }),
      });
      const { order, error, detail } = await orderRes.json();
      if (!orderRes.ok || !order?.id) {
        throw new Error(error || detail || "Order creation failed");
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.id,
        name: "Festival Invites",
        description: isVideo ? "HD Video Export" : "HD Image Export",
        theme: { color: "#2563EB" },
        prefill: { name: ownerName || "Guest" },
        method: "upi",
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
            },
            sequence: ["block.upi"],
            preferences: { show_default_blocks: false },
          },
        },
        upi: { flow: "intent" },
        handler: async (rsp: any) => {
          const vr = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: rsp.razorpay_order_id,
              razorpay_payment_id: rsp.razorpay_payment_id,
              razorpay_signature: rsp.razorpay_signature,
            }),
          });
          const j = await vr.json();
          if (!vr.ok || !j?.ok) {
            alert(j?.error || "Payment verification failed");
            return;
          }
          try {
            localStorage.setItem("lastPlan", isVideo ? "video_hd" : "image_hd");
          } catch {}
          setPaid(true);
          await doExportLambda("hd");
        },
      });

      rzp.on?.("payment.failed", (resp: any) => {
        alert(resp?.error?.description || "Payment failed");
      });

      rzp.open();
    } catch (e: any) {
      alert(e?.message || "Payment failed to start");
    }
  }

  async function doExportLambda(preset: ExportPreset) {
    //-----------------------------------------------------------------
    // 1)  Guard: refuse if the tab already runs too many parallel jobs
    //-----------------------------------------------------------------
    if (typeof window !== "undefined") {
      if ((window.__activeRenders ?? 0) >= MAX_PARALLEL_RENDERS) {
        alert(
          "Renderer is busy – please wait for the previous jobs to finish."
        );
        return;
      }
      window.__activeRenders! += 1;
    }

    // ---- UI init -------------------------------------------------------------
    setLastPreset(preset);
    setExportingWhich(preset === "free" || preset === "hd" ? preset : "free");
    setDownloadUrl(null);
    setPublicUrl(null);
    setRenderPct(0);
    setEtaText(null);

    // --- Lambda-safe assets -------------------------------------------------
    // If user uploaded an image, it's already a data: URL. Otherwise use bundle key.
    const bgLambdaSafe = customBgDataUrl
      ? customBgDataUrl
      : `assets/backgrounds/${template}.jpg`;

    // Music: custom upload stays data:, otherwise map curated/auto to bundle key
    const defaultTrackForTemplate =
      defaultMusicByTemplate[template]?.file || "";
    // Your curatedMap currently points to "assets/music/....mp3" (see section 4 below)
    const curatedPath = curatedMap[trackId] || defaultTrackForTemplate || "";
    const musicLambdaSafe =
      trackId === "none" ? null : customMusic || curatedPath || null;

    // ---- Composition & endpoint ---------------------------------------------
    const isVideoComposition = preset === "gif" ? true : isVideo;
    const compositionId: "festival-intro" | "image-card" = isVideoComposition
      ? "festival-intro"
      : "image-card";

    const endpoint =
      preset === "gif"
        ? "/api/lambda/gif"
        : preset === "status"
        ? "/api/lambda/status"
        : isVideoComposition
        ? "/api/lambda/queue"
        : "/api/lambda/still";

    // ---- Encoding presets ----------------------------------------------------
    const encoding =
      preset === "status"
        ? {
            width: 720,
            height: 1280,
            fps: 30,
            videoBitrateKbps: 2600,
            audioBitrateKbps: 96,
            maxDurationSeconds: 30,
          }
        : preset === "gif"
        ? {
            width: 540,
            height: 960,
            fps: 12,
            durationSeconds: 3.5,
          }
        : undefined;

    // Status (Lite) tweak
    const liteClicked =
      (document?.activeElement as HTMLElement | null)?.dataset?.lite === "1";
    if (preset === "status" && liteClicked && encoding) {
      encoding.videoBitrateKbps = 1600;
      encoding.audioBitrateKbps = 64;
    }

    // ---- Input props & watermark --------------------------------------------
    const isHd = preset === "hd";
    const tier = isHd ? "hd" : "free";
    const showWatermark = !isHd;
    const watermarkId = `wm_${Math.random().toString(36).slice(2, 8)}`;

    const inputProps: any = {
      title,
      names,
      date,
      venue,
      bg: bgLambdaSafe,
      music: musicLambdaSafe || undefined,
      musicVolume,
      tier,
      watermark: showWatermark,
      watermarkStrategy: showWatermark ? wmStrategy : "ribbon",
      wmSeed,
      wmText,
      wmOpacity,
      isWish,
      watermarkId,
      brand: {
        id: brandId || undefined,
        name: brandName || undefined,
        logoUrl: brandLogo || undefined,
        tagline: brandTagline || undefined,
        primary: brandPrimary || undefined,
        secondary: brandSecondary || undefined,
        ribbon: brandRibbon,
        endCard: brandEndCard,
      },
    };

    const payload: any = {
      compositionId,
      quality: preset,
      inputProps,
      encoding,
    };

    // Still images use a single frame + image format
    if (compositionId === "image-card" && preset !== "gif") {
      payload.frame = 60;
      payload.format = "png";
    }

    // ---- Queue render --------------------------------------------------------
    let queued: any;
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      queued = await r.json();
      if (!r.ok) throw new Error(queued?.error || "Queue error");
      if (!queued?.renderId || !queued?.bucketName) {
        throw new Error(queued?.error || "Queue response incomplete");
      }
    } catch (err: any) {
      console.error("QUEUE ERROR", err);
      alert(err?.message || "Queue error");
      setExportingWhich(null);
      setRenderPct(null);
      setEtaText(null);
      return;
    }

    // ---- Compute output key (single source of truth) -------------------------
    const extFromPreset =
      preset === "gif"
        ? "gif"
        : isVideoComposition
        ? "mp4"
        : (payload.format as "png" | "jpeg");
    let currentOutKey: string =
      queued?.outKey || `renders/${queued.renderId}/out.${extFromPreset}`;

    // ---- Helpers: presign / probe / progress --------------------------------
    async function presign(outKey: string) {
      // send both outKey and renderId+ext to be compatible with either route revision
      const url = `/api/lambda/file?bucketName=${encodeURIComponent(
        queued.bucketName
      )}&outKey=${encodeURIComponent(outKey)}&renderId=${encodeURIComponent(
        queued.renderId
      )}&ext=${encodeURIComponent(outKey.split(".").pop() || extFromPreset)}`;
      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok || !j?.url)
        throw new Error(j?.error || "Failed to presign URL");
      return j.url as string;
    }

    async function probe(outKey: string) {
      // send both outKey and renderId+ext to be compatible with either route revision
      const url = `/api/lambda/probe?bucketName=${encodeURIComponent(
        queued.bucketName
      )}&outKey=${encodeURIComponent(outKey)}&renderId=${encodeURIComponent(
        queued.renderId
      )}&ext=${encodeURIComponent(outKey.split(".").pop() || extFromPreset)}`;
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      // j = {exists:boolean, error?:string}
      return j as { exists?: boolean; error?: string };
    }

    async function getProgress() {
      const url = `/api/lambda/progress?renderId=${encodeURIComponent(
        queued.renderId
      )}&bucketName=${encodeURIComponent(
        queued.bucketName
      )}&functionName=${encodeURIComponent(queued.functionName || "")}`;
      const r = await fetch(url, { cache: "no-store" });
      if (r.status === 429) return { throttle: true } as const;
      const j = await r.json();
      return j as any;
    }

    // ---- Start with a signed URL for the current key -------------------------
    let signedUrl = await presign(currentOutKey);

    // ---- Polling -------------------------------------------------------------
    const isLongRender =
      isVideoComposition || preset === "gif" || preset === "status";

    // generous deadlines (ms)
    const DEADLINE_MS = isLongRender ? 12 * 60_000 : 6 * 60_000;
    const start = Date.now();

    // backoff state
    const BASE = 1100;
    let backoff = BASE;

    let finalUrl: string | null = null;

    try {
      if (isLongRender) {
        // video/gif → track progress
        while (Date.now() - start < DEADLINE_MS) {
          const prog = await getProgress();

          if ((prog as any)?.throttle) {
            await new Promise((r) => setTimeout(r, backoff));
            backoff = Math.min(backoff * 1.7, 8000);
            continue;
          }

          backoff = BASE;

          // live % + ETA
          if (
            typeof prog?.framesRendered === "number" &&
            typeof prog?.totalFrames === "number" &&
            prog.totalFrames > 0
          ) {
            const pct = Math.floor(
              (prog.framesRendered / prog.totalFrames) * 100
            );
            setRenderPct(pct);
            if (prog.timeToFinishInMilliseconds) {
              const ms = prog.timeToFinishInMilliseconds;
              const mins = Math.floor(ms / 60000);
              const secs = Math.round((ms % 60000) / 1000);
              setEtaText(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
            }
          }

          // backend may reveal the real outKey
          if (prog?.outKey && prog.outKey !== currentOutKey) {
            currentOutKey = prog.outKey;
            signedUrl = await presign(currentOutKey);
          }

          if (typeof prog?.error === "string") {
            if (prog.error.includes("Rate Exceeded")) {
              await new Promise((r) => setTimeout(r, backoff));
              backoff = Math.min(backoff * 1.7, 8000);
              continue;
            }
            throw new Error(prog.error);
          }

          if (Array.isArray(prog?.errors) && prog.errors.length) {
            throw new Error(prog.errors[0]?.message || "Render failed");
          }

          if (prog?.done) {
            finalUrl = signedUrl;
            break;
          }

          await new Promise((r) =>
            setTimeout(
              r,
              Math.max(900, Math.floor(backoff * 0.9 + Math.random() * 200))
            )
          );
        }
      } else {
        // still image → probe S3 for existence
        while (Date.now() - start < DEADLINE_MS) {
          const p = await probe(currentOutKey);

          if (p?.error?.includes("AccessDenied")) {
            throw new Error(
              "S3 AccessDenied on GetObject. Fix IAM to allow s3:GetObject on your bucket (e.g. arn:aws:s3:::<bucket>/*) for the credentials used by the server to presign."
            );
          }

          if (p?.exists) {
            finalUrl = signedUrl;
            break;
          }
          await new Promise((r) => {
            backoff = Math.min(backoff * 1.6, 15_000); // exponential, ≤ 15 s
            setTimeout(r, backoff);
          });
        }
      }
    } catch (err: any) {
      console.error("POLL ERROR", err);
      alert(err?.message || "Render failed");
      setExportingWhich(null);
      setRenderPct(null);
      setEtaText(null);
      return;
    }

    if (!finalUrl) {
      alert("Timed out waiting for render to finish");
      setExportingWhich(null);
      setRenderPct(null);
      setEtaText(null);
      return;
    }

    // ---- Success: download + share link upsert --------------------------------
    const extFromKey = (
      currentOutKey.split(".").pop() || extFromPreset
    ).toLowerCase();
    const filename =
      extFromKey === "gif"
        ? "invite.gif"
        : isVideoComposition
        ? "invite.mp4"
        : "invite.png";

    setDownloadUrl(finalUrl);
    setDownloadName(filename);
    safeDownload(finalUrl, filename);

    // Public link creation (non-blocking)
    try {
      const selectedFestivalSlug = selectedFestival || template;
      const builderTitle = title;
      const builderSubtitle = names || "";
      const previewStillUrl =
        compositionId === "image-card" && extFromKey !== "gif"
          ? finalUrl
          : undefined;

      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedFestivalSlug,
          title: builderTitle,
          subtitle: builderSubtitle,
          mediaUrl: finalUrl,
          ogImageUrl: previewStillUrl,
          theme: template,
          locale: language,
          owner: { name: ownerName || undefined, org: ownerOrg || null },
          props: {
            title,
            names,
            date,
            venue,
            bg: bgLambdaSafe,
            music: musicLambdaSafe || undefined,
            brand: {
              id: brandId || undefined,
              name: brandName || undefined,
              logoUrl: brandLogo || undefined,
              tagline: brandTagline || undefined,
              primary: brandPrimary || undefined,
              secondary: brandSecondary || undefined,
              ribbon: brandRibbon,
              endCard: brandEndCard,
            },
          },
          wishesEnabled: true,
        }),
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.url) {
        setPublicUrl(data.url);
        navigate(data.url);
      }
    } catch {
      // ignore
    } finally {
      //-----------------------------------------------------------------
      // 2)  Always decrement – even if the render fails
      //-----------------------------------------------------------------
      if (typeof window !== "undefined" && window.__activeRenders) {
        window.__activeRenders -= 1;
      }

      setExportingWhich(null);
      setRenderPct(null);
      setEtaText(null);
    }
  }

  const labels = copy[language].labels;
  const tierPreview: "free" | "hd" = paid ? "hd" : "free";

  /* --------------------------------------------- */
  /* Preview visibility + aspect                   */
  /* --------------------------------------------- */
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewInView = useInViewport(previewRef, "100px");
  const videoAspect = "aspect-[9/16]";
  const imageAspect = "aspect-[1/1]";

  /* --------------------------------------------- */
  /* UI                                            */
  /* --------------------------------------------- */
  return (
    <>
      <MobileBG />

      {/* Download toast */}
      {downloadUrl && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-3xl w-full rounded-2xl border border-white/50 bg-white/90 supports-[backdrop-filter]:md:backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-lime-400 text-white shadow">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-ink-900">
                  Your file is ready
                </div>
                <div className="text-ink-700">
                  If the download didn’t start, use the buttons.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => safeDownload(downloadUrl, downloadName)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
                {publicUrl ? "Copy public link" : "Share"}
              </button>
              <button
                type="button"
                onClick={() =>
                  shareToWhatsApp(
                    publicUrl || downloadUrl!,
                    "Here is my invite:"
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                title="WhatsApp"
              >
                <Link2 className="h-4 w-4" />
                WhatsApp
              </button>
              {!publicUrl ? null : (
                <button
                  type="button"
                  onClick={() => copyToClipboard(publicUrl)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                  title="Copy public link"
                >
                  <CopyIcon className="h-4 w-4" />
                  Copy link
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <main
        className="mx-auto max-w-7xl px-4 py-10 overscroll-y-contain isolate"
        style={{
          // bottom padding so the fixed mobile bar never overlaps content
          paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
          // modern mobile viewport units to prevent jumpy sticky areas
          minHeight: "100dvh",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-sm shadow-sm supports-[backdrop-filter]:md:backdrop-blur isolate">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="font-medium text-ink-700">
              Festive invite builder
            </span>
          </div>
          <h1 className="font-display mt-4 text-3xl sm:text-4xl leading-tight">
            Craft{" "}
            <span className="bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
              mind-blowing invites
            </span>{" "}
            in seconds
          </h1>
          <p className="text-ink-700 mt-2">
            Pick a template, personalize, add music, export and share.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {selectedFestival && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
                <Tag className="h-3.5 w-3.5" />
                Selected festival:{" "}
                <strong className="ml-1">{selectedFestival}</strong>
              </span>
            )}
            {nf && nfDate && (
              <span className="text-xs text-ink-700">
                Upcoming <span className="font-medium">{nf.name}</span>:{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                }).format(nfDate)}
              </span>
            )}
          </div>
        </motion.header>

        {/* Grid: Step nav / Form / Preview */}
        <div className="grid grid-cols-12 gap-6">
          {/* Step Nav - desktop */}
          <aside className="hidden xl:block col-span-2">
            <Card className="p-4 sticky top-6">
              <nav className="grid gap-2">
                <AnchorButton href="#s1" label="Occasion & Language" />
                <AnchorButton href="#s2" label="Details" />
                <AnchorButton href="#s3" label="Background" />
                <AnchorButton href="#s4" label="Music" />
                <AnchorButton href="#s5" label="Brand Kit" />
                <AnchorButton href="#s6" label="Captions & Batch" />
              </nav>
            </Card>
          </aside>

          {/* Form */}
          <section className="col-span-12 xl:col-span-6 space-y-4">
            {/* 1) Occasion & Language */}
            <Section
              id="s1"
              title="Occasion and language"
              icon={<Wand2 className="h-4 w-4" />}
              defaultOpen
            >
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
                      className={`pointer-events-none absolute inset-y-0 right-2 my-auto h-6 w-6 rounded-full bg-gradient-to-tr ${meta.accent} opacity-90 ring-1 ring-white/70`}
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
            </Section>

            {/* 2) Details */}
            <Section
              id="s2"
              title="Details"
              icon={<Tag className="h-4 w-4" />}
              defaultOpen
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1">
                    {labels.eventTitle}
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                    placeholder={
                      copy[language].defaults[template]?.title ?? "Event Title"
                    }
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-rose-600">{errors.title}</p>
                  )}
                </div>

                {!isWish && (
                  <>
                    <div>
                      <label className="block text-sm mb-1">
                        {labels.hosts}
                      </label>
                      <input
                        value={names}
                        onChange={(e) => setNames(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                        placeholder={
                          copy[language].defaults[template]?.names ?? "Hosts"
                        }
                      />
                      {errors.names && (
                        <p className="mt-1 text-sm text-rose-600">
                          {errors.names}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        {labels.dateTime}
                      </label>
                      <input
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                        placeholder={
                          copy[language].defaults[template]?.date ??
                          "Date and Time"
                        }
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-rose-600">
                          {errors.date}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm mb-1">
                        {labels.venue}
                      </label>
                      <input
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                        placeholder={
                          copy[language].defaults[template]?.venue ?? "Venue"
                        }
                      />
                    </div>
                  </>
                )}

                {/* Owner info for public page */}
                <div>
                  <label className="block text-sm mb-1">
                    Your name (public link)
                  </label>
                  <input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                    placeholder="e.g., Rahul Mehta"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Brand/Org (optional)
                  </label>
                  <input
                    value={ownerOrg}
                    onChange={(e) => setOwnerOrg(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                    placeholder="e.g., SkyLabs"
                  />
                </div>
              </div>
            </Section>

            {/* 3) Background */}
            <Section
              id="s3"
              title="Background"
              icon={<ImageIcon className="h-4 w-4" />}
              defaultOpen={false}
            >
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
            </Section>

            {/* 4) Music */}
            <Section
              id="s4"
              title="Music"
              icon={<Music2 className="h-4 w-4" />}
              defaultOpen={false}
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
                <div className="flex flex-wrap items-center gap-3">
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
                      onChange={(e) =>
                        setMusicVolume(parseFloat(e.target.value))
                      }
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
            </Section>

            {/* 5) Brand Kit */}
            <Section
              id="s5"
              title="Brand kit"
              icon={<Palette className="h-4 w-4" />}
              defaultOpen={false}
            >
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">
                      Brand/Company name
                    </label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                      placeholder="e.g., Botify"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      Tagline (optional)
                    </label>
                    <input
                      value={brandTagline}
                      onChange={(e) => setBrandTagline(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                      placeholder="e.g., Wishes from our team"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-[1fr_auto_auto] items-center gap-3">
                  <div>
                    <label className="block text-sm mb-1">Logo</label>
                    <input
                      value={brandLogo}
                      onChange={(e) => setBrandLogo(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                      placeholder="https://... or leave blank and upload"
                    />
                  </div>
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
                        setBrandLogo(data);
                      }}
                    />
                    Upload logo
                  </label>
                  <button
                    type="button"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    onClick={() => setBrandLogo("")}
                  >
                    Clear
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm">Primary</label>
                    <input
                      type="color"
                      value={brandPrimary}
                      onChange={(e) => setBrandPrimary(e.target.value)}
                    />
                    <input
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      value={brandPrimary}
                      onChange={(e) => setBrandPrimary(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm">Secondary</label>
                    <input
                      type="color"
                      value={brandSecondary}
                      onChange={(e) => setBrandSecondary(e.target.value)}
                    />
                    <input
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      value={brandSecondary}
                      onChange={(e) => setBrandSecondary(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={brandRibbon}
                      onChange={(e) => setBrandRibbon(e.target.checked)}
                    />
                    Show corner ribbon/logo
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={brandEndCard}
                      onChange={(e) => setBrandEndCard(e.target.checked)}
                    />
                    Add branded end-card
                  </label>
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-sm"
                    onClick={async () => {
                      const r = await fetch("/api/brands", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: brandId || undefined,
                          name: brandName,
                          logoUrl: brandLogo || undefined,
                          tagline: brandTagline || undefined,
                          primary: brandPrimary,
                          secondary: brandSecondary || undefined,
                          ribbon: brandRibbon,
                          endCard: brandEndCard,
                        }),
                      });
                      const j = await r.json();
                      if (r.ok && j.id) {
                        setBrandId(j.id);
                        alert("Brand saved");
                        fetch("/api/brands")
                          .then((r) => r.json())
                          .then((j) => {
                            const items = (j.items || []).map((x: any) => ({
                              id: x.id,
                              name: x.name || "(untitled)",
                            }));
                            setMyBrands(items);
                          })
                          .catch(() => {});
                      } else {
                        alert(j?.error || "Failed to save brand");
                      }
                    }}
                  >
                    {brandId ? "Update brand" : "Save brand"}
                  </button>

                  {myBrands && myBrands.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Apply saved:
                      </span>
                      <select
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                        onChange={async (e) => {
                          const id = e.target.value;
                          if (!id) return;
                          const r = await fetch(`/api/brands/${id}`);
                          const j = await r.json();
                          if (r.ok && j.item) {
                            const b = j.item;
                            setBrandId(b.id);
                            setBrandName(b.name || "");
                            setBrandTagline(b.tagline || "");
                            setBrandLogo(b.logoUrl || "");
                            setBrandPrimary(b.primary || "#2563eb");
                            setBrandSecondary(b.secondary || "#a855f7");
                            setBrandRibbon(!!b.ribbon);
                            setBrandEndCard(!!b.endCard);
                          }
                        }}
                      >
                        <option value="">Select</option>
                        {myBrands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* 6) Captions + Batch */}
            <Section
              id="s6"
              title="Captions and batch"
              icon={<Sparkles className="h-4 w-4" />}
              defaultOpen={false}
            >
              <CaptionsPanel
                templateSlug={template}
                lang={language}
                title={title}
                names={names}
                date={date}
                venue={venue}
              />
              <div className="mt-4">
                <MergeNames
                  templateSlug={template}
                  baseTitle={title}
                  baseNames={names}
                  baseDate={date}
                  baseVenue={venue}
                  bg={bgForPlayer}
                  isWish={isWish}
                />
              </div>
            </Section>

            {/* Actions */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium shadow hover:bg-emerald-700"
                  onClick={async () => {
                    try {
                      setQuickWishInFlight(true);
                      setMode("image");
                      await doExportLambda("free");
                      alert("Instant image exported. Video render queued.");
                      setMode("video");
                      doExportLambda("status");
                    } finally {
                      setQuickWishInFlight(false);
                    }
                  }}
                  disabled={exporting || quickWishInFlight}
                  title="Instant PNG now + video in background"
                >
                  {quickWishInFlight
                    ? "Working…"
                    : "Quick Wish (Instant Image)"}
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
                  onClick={() => doExportLambda("free")}
                  disabled={exporting}
                  aria-label="Download free with watermark"
                  aria-busy={exportingWhich === "free"}
                  title="SD with robust watermark"
                >
                  {exportingWhich === "free" ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
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
                      {isVideo
                        ? "Download free (watermark)"
                        : "Download image (watermark)"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-4 py-2 text-white text-sm font-medium shadow hover:opacity-95"
                  onClick={() =>
                    paid ? doExportLambda("hd") : handlePayAndExport()
                  }
                  disabled={exporting}
                  aria-busy={exportingWhich === "hd"}
                  title="HD, no watermark, premium effects"
                  aria-label="Export HD without watermark"
                >
                  {exportingWhich === "hd" ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
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
                    <>Unlock HD</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  disabled={!hasOutput && !publicUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                  title={
                    publicUrl
                      ? "Copy public link"
                      : hasOutput
                      ? "Share your file"
                      : "Export first to share"
                  }
                >
                  <Share2 className="h-4 w-4" />
                  {publicUrl ? "Copy public link" : "Share"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    publicUrl
                      ? shareToWhatsApp(publicUrl, "Here is my invite:")
                      : hasOutput
                      ? shareToWhatsApp(downloadUrl!, "Here is my invite:")
                      : null
                  }
                  disabled={!hasOutput && !publicUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                  title={
                    publicUrl
                      ? "Share link on WhatsApp"
                      : hasOutput
                      ? "Share file on WhatsApp"
                      : "Export first"
                  }
                >
                  <Link2 className="h-4 w-4" />
                  WhatsApp
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
                  onClick={() => {
                    setMode("video");
                    doExportLambda("status");
                  }}
                  disabled={exporting}
                  title="Export for WhatsApp Status (9:16, ~30s, compact)"
                >
                  <Download className="h-4 w-4" />
                  Export Status
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
                  onClick={() => {
                    setMode("video");
                    doExportLambda("status");
                  }}
                  onMouseDown={(e) => (e.currentTarget.dataset.lite = "1")}
                  title="Extra small MP4 for tough networks"
                >
                  Export Status (Lite)
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
                  onClick={() => {
                    setMode("video"); // GIF comes from the video composition
                    doExportLambda("gif");
                  }}
                  disabled={exporting}
                  title="Export short looping GIF"
                >
                  <ImageIcon className="h-4 w-4" />
                  Export GIF
                </button>

                <div className="text-sm text-gray-700 space-y-1">
                  <div>Free: SD with watermark</div>
                  <div>HD: No watermark, sharper, premium effects</div>
                </div>
              </div>

              {renderPct !== null && (
                <div className="mt-3 rounded-xl border border-gray-200 p-3 bg-white">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Rendering…</span>
                    <span>{etaText ? `ETA ${etaText}` : `${renderPct}%`}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${renderPct}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Need it now? Use <strong>Quick Wish</strong> to grab an
                    instant image.
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-gray-600">
                Tip: Use Export Status for the cleanest look on WhatsApp. If
                friends cannot play MP4, share the GIF.
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  Scroll to preview
                </button>
              </div>
            </Card>
          </section>

          {/* Preview */}
          <section id="preview" className="col-span-12 xl:col-span-4">
            <Card className="p-4 sticky top-[calc(env(safe-area-inset-top)+8px)] transform-gpu">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl">
                  {isWish ? "Wish preview" : "Live preview"}
                </h2>

                <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setMode("video")}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                      mode === "video"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-800"
                    }`}
                  >
                    <Film className="h-4 w-4" />
                    Video 9:16
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("image")}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                      mode === "image"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-800"
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Image 1:1
                  </button>
                </div>
              </div>

              <div
                ref={previewRef}
                className={`relative rounded-xl overflow-hidden border bg-white shadow-sm ${
                  mode === "video" ? "aspect-[9/16]" : "aspect-[1/1]"
                } max-h-[80dvh]`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 sm:opacity-25 opacity-10 bg-gradient-to-tr ${meta.accent}`}
                  aria-hidden
                />

                <div className="relative w-full h-full">
                  {previewInView ? (
                    mode === "video" ? (
                      <Player
                        key={playerKey}
                        component={FestivalIntro}
                        autoPlay={!prefersReducedMotion}
                        loop
                        controls={finePointer}
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
                          watermarkStrategy: !paid ? wmStrategy : "ribbon",
                          wmSeed,
                          wmText,
                          wmOpacity,
                          isWish,
                        }}
                        acknowledgeRemotionLicense
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "transparent",
                        }}
                      />
                    ) : (
                      // ✅ Use the ImageCard composition instead of long GET URLs
                      <Player
                        key={playerKey}
                        component={ImageCard}
                        autoPlay={!prefersReducedMotion}
                        loop
                        controls={false}
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
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "transparent",
                        }}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="rounded-lg border bg-white/90 px-3 py-1 text-xs text-ink-800">
                        Preview paused to save battery
                      </div>
                    </div>
                  )}
                </div>

                {showSkeleton && (
                  <div className="absolute inset-0 animate-pulse bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.02))]">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/70 shadow" />
                  </div>
                )}

                {(bgStatus === "loading" || musicStatus === "loading") && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/60 text-white px-2 py-0.5 text-xs">
                    Updating preview…
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-gray-700">
                Free preview shows an anti-crop watermark. HD removes it and
                adds premium effects.
              </p>

              {downloadUrl && downloadName.endsWith(".png") && (
                <div className="mt-4">
                  <SocialPreviewStudio
                    src={downloadUrl}
                    overlayTitle={undefined}
                  />
                </div>
              )}
            </Card>
          </section>
        </div>
      </main>

      {/* Mobile action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-white/60 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] px-2 py-1.5 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => doExportLambda("free")}
            disabled={exporting}
            className="text-[13px] px-3 py-2 rounded-lg border border-gray-300"
            aria-label="Free export"
          >
            Free
          </button>
          <button
            onClick={() => (paid ? doExportLambda("hd") : handlePayAndExport())}
            disabled={exporting}
            className="text-[13px] px-3 py-2 rounded-lg bg-indigo-600 text-white"
            aria-label="HD export"
          >
            {paid ? "Export HD" : "Unlock HD"}
          </button>
          <button
            onClick={() => {
              setMode("video");
              doExportLambda("status");
            }}
            disabled={exporting}
            className="text-[13px] px-3 py-2 rounded-lg border border-gray-300"
            aria-label="Status"
          >
            Status
          </button>
          <button
            onClick={handleShare}
            disabled={!hasOutput && !publicUrl}
            className="text-[13px] px-3 py-2 rounded-lg border border-gray-300"
            aria-label="Share"
          >
            Share
          </button>
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------- */
/* Page wrapper for Suspense                     */
/* --------------------------------------------- */
export default function BuilderPage() {
  return (
    <Suspense fallback={null}>
      <BuilderPageInner />
    </Suspense>
  );
}
