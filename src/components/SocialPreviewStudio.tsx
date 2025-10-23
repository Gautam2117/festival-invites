// src/components/SocialPreviewStudio.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  MutableRefObject,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ---------------------------------- Sizes --------------------------------- */
type Size = {
  w: number;
  h: number;
  label: string;
  filename: string;
  note?: string;
};
const SIZES: Size[] = [
  { w: 1080, h: 1920, label: "Status / Story (9:16)", filename: "social-9x16" },
  { w: 1080, h: 1080, label: "Reel Cover / Feed (1:1)", filename: "social-1x1" },
  {
    w: 1080,
    h: 1350,
    label: "Feed Portrait (4:5)",
    filename: "social-4x5",
    note: "Instagram max feed height",
  },
  { w: 1920, h: 1080, label: "Landscape (16:9)", filename: "social-16x9" },
];

/* --------------------------------- Helpers -------------------------------- */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  focalX = 0.5,
  focalY = 0.5
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const r = Math.max(W / iw, H / ih);
  const dw = iw * r;
  const dh = ih * r;

  const cx = W * focalX;
  const cy = H * focalY;

  let dx = cx - dw * focalX;
  let dy = cy - dh * focalY;

  dx = Math.min(0, Math.max(W - dw, dx));
  dy = Math.min(0, Math.max(H - dh, dy));

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const min = Math.min(w, h) / 2;
  const rad = Math.min(r, min);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ratioName(s: Size) {
  const r = Number((s.w / s.h).toFixed(3));
  if (r === Number((9 / 16).toFixed(3))) return "9:16";
  if (r === 1) return "1:1";
  if (r === Number((4 / 5).toFixed(3))) return "4:5";
  if (r === Number((16 / 9).toFixed(3))) return "16:9";
  return "";
}

/* ------------------------------ useMeasure hook --------------------------- */
function useMeasure<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size } as const;
}

/* ------------------------------ Props & Component ------------------------- */
type Props = {
  /** Source image (prefer OG cover or still export). Can be data: URL or absolute/relative URL. */
  src?: string | null;
  /** Optional title chip to overlay (tiny); omit for clean crops */
  overlayTitle?: string;
  /** Default focal point (0..1), where 0.5,0.5 centers */
  focal?: { x: number; y: number };
  className?: string;
};

