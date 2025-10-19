// src/components/SocialPreviewStudio.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ----------------------------- Preset sizes ----------------------------- */
type Size = { w: number; h: number; label: string; filename: string; note?: string };
const SIZES: Size[] = [
  { w: 1080, h: 1920, label: "Status / Story (9:16)", filename: "social-9x16" },
  { w: 1080, h: 1080, label: "Reel Cover / Feed (1:1)", filename: "social-1x1" },
  { w: 1080, h: 1350, label: "Feed Portrait (4:5)", filename: "social-4x5", note: "Instagram max feed height" },
  { w: 1920, h: 1080, label: "Landscape (16:9)", filename: "social-16x9" },
];

/* ----------------------------- Draw helpers ----------------------------- */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  focalX = 0.5,
  focalY = 0.5
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;

  // Cover logic with focal point
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

/* --------------------------------- Props -------------------------------- */
type Props = {
  /** Source image (prefer OG cover or still export). Can be data: URL or absolute/relative URL. */
  src?: string | null;
  /** Optional title chip to overlay (tiny); omit for clean crops */
  overlayTitle?: string;
  /** Default focal point (0..1), where 0.5,0.5 centers */
  focal?: { x: number; y: number };
  className?: string;
};

/* ------------------------------ Component ------------------------------- */
export default function SocialPreviewStudio({
  src,
  overlayTitle,
  focal = { x: 0.5, y: 0.5 },
  className,
}: Props) {
  const prefersReduced = useReducedMotion();
  const [imageUrl, setImageUrl] = useState<string | null>(src ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fmt, setFmt] = useState<"png" | "jpg">("png");
  const [jpgQuality, setJpgQuality] = useState(0.92);
  const [showGuides, setShowGuides] = useState(true);

  // Focal point in local state (don’t mutate prop)
  const [fp, setFp] = useState<{ x: number; y: number }>(focal);

  // drag state
  const dragRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // keep in sync if parent changes src/focal later
  useEffect(() => {
    if (src) setImageUrl(src);
  }, [src]);
  useEffect(() => {
    setFp(focal);
  }, [focal.x, focal.y]);

  const canRender = !!imageUrl;

  const handleFile = async (file: File) => {
    setErr(null);
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

  async function renderOne(size: Size): Promise<Blob | null> {
    if (!imgRef.current || !canRender) return null;
    const { w, h } = size;

    // Prepare canvas
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    drawCover(ctx, imgRef.current, w, h, fp.x, fp.y);

    // Optional title chip
    if (overlayTitle?.trim()) {
      ctx.save();
      // shadow & glass
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 12;

      const paddingX = 20;
      const paddingY = 14;
      const text = overlayTitle.trim();

      ctx.font = "600 34px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const metrics = ctx.measureText(text);
      const tw = metrics.width;
      const th = 34;

      const rx = w - tw - paddingX * 2 - 32; // right inset
      const ry = 28; // top inset

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

    // Export format
    const type = fmt === "png" ? "image/png" : "image/jpeg";
    const quality = fmt === "png" ? undefined : jpgQuality;

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), type, quality)
    );
  }

  async function handleDownloadOne(size: Size) {
    if (!canRender) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await renderOne(size);
      if (blob) await downloadBlob(blob, `${size.filename}.${fmt}`);
    } catch {
      setErr("Download failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadAllZip() {
    if (!canRender) return;
    setBusy(true);
    setErr(null);
    try {
      // Lazy-load JSZip to keep bundle slim
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
  }

  // Drag to reposition focal point (on the master 9:16 preview)
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

  // Determines if a preview is 9:16 for safe area guides
  const ratioName = (s: Size) => {
    const r = (s.w / s.h).toFixed(3);
    if (r === (9 / 16).toFixed(3)) return "9:16";
    if (r === (1 / 1).toFixed(3)) return "1:1";
    if (r === (4 / 5).toFixed(3)) return "4:5";
    if (r === (16 / 9).toFixed(3)) return "16:9";
    return "";
  };

  return (
    <section
      className={
        className ??
        "mt-8 rounded-2xl border border-white/60 bg-white/85 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.10)] p-5"
      }
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-2.5 py-1 text-xs text-ink-800 backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Social preview studio
          </div>
          <h3 className="font-display mt-2 text-xl">Crop once, export everywhere</h3>
          <p className="text-sm text-ink-700">
            Drag to reposition the focal point. Download any size or everything as a ZIP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Replace image */}
          <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-900 shadow-sm hover:bg-white cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await handleFile(f);
              }}
            />
            Replace image
          </label>

          {/* Format */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-2 py-1.5 text-sm text-ink-900 shadow-sm">
            <span className="text-xs opacity-70">Format</span>
            <select
              value={fmt}
              onChange={(e) => setFmt(e.target.value as "png" | "jpg")}
              className="rounded-md border border-ink-200 bg-white px-2 py-1 text-sm"
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
                />
              </>
            )}
          </div>

          {/* Guides toggle */}
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            className="rounded-xl border border-ink-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-900 shadow-sm hover:bg-white"
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

      {err ? (
        <p className="mb-3 text-sm text-rose-600">{err}</p>
      ) : null}

      {!imageUrl ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white/70 p-10 text-center">
          <p className="text-sm text-ink-700">
            Pick an image (OG cover or still export) to generate social crops.
          </p>
        </div>
      ) : (
        <>
          {/* Hidden loader image (with CORS attempt for canvas safety) */}
          <img
            ref={imgRef}
            src={imageUrl}
            crossOrigin="anonymous"
            alt="source"
            className="hidden"
            onError={() => setErr("Failed to load image (CORS or network).")}
          />

          {/* Master interactive preview (9:16 frame) */}
          <div className="mb-5 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/60 bg-white/85 p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">Master focal area (interactive)</div>
                <span className="text-xs text-ink-700">Drag anywhere to reposition</span>
              </div>

              <div
                ref={dragRef}
                className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-xl border bg-black/80"
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  onDrag(e);
                }}
                onPointerMove={(e) => {
                  if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) onDrag(e);
                }}
                onPointerUp={(e) => {
                  (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
                }}
                role="slider"
                aria-label="Focal point"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fp.x * 100)}
              >
                <LiveCanvas imgRef={imgRef} w={1080} h={1920} focal={fp} />

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

                {/* Safe area guides for 9:16 */}
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
                  className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 hover:bg-ink-50/60"
                >
                  Reset center
                </button>
                <div className="text-xs text-ink-700">
                  x: {(fp.x * 100).toFixed(0)}%, y: {(fp.y * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Sliders for precise control (optional) */}
            <div className="rounded-2xl border border-white/60 bg-white/85 p-3 shadow-sm">
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
                    onChange={(e) => setFp((p) => ({ ...p, x: parseFloat(e.target.value) }))}
                    className="w-full"
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
                    onChange={(e) => setFp((p) => ({ ...p, y: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </label>

                <div className="rounded-lg border border-ink-200 bg-white p-2 text-xs text-ink-700">
                  Tip: Keep important faces/text inside the safe rectangles for Stories.
                </div>
              </div>
            </div>
          </div>

          {/* Grid of outputs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SIZES.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/60 bg-white/90 p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {s.label}{" "}
                    <span className="ml-1 rounded-full bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-700 ring-1 ring-ink-200">
                      {ratioName(s)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadOne(s)}
                    disabled={busy || !canRender}
                    className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm hover:bg-ink-50/60 disabled:opacity-60"
                    aria-label={`Download ${s.label}`}
                  >
                    Download
                  </button>
                </div>
                {s.note && <div className="mb-2 text-xs text-ink-700">{s.note}</div>}

                {/* Live preview via canvas */}
                <PreviewCanvas imgRef={imgRef} size={s} focal={fp} showGuides={showGuides} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------------------- Preview subview ---------------------------- */

function PreviewCanvas({
  imgRef,
  size,
  focal,
  showGuides,
}: {
  imgRef: React.MutableRefObject<HTMLImageElement | null>;
  size: Size;
  focal: { x: number; y: number };
  showGuides: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = ref.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Preview scale to keep UI light
    const scale = 0.34; // ~1/3
    canvas.width = Math.max(160, Math.round(size.w * scale));
    canvas.height = Math.max(160, Math.round(size.h * scale));

    drawCover(ctx, img, canvas.width, canvas.height, focal.x, focal.y);

    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

      // simple title-safe padding guides
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      // top & bottom 10% bands
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.1);
      ctx.fillRect(0, canvas.height * 0.9, canvas.width, canvas.height * 0.1);
      ctx.restore();
    }
  }, [imgRef, size.w, size.h, focal.x, focal.y, showGuides]);

  return <canvas ref={ref} className="w-full rounded-lg border bg-ink-50/40" />;
}

/* ------------------------------ Live canvas ------------------------------ */

function LiveCanvas({
  imgRef,
  w,
  h,
  focal,
}: {
  imgRef: React.MutableRefObject<HTMLImageElement | null>;
  w: number;
  h: number;
  focal: { x: number; y: number };
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = ref.current;
    if (!img || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale canvas to container using CSS; logical resolution can stay modest
    const scale = 0.34;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);

    drawCover(ctx, img, canvas.width, canvas.height, focal.x, focal.y);
  }, [imgRef, w, h, focal.x, focal.y]);

  return <canvas ref={ref} className="h-full w-full object-cover" />;
}
