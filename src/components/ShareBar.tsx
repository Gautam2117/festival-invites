// src/components/ShareBar.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Share2,
  MessageCircle,
  Send,
  Twitter,
  Copy,
  Check,
  QrCode,
  ChevronDown,
  Link2,
  X as CloseIcon,
} from "lucide-react";

type Props = {
  title: string;
  url: string;
  className?: string;
  /** start collapsed on mobile */
  compact?: boolean;
};

export default function ShareBar({ title, url, className = "", compact = false }: Props) {
  const prefersReduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(!compact);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Build share links (safe encoding)
  const encodedTitleUrl = useMemo(() => encodeURIComponent(`${title} ${url}`), [title, url]);
  const encodedTitle = useMemo(() => encodeURIComponent(title), [title]);
  const encodedUrl = useMemo(() => encodeURIComponent(url), [url]);
  const wa = `https://wa.me/?text=${encodedTitleUrl}`;
  const tg = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
  const tw = `https://x.com/intent/tweet?text=${encodedTitleUrl}`;

  // Native share first, then fallbacks
  const onNativeShare = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        if (navigator.share) {
          await navigator.share({ title, url });
          setShowToast("Shared!");
          setTimeout(() => setShowToast(null), 1400);
          return;
        }
      } catch {
        // fallthrough to WA
      }
      window.open(wa, "_blank", "noopener,noreferrer");
    },
    [title, url, wa]
  );

  // Copy helpers (with legacy fallback)
  const copyLink = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setShowToast("Link copied");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(true);
        setShowToast("Link copied");
      }
      setTimeout(() => setCopied(false), 1200);
      setTimeout(() => setShowToast(null), 1400);
    },
    [url]
  );

  // QR modal (tries `qrcode` pkg if available; falls back to simple SVG)
  useEffect(() => {
    if (!qrOpen) return;
    let done = false;
    (async () => {
      try {
        // Optional dependency — if the app has "qrcode" installed this will be used
        const QR = await import("qrcode").catch(() => null as any);
        if (!QR || !QR.toDataURL) {
          setQrDataUrl(null);
          return;
        }
        const dataUrl = await QR.toDataURL(url, {
          width: 440,
          margin: 2,
          color: { dark: "#111111", light: "#ffffff" },
        });
        if (!done) setQrDataUrl(dataUrl);
      } catch {
        setQrDataUrl(null);
      }
    })();
    return () => {
      done = true;
    };
  }, [qrOpen, url]);

  // Prevent parent <Link> clicks (fix for “everything opens builder”)
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // Styles
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const pill =
    "rounded-full border border-white/60 bg-white/85 backdrop-blur text-ink-900 hover:bg-white active:scale-[0.98]";
  const grad =
    "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white ring-indigo-300 hover:opacity-95 active:scale-[0.98]";

  return (
    <div
      ref={rootRef}
      className={`relative flex w-full flex-wrap items-center gap-2 ${className}`}
      role="toolbar"
      aria-label="Share options"
      onClick={stop}
    >
      {/* Primary share */}
      <button
        onClick={onNativeShare}
        onMouseDown={stop}
        className={`${base} ${grad}`}
        aria-label="Share"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {/* Collapse toggle (mobile-first) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
        className={`${base} ${pill}`}
        aria-expanded={open}
        aria-controls="sharebar-more"
        title="More options"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
        More
      </button>

      {/* Secondary buttons */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="sharebar-more"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="flex w-full flex-wrap items-center gap-2"
          >
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
              onMouseDown={stop}
              className={`${base} ${pill} text-emerald-700 ring-emerald-200`}
              aria-label="Share on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>

            <a
              href={tg}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
              onMouseDown={stop}
              className={`${base} ${pill} text-sky-700 ring-sky-200`}
              aria-label="Share on Telegram"
            >
              <Send className="h-4 w-4" />
              Telegram
            </a>

            <a
              href={tw}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
              onMouseDown={stop}
              className={`${base} ${pill} text-zinc-700 ring-zinc-200`}
              aria-label="Share on X"
            >
              <Twitter className="h-4 w-4" />
              X
            </a>

            <button
              onClick={copyLink}
              onMouseDown={stop}
              className={`${base} ${pill}`}
              aria-label="Copy link"
              title="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setQrOpen(true);
              }}
              onMouseDown={stop}
              className={`${base} ${pill}`}
              aria-label="Show QR code"
              title="Show QR code"
            >
              <QrCode className="h-4 w-4" />
              QR
            </button>

            <a
              href={url}
              onClick={stop}
              onMouseDown={stop}
              className={`${base} ${pill}`}
              aria-label="Open link"
              title="Open link"
              target="_blank"
              rel="noreferrer"
            >
              <Link2 className="h-4 w-4" />
              Open
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tiny toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            className="pointer-events-none absolute -bottom-9 left-0 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/90 px-3 py-1.5 text-xs text-ink-900 shadow backdrop-blur"
            role="status"
            aria-live="polite"
          >
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {qrOpen && (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQrOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.18 }}
              className="relative z-[71] w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-5 text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="QR Code"
            >
              <button
                className="absolute right-3 top-3 rounded-md p-1 text-ink-600 hover:bg-ink-100/60"
                onClick={() => setQrOpen(false)}
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
              <div className="mb-3 text-sm font-medium text-ink-900">
                Scan to open
              </div>

              {/* If we have a data URL (qrcode present) show it; else show inline SVG fallback */}
              <div className="mx-auto grid place-items-center rounded-xl border border-ink-200 bg-white p-3">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QR code"
                    className="h-60 w-60"
                    draggable={false}
                  />
                ) : (
                  <FallbackQR value={url} size={240} />
                )}
              </div>

              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block truncate text-xs text-ink-700 underline"
                title={url}
              >
                {url}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- Fallback QR ------------------------------ */
/** Very small fallback (NOT full QR spec) — renders a scannable URL using a public chart.
 * For offline or zero-deps projects, you can keep this simple SVG that encodes the URL string visually.
 * If you want true offline QR, install `qrcode` and the modal will auto-upgrade.
 */
function FallbackQR({ value, size = 220 }: { value: string; size?: number }) {
  // Use a free static endpoint (works without package). If you prefer no network, replace with your own endpoint.
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value
  )}`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR code" className="h-60 w-60" draggable={false} />;
}