export default function SocialPreviewStudio({
  src,
  overlayTitle,
  focal = { x: 0.5, y: 0.5 },
  className,
}: Props) {
  const prefersReduced = !!useReducedMotion();

  // Image + state
  const [imageUrl, setImageUrl] = useState<string | null>(src ?? null);
  const [imgReady, setImgReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Export format
  const [fmt, setFmt] = useState<"png" | "jpg">("png");
  const [jpgQuality, setJpgQuality] = useState(0.92);

  // Focal point
  const [fp, setFp] = useState<{ x: number; y: number }>(focal);
  useEffect(() => setFp(focal), [focal.x, focal.y]);

  // Safe guides
  const [showGuides, setShowGuides] = useState(true);

  // Refs
  const dragRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Persist focal per image (nice for back/forward)
  useEffect(() => {
    if (!imageUrl) return;
    const key = `sps:focal:${imageUrl}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const v = JSON.parse(saved);
        if (typeof v?.x === "number" && typeof v?.y === "number") setFp(v);
      } catch {}
    }
  }, [imageUrl]);
  useEffect(() => {
    if (!imageUrl) return;
    const key = `sps:focal:${imageUrl}`;
    try {
      localStorage.setItem(key, JSON.stringify(fp));
    } catch {}
  }, [imageUrl, fp]);

  // Keep in sync if parent changes src
  useEffect(() => {
    if (src) {
      setImageUrl(src);
      setImgReady(false);
      setErr(null);
    }
  }, [src]);

  const canRender = !!imageUrl && imgReady;

  const handleFile = async (file: File) => {
    setErr(null);
    setImgReady(false);
    try {
      const reader = new FileReader();
      const p = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const data = await p;
      setImageUrl(data);
    } catch {
      setErr("Failed to read file");
    }
  };

  /* ------------------------------ Rendering -------------------------------- */

  const renderOne = useCallback(
    async (size: Size): Promise<Blob | null> => {
      if (!imgRef.current || !canRender) return null;

      const { w, h } = size;
      const canvas = document.createElement("canvas");

      // Export @ devicePixelRatio for crispness (capped for memory)
      const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Scale context so we can draw using "CSS pixels"
      ctx.scale(dpr, dpr);
      drawCover(ctx, imgRef.current, w, h, fp.x, fp.y);

      // Optional overlay title
      if (overlayTitle?.trim()) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 12;

        const paddingX = 18;
        const paddingY = 12;
        const text = overlayTitle.trim();

        // Responsive chip: font relative to min side
        const base = Math.max(24, Math.min(42, Math.floor(Math.min(w, h) * 0.032)));
        ctx.font = `600 ${base}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
        const metrics = ctx.measureText(text);
        const tw = metrics.width;
        const th = base;

        const rx = w - tw - paddingX * 2 - 28;
        const ry = 24;

        ctx.fillStyle = "rgba(255,255,255,0.18)";
        roundRect(ctx, rx, ry, tw + paddingX * 2, th + paddingY, 14);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1;
        roundRect(ctx, rx, ry, tw + paddingX * 2, th + paddingY, 14);
        ctx.stroke();

        // glossy line
        const grad = ctx.createLinearGradient(rx, ry, rx, ry + th + paddingY);
        grad.addColorStop(0, "rgba(255,255,255,0.35)");
        grad.addColorStop(1, "rgba(255,255,255,0.0)");
        ctx.fillStyle = grad;
        roundRect(ctx, rx, ry, tw + paddingX * 2, 8, 14);
        ctx.fill();

        // text
        ctx.fillStyle = "#111";
        ctx.fillText(text, rx + paddingX, ry + paddingY - 6 + th * 0.82);
        ctx.restore();
      }

      const type = fmt === "png" ? "image/png" : "image/jpeg";
      const quality = fmt === "png" ? undefined : jpgQuality;

      return await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob((b) => resolve(b), type, quality);
        } catch {
          resolve(null);
        }
      });
    },
    [canRender, fp.x, fp.y, fmt, jpgQuality, overlayTitle]
  );

  const handleDownloadOne = useCallback(
    async (size: Size) => {
      if (!canRender) return;
      setBusy(true);
      setErr(null);
      try {
        const blob = await renderOne(size);
        if (!blob) {
          setErr(
            "Couldn’t export. If your image is from another domain, download it first and re-upload here (CORS)."
          );
          return;
        }
        await downloadBlob(blob, `${size.filename}.${fmt}`);
      } catch {
        setErr("Download failed");
      } finally {
        setBusy(false);
      }
    },
    [canRender, fmt, renderOne]
  );

  const handleDownloadAllZip = useCallback(async () => {
    if (!canRender) return;
    setBusy(true);
    setErr(null);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      for (const s of SIZES) {
        const blob = await renderOne(s);
        if (blob) zip.file(`${s.filename}.${fmt}`, blob);
      }

      const out = await zip.generateAsync({ type: "blob" });
      await downloadBlob(out, `social-previews-${Date.now()}.zip`);
    } catch {
      setErr("Batch download failed");
    } finally {
      setBusy(false);
    }
  }, [canRender, fmt, renderOne]);

  /* ---------------------------- Interactive focal -------------------------- */

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFp({
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    });
  };

  const onKeyFocal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      setFp((p) => {
        const nx =
          e.key === "ArrowLeft" ? p.x - step : e.key === "ArrowRight" ? p.x + step : p.x;
        const ny =
          e.key === "ArrowUp" ? p.y - step : e.key === "ArrowDown" ? p.y + step : p.y;
        return { x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)) };
      });
    }
  };

  /* --------------------------------- UI ----------------------------------- */

  return (
    <section
      className={
        className ??
        "mt-8 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.10)] backdrop-blur-2xl"
      }
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-2.5 py-1 text-xs text-ink-800 backdrop-blur dark:border-white/20 dark:bg-zinc-900/60 dark:text-zinc-100">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Social preview studio
          </div>
          <h3 className="font-display mt-2 text-xl">Crop once, export everywhere</h3>
          <p className="text-sm text-ink-700 dark:text-zinc-300">
            Drag or use arrow keys to set the focal point. Download any size or everything
            as a ZIP.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Replace image */}
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-900 shadow-sm hover:bg-white dark:border-white/20 dark:bg-zinc-900/70 dark:text-zinc-50">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await handleFile(f);
              }}
              aria-label="Choose an image"
            />
            Replace image
          </label>

          {/* Format */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-2 py-1.5 text-sm text-ink-900 shadow-sm dark:border-white/20 dark:bg-zinc-900/70 dark:text-zinc-50">
            <span className="text-xs opacity-70">Format</span>
            <select
              value={fmt}
              onChange={(e) => setFmt(e.target.value as "png" | "jpg")}
              className="rounded-md border border-ink-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-950"
              aria-label="Export format"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            {fmt === "jpg" && (
              <>
                <span className="text-xs opacity-70">Quality</span>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={jpgQuality}
                  onChange={(e) => setJpgQuality(parseFloat(e.target.value))}
                  aria-label="JPG quality"
                />
              </>
            )}
          </div>

          {/* Guides toggle */}
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            className="rounded-xl border border-ink-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-900 shadow-sm hover:bg-white dark:border-white/20 dark:bg-zinc-900/70 dark:text-zinc-50"
            title="Toggle safe area guides"
          >
            {showGuides ? "Hide guides" : "Show guides"}
          </button>

          {/* Download all */}
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={!canRender || busy}
            className="rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
            title="Generate a ZIP with all sizes"
          >
            {busy ? "Preparing…" : "Download all (ZIP)"}
          </button>
        </div>
      </div>

      {err ? <p className="mb-3 text-sm text-rose-600">{err}</p> : null}

      {!imageUrl ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white/70 p-10 text-center dark:border-white/10 dark:bg-zinc-900/50">
          <p className="text-sm text-ink-700 dark:text-zinc-300">
            Pick an image (OG cover or still export) to generate social crops.
          </p>
        </div>
      ) : (
        <>
          {/* Hidden loader img */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            crossOrigin="anonymous"
            alt=""
            className="hidden"
            onLoad={() => setImgReady(true)}
            onError={() => {
              setErr("Failed to load image (CORS or network). Try downloading the image and re-uploading.");
              setImgReady(false);
            }}
          />

          {/* Skeleton while loading */}
          {!imgReady ? (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="aspect-[9/16] w-full animate-pulse rounded-2xl bg-ink-200/50" />
              <div className="h-40 w-full animate-pulse rounded-2xl bg-ink-200/50" />
            </div>
          ) : (
            <>
              {/* Master interactive preview + fine-tune */}
              <div className="mb-5 grid gap-4 md:grid-cols-[1fr_1fr]">
                <InteractiveFrame
                  imgRef={imgRef}
                  fp={fp}
                  setFp={setFp}
                  showGuides={showGuides}
                  onDrag={onDrag}
                  onKeyFocal={onKeyFocal}
                  dragRef={dragRef}
                  prefersReduced={prefersReduced}
                />
                <FineTune fp={fp} setFp={setFp} />
              </div>

              {/* Outputs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SIZES.map((s) => (
                  <PreviewCard
                    key={s.label}
                    size={s}
                    imgRef={imgRef}
                    focal={fp}
                    showGuides={showGuides}
                    busy={busy}
                    canRender={canRender}
                    onDownload={() => handleDownloadOne(s)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

/* ------------------------------ Subcomponents ----------------------------- */

function InteractiveFrame({
  imgRef,
  fp,
  setFp,
  showGuides,
  onDrag,
  onKeyFocal,
  dragRef,
  prefersReduced,
}: {
  imgRef: MutableRefObject<HTMLImageElement | null>;
  fp: { x: number; y: number };
  setFp: (p: { x: number; y: number }) => void;
  showGuides: boolean;
  onDrag: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyFocal: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  dragRef: MutableRefObject<HTMLDivElement | null>;
  prefersReduced: boolean;
}) {
  // Make canvas fill container responsively at 9:16
  const { ref: containerRef, size } = useMeasure<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw when size/focal/image changes
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const wrap = containerRef.current;
    if (!img || !canvas || !wrap) return;

    const cssW = Math.max(240, Math.round(wrap.clientWidth));
    const cssH = Math.round((cssW * 16) / 9);

    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    drawCover(ctx, img, cssW, cssH, fp.x, fp.y);
  }, [imgRef, fp.x, fp.y, containerRef, size.width]);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/85 p-3 shadow-sm dark:border-white/20 dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Master focal area (interactive)</div>
        <span className="text-xs text-ink-700 dark:text-zinc-300">Drag or use arrow keys</span>
      </div>

      <div
        ref={(node) => {
          dragRef.current = node;
          containerRef.current = node;
        }}
        className="relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-xl border bg-black/80 outline-none"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          onDrag(e);
        }}
        onPointerMove={(e) => {
          if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) onDrag(e);
        }}
        onDoubleClick={() => setFp({ x: 0.5, y: 0.5 })}
        onKeyDown={onKeyFocal}
        tabIndex={0}
        role="slider"
        aria-label="Focal point"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fp.x * 100)}
      >
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* Crosshair */}
        <motion.span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/90"
          style={{ left: `${fp.x * 100}%`, top: `${fp.y * 100}%` }}
          initial={prefersReduced ? false : { scale: 0.9, opacity: 0 }}
          animate={prefersReduced ? {} : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span className="absolute inset-1 rounded-full bg-white/80" />
        </motion.span>

        {/* Safe area guides */}
        {showGuides && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-[8%] h-[8%] bg-white/5" />
            <div className="absolute inset-x-0 bottom-[12%] h-[10%] bg-white/5" />
            <div className="absolute left-[5%] top-0 h-full w-[5%] bg-white/5" />
            <div className="absolute right-[5%] top-0 h-full w-[5%] bg-white/5" />
            <div className="absolute inset-0 border-2 border-white/30" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setFp({ x: 0.5, y: 0.5 })}
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 hover:bg-ink-50/60 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          Reset center
        </button>
        <div className="text-xs text-ink-700 dark:text-zinc-300">
          x: {(fp.x * 100).toFixed(0)}%, y: {(fp.y * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

function FineTune({
  fp,
  setFp,
}: {
  fp: { x: number; y: number };
  setFp: (p: { x: number; y: number }) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/85 p-3 shadow-sm dark:border-white/20 dark:bg-zinc-900/50">
      <div className="mb-2 text-sm font-medium">Fine-tune focal point</div>
      <div className="grid gap-3">
        <label className="inline-flex items-center gap-3">
          <span className="w-8 text-xs uppercase tracking-wide">X</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={fp.x}
            onChange={(e) => setFp({ ...fp, x: parseFloat(e.target.value) })}
            className="w-full"
            aria-label="Horizontal focal point"
          />
        </label>
        <label className="inline-flex items-center gap-3">
          <span className="w-8 text-xs uppercase tracking-wide">Y</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={fp.y}
            onChange={(e) => setFp({ ...fp, y: parseFloat(e.target.value) })}
            className="w-full"
            aria-label="Vertical focal point"
          />
        </label>

        <div className="rounded-lg border border-ink-200 bg-white p-2 text-xs text-ink-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
          Tip: Keep important faces/text inside the shaded rectangles for Stories.
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  size,
  imgRef,
  focal,
  showGuides,
  busy,
  canRender,
  onDownload,
}: {
  size: Size;
  imgRef: MutableRefObject<HTMLImageElement | null>;
  focal: { x: number; y: number };
  showGuides: boolean;
  busy: boolean;
  canRender: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 p-3 shadow-sm dark:border-white/20 dark:bg-zinc-900/60">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">
          {size.label}{" "}
          <span className="ml-1 rounded-full bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-700 ring-1 ring-ink-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/10">
            {ratioName(size)}
          </span>
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy || !canRender}
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm hover:bg-ink-50/60 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          aria-label={`Download ${size.label}`}
        >
          Download
        </button>
      </div>
      {size.note && <div className="mb-2 text-xs text-ink-700 dark:text-zinc-300">{size.note}</div>}
      <PreviewCanvas imgRef={imgRef} size={size} focal={focal} showGuides={showGuides} />
    </div>
  );
}

/* ---------------------------- Preview canvases ---------------------------- */

function PreviewCanvas({
  imgRef,
  size,
  focal,
  showGuides,
}: {
  imgRef: MutableRefObject<HTMLImageElement | null>;
  size: Size;
  focal: { x: number; y: number };
  showGuides: boolean;
}) {
  const { ref: wrapRef, size: wrapSize } = useMeasure<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!img || !canvas || !wrap) return;

    // Fit canvas width to container; compute height by aspect ratio
    const cssW = Math.max(160, Math.round(wrap.clientWidth));
    const cssH = Math.max(160, Math.round((cssW * size.h) / size.w));

    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    drawCover(ctx, img, cssW, cssH, focal.x, focal.y);

    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(0.5, 0.5, cssW - 1, cssH - 1);

      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, 0, cssW, cssH * 0.1);
      ctx.fillRect(0, cssH * 0.9, cssW, cssH * 0.1);
      ctx.restore();
    }
  }, [imgRef, size.w, size.h, focal.x, focal.y, wrapRef, wrapSize.width]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg border bg-ink-50/40 dark:border-white/10 dark:bg-zinc-800" />
    </div>
  );
}
