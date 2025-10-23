// src/components/ShareBar.tsx
"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
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

/**
 * ShareBar
 * - Native share first, graceful fallbacks second
 * - Mobile-first, keyboard + screen-reader friendly
 * - Optional compact mode (collapsed on mobile)
 * - QR modal with focus trap, ESC close & scroll lock
 * - Reduced-motion aware animations
 */
type Props = {
  title: string;
  url: string;
  className?: string;
  /** start collapsed on mobile */
  compact?: boolean;
};

export default function ShareBar({
  title,
  url,
  className = "",
  compact = false,
}: Props) {
  const prefersReduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(!compact);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);
  const copiedTimer = useRef<number | null>(null);

  // A11y ids
  const moreId = useId();
  const dialogTitleId = useId();

  // Build share links (safe encoding)
  const encodedTitleUrl = useMemo(
    () => encodeURIComponent(`${title} ${url}`),
    [title, url]
  );
  const encodedTitle = useMemo(() => encodeURIComponent(title), [title]);
  const encodedUrl = useMemo(() => encodeURIComponent(url), [url]);
  const wa = `https://wa.me/?text=${encodedTitleUrl}`;
  const tg = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
  const tw = `https://x.com/intent/tweet?text=${encodedTitleUrl}`;

  // Native share first, then WA fallback
  const onNativeShare = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        if (navigator.share) {
          // Some browsers block share for http; guard with try/catch
          await navigator.share({ title, url });
          setShowToast("Shared!");
          if (toastTimer.current) window.clearTimeout(toastTimer.current);
          toastTimer.current = window.setTimeout(() => setShowToast(null), 1400);
          return;
        }
      } catch {
        // Fallthrough to WA
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
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      setShowToast("Link copied");
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1200);
      toastTimer.current = window.setTimeout(() => setShowToast(null), 1400);
    },
    [url]
  );

  // QR modal: lazy-generate Data URL if `qrcode` exists; else fallback
  useEffect(() => {
    if (!qrOpen) return;
    let done = false;
    (async () => {
      try {
        const QR = await import("qrcode").catch(() => null as any);
        if (!QR?.toDataURL) {
          setQrDataUrl(null);
          return;
        }
        const dataUrl = await QR.toDataURL(url, {
          width: 480,
          margin: 1,
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

  // Modal focus trap + ESC + scroll lock
  useEffect(() => {
    if (!qrOpen) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    // focus first control
    closeBtnRef.current?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQrOpen(false);
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<
          HTMLButtonElement | HTMLAnchorElement
        >(
          'a[href],button:not([disabled]),[tabindex="0"],[role="button"],[contentEditable=true]'
        );
        if (!focusables.length) return;
        const first = focusables[0] as HTMLElement;
        const last = focusables[focusables.length - 1] as HTMLElement;
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      // restore focus
      lastFocusRef.current?.focus?.();
    };
  }, [qrOpen]);

  // Prevent parent <Link> clicks (e.g., cards)
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // Styles
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const pill =
    "rounded-full border border-white/60 bg-white/85 backdrop-blur text-ink-900 hover:bg-white active:scale-[0.98] dark:border-white/20 dark:bg-zinc-900/70 dark:text-zinc-50 dark:hover:bg-zinc-900";
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
        aria-controls={moreId}
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
            id={moreId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="flex w-full flex-wrap items-center gap-2"
          >
            <a
              href={wa}
              target="_blank"
              rel="noreferrer noopener"
              onClick={stop}
              onMouseDown={stop}
              className={`${base} ${pill} text-emerald-700 ring-emerald-200 dark:text-emerald-300`}
              aria-label="Share on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>

            <a
              href={tg}
              target="_blank"
              rel="noreferrer noopener"
              onClick={stop}
              onMouseDown={stop}
              className={`${base} ${pill} text-sky-700 ring-sky-200 dark:text-sky-300`}
              aria-label="Share on Telegram"
            >
              <Send className="h-4 w-4" />
              Telegram
            </a>

            <a
              href={tw}
              target="_blank"
              rel="noreferrer noopener"
              onClick={stop}
              onMouseDown={stop}
              className={`${base} ${pill} text-zinc-700 ring-zinc-200 dark:text-zinc-200`}
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
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
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
              rel="noreferrer noopener"
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
            className="pointer-events-none absolute -bottom-9 left-0 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/90 px-3 py-1.5 text-xs text-ink-900 shadow backdrop-blur dark:border-white/20 dark:bg-zinc-900/80 dark:text-zinc-100"
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
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.18 }}
              className="relative z-[71] w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-5 text-center shadow-xl dark:border-white/20 dark:bg-zinc-900/95"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
            >
              <button
                ref={closeBtnRef}
                className="absolute right-3 top-3 rounded-md p-1 text-ink-600 hover:bg-ink-100/60 focus:outline-none focus-visible:ring-2 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => setQrOpen(false)}
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

              <div id={dialogTitleId} className="mb-3 text-sm font-medium text-ink-900 dark:text-zinc-100">
                Scan to open
              </div>

              {/* If we have a data URL (qrcode present) show it; else show inline fallback */}
              <div className="mx-auto grid place-items-center rounded-xl border border-ink-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
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
                rel="noreferrer noopener"
                className="mt-4 inline-block max-w-full truncate text-xs text-ink-700 underline dark:text-zinc-300"
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
/**
 * Lightweight fallback (no dependency). Uses a public endpoint.
 * If you want true offline QR, install `qrcode` and the modal will auto-upgrade.
 */
function FallbackQR({ value, size = 220 }: { value: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value
  )}`;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="QR code"
      className="h-60 w-60"
      draggable={false}
      loading="lazy"
    />
  );
}
