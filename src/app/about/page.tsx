// src/app/about/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Play,
  Image as ImageIcon,
  ShieldCheck,
  Share2,
  Languages,
  CalendarDays,
  Palette,
  Wallet,
  PartyPopper,
  Stars,
  Gift,
  Shield,
  ChevronUp,
} from "lucide-react";

/* --------------------------------------------- */
/* Motion helpers                                */
/* --------------------------------------------- */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

const float = (duration = 8, y = 12) => ({
  animate: {
    y: [0, -y, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
  },
});

/* --------------------------------------------- */
/* Small festive background + utilities          */
/* --------------------------------------------- */
function FestiveGlow() {
  const reduce = useReducedMotion();
  const anim = reduce ? {} : float(12, 16);
  const anim2 = reduce ? {} : float(10, 14);
  const anim3 = reduce ? {} : float(14, 18);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <motion.div
        className="absolute -top-24 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,183,77,0.22), transparent 60%)",
        }}
        {...anim}
      />
      <motion.div
        className="absolute top-40 right-[-10%] h-[32rem] w-[32rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(240,98,146,0.18), transparent 60%)",
        }}
        {...anim2}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[-10%] h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,77,255,0.18), transparent 60%)",
        }}
        {...anim3}
      />
    </div>
  );
}

function ShimmerText({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block">
      <span className="bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-500 bg-clip-text text-transparent">
        {children}
      </span>
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: 0.6 }}
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5), transparent 70%)",
            WebkitMaskImage:
              "linear-gradient(180deg, black 20%, transparent 60%)",
          }}
        />
      )}
    </span>
  );
}

function GradientDivider() {
  return (
    <div className="mx-auto mt-12 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
  );
}

function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      className={`rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------------------- */
/* Sticky side section-nav (desktop only)        */
/* --------------------------------------------- */
const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "why", label: "Why" },
  { id: "how", label: "How" },
  { id: "formats", label: "Formats" },
  { id: "trust", label: "Trust" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "Get started" },
];

function SectionNav() {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(id);
          });
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav
      aria-label="About page"
      className="sticky top-20 hidden h-max xl:block"
    >
      <ul className="rounded-2xl border border-white/60 bg-white/85 p-3 backdrop-blur">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active === s.id
                  ? "bg-ink-900 text-white"
                  : "text-ink-800 hover:bg-white"
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* --------------------------------------------- */
/* FAQ (kept content, better container)          */
/* --------------------------------------------- */
type FaqItem = { q: string; a: React.ReactNode };
type FaqGroup = { title: string; items: FaqItem[] };

const FAQ: FaqGroup[] = [
  {
    title: "Quality & Formats",
    items: [
      {
        q: "Will WhatsApp compress my video?",
        a: (
          <>
            Yes—so we ship <strong>Status</strong> and{" "}
            <strong>Status Lite</strong> presets that play nicely with
            compression. If you hit device compatibility issues, export a{" "}
            <strong>short GIF</strong>. Square images stay ultra crisp.
          </>
        ),
      },
      {
        q: "What’s the difference between Free and HD?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Free</strong>: SD preview with an anti-crop watermark.
            </li>
            <li>
              <strong>HD</strong>: Sharper video/image, no watermark, premium
              motion tweaks.
            </li>
          </ul>
        ),
      },
    ],
  },
  {
    title: "Languages & Captions",
    items: [
      {
        q: "Which languages are supported?",
        a: (
          <>
            Smart captions adapt to <strong>English</strong>,{" "}
            <strong>हिंदी</strong> (Hindi) and <strong>Hinglish</strong>. You’ll
            also see regional seeds for <strong>Tamil, Bengali, and Marathi</strong> on
            top festivals.
          </>
        ),
      },
      {
        q: "Can I customize the copy style quickly?",
        a: (
          <>
            Yup—one-taps for <em>formal company</em>, <em>warm family</em>, and{" "}
            <em>friendly personal</em> tones. Then tweak inline and copy in one
            tap.
          </>
        ),
      },
    ],
  },
  {
    title: "Payments & Branding",
    items: [
      {
        q: "How does payment work?",
        a: (
          <>
            We use <strong>Razorpay</strong> with an{" "}
            <strong>UPI-intent first</strong> flow for one-screen checkout. We
            also remember your last plan for faster repeats.
          </>
        ),
      },
      {
        q: "Can I add my company branding?",
        a: (
          <>
            Add logo, pick primary/secondary colors, enable a corner ribbon and
            a branded end-card CTA. We also provide a compliance-safe music
            pack.
          </>
        ),
      },
    ],
  },
  {
    title: "Wishboard, Reminders & Privacy",
    items: [
      {
        q: "How do the wishboard and reminders work?",
        a: (
          <>
            Share a <strong>public wishboard link</strong> (with moderation).
            Export a <strong>video montage</strong> of wishes later. Use{" "}
            <strong>Remind me</strong> to download an .ics calendar file or save
            festivals to a shortlist.
          </>
        ),
      },
      {
        q: "What data do you store?",
        a: (
          <>
            Only what’s needed to render/share your invite. You control public
            links. Payments are processed by <strong>Razorpay</strong>. See our{" "}
            <Link className="underline" href="/privacy">
              Privacy
            </Link>{" "}
            and{" "}
            <Link className="underline" href="/terms">
              Terms
            </Link>
            .
          </>
        ),
      },
    ],
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-4 space-y-6">
      {FAQ.map((group) => (
        <div key={group.title}>
          <div className="mb-2 text-sm font-semibold text-ink-800">
            {group.title}
          </div>
          <div className="space-y-2">
            {group.items.map((it) => {
              const id = `${group.title}-${it.q}`;
              const isOpen = open === id;
              return (
                <div
                  key={id}
                  className="rounded-xl border border-white/60 bg-white/90 p-0 backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    aria-expanded={isOpen}
                    aria-controls={id}
                  >
                    <span className="text-sm font-medium">{it.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="ml-3"
                    >
                      <Stars className="h-4 w-4 text-ink-700" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-white/60 px-4 py-3 text-sm text-ink-700"
                      >
                        {it.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------- */
/* Reusable content cards                         */
/* --------------------------------------------- */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <TiltCard>
      <div className="flex items-start gap-3">
        <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900/90 text-white shadow">
          {icon}
        </div>
        <div>
          <div className="font-display">{title}</div>
          <p className="mt-1 text-sm text-ink-700">{desc}</p>
        </div>
      </div>
    </TiltCard>
  );
}

function Step({
  step,
  title,
  desc,
  delay = 0,
}: {
  step: string;
  title: string;
  desc: string;
  delay?: number;
}) {
  return (
    <motion.li
      className="rounded-xl border border-white/60 bg-white/90 p-4 backdrop-blur"
      {...fadeUp(delay)}
    >
      <div className="text-xs font-medium text-ink-700">{step}</div>
      <div className="mt-1 font-medium">{title}</div>
      <p className="mt-1 text-sm text-ink-700">{desc}</p>
    </motion.li>
  );
}

function FormatCard({
  iconBg,
  icon,
  title,
  desc,
}: {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <TiltCard>
      <div className="flex items-center gap-3">
        <div
          className={`inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr ${iconBg} text-white ring-1 ring-white/60 shadow`}
        >
          {icon}
        </div>
        <div>
          <div className="font-display">{title}</div>
          <p className="text-sm text-ink-700">{desc}</p>
        </div>
      </div>
    </TiltCard>
  );
}

/* --------------------------------------------- */
/* Scroll-to-top button (mobile/long pages)      */
/* --------------------------------------------- */
function ScrollTopButton() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="top"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 z-40 rounded-full border border-white/60 bg-white/90 p-2 shadow backdrop-blur sm:hidden"
          aria-label="Back to top"
          title="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------------------- */
/* Page                                          */
/* --------------------------------------------- */
export default function AboutPage() {
  // Avoid layout shift when computing current year or dynamic bits
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-14">
      <FestiveGlow />
      <div className="grid grid-cols-12 gap-6">
        {/* Side nav (desktop) */}
        <aside className="col-span-2 hidden xl:block">
          <SectionNav />
        </aside>

        {/* Content */}
        <div className="col-span-12 xl:col-span-10">
          {/* Hero */}
          <motion.section id="overview" className="text-center" {...fadeUp(0.05)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs text-ink-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              Our mission
            </span>
            <h1 className="font-display mx-auto mt-4 max-w-4xl text-4xl leading-tight sm:text-5xl">
              Make <ShimmerText>festive invites</ShimmerText> &{" "}
              <ShimmerText>daily wishes</ShimmerText> feel premium—without a designer
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-ink-700">
              Festival Invites is a WhatsApp-first builder that turns a few details
              into scroll-stopping videos and images in seconds. English, हिंदी and
              Hinglish supported.
            </p>
            <motion.div
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
              {...fadeUp(0.1)}
            >
              <Link
                href="/builder"
                className="inline-flex items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:opacity-95"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Start Building
              </Link>
              <Link href="/#templates" className="underline">
                Browse Templates
              </Link>
            </motion.div>
          </motion.section>

          {/* Sparkly quick stats */}
          <motion.section
            aria-label="Highlights"
            className="mx-auto mt-10 grid gap-4 sm:grid-cols-3"
            {...fadeUp(0.1)}
          >
            <TiltCard className="flex items-center gap-3">
              <PartyPopper className="h-5 w-5 text-amber-600" aria-hidden />
              <div>
                <div className="text-sm font-medium">WhatsApp-first</div>
                <div className="text-xs text-ink-700">Status, Story, Feed presets</div>
              </div>
            </TiltCard>
            <TiltCard className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-emerald-700" aria-hidden />
              <div>
                <div className="text-sm font-medium">UPI-intent checkout</div>
                <div className="text-xs text-ink-700">Single-screen via Razorpay</div>
              </div>
            </TiltCard>
            <TiltCard className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-indigo-700" aria-hidden />
              <div>
                <div className="text-sm font-medium">Privacy-aware</div>
                <div className="text-xs text-ink-700">You control public links</div>
              </div>
            </TiltCard>
          </motion.section>

          {/* Why */}
          <section id="why" className="mx-auto mt-10">
            <h2 className="font-display text-xl">Why Festival Invites</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Share2 className="h-5 w-5" aria-hidden />}
                title="Social Preview Studio"
                desc="Auto crops for Status, Story, Feed, Banner—download all sizes in one tap."
              />
              <FeatureCard
                icon={<Languages className="h-5 w-5" aria-hidden />}
                title="Smart Captions"
                desc="One-taps in English, Hindi & Hinglish. Regional seeds for Tamil, Bengali & Marathi."
              />
              <FeatureCard
                icon={<Palette className="h-5 w-5" aria-hidden />}
                title="Brand Kit"
                desc="Logo, colors, ribbon, branded end-card. Compliance-safe music pack included."
              />
              <FeatureCard
                icon={<Wallet className="h-5 w-5" aria-hidden />}
                title="UPI-first Checkout"
                desc="Razorpay with UPI intent. Remembers last plan for fast repeats."
              />
              <FeatureCard
                icon={<CalendarDays className="h-5 w-5" aria-hidden />}
                title="Wishboard & Reminders"
                desc="Moderated wishboard + montage export. Save festivals to calendar."
              />
              <FeatureCard
                icon={<Play className="h-5 w-5" aria-hidden />}
                title="Status-ready Presets"
                desc="Optimized 9:16 video, plus Status Lite for tough networks."
              />
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="mx-auto mt-12 max-w-5xl">
            <h2 className="font-display text-xl">How it works</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              <Step
                step="Step 1"
                title="Pick a template"
                desc="Choose your occasion and language."
                delay={0.02}
              />
              <Step
                step="Step 2"
                title="Add details"
                desc="Names, date, venue—add a photo and music if you like."
                delay={0.06}
              />
              <Step
                step="Step 3"
                title="Export & share"
                desc="Free watermarked preview or HD without watermark."
                delay={0.1}
              />
            </ol>
          </section>

          {/* Formats */}
          <section id="formats" className="mx-auto mt-10">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormatCard
                iconBg="from-amber-400 via-orange-400 to-rose-500"
                icon={<Play className="h-5 w-5" aria-hidden />}
                title="Vertical Video · 9:16"
                desc="Perfect for Status and Stories."
              />
              <FormatCard
                iconBg="from-rose-500 to-violet-500"
                icon={<ImageIcon className="h-5 w-5" aria-hidden />}
                title="Square Image · 1:1"
                desc="Crisp stills for quick wishes."
              />
            </div>
          </section>

          <GradientDivider />

          {/* Trust & Privacy */}
          <section id="trust" className="mx-auto mt-12 rounded-2xl border border-white/60 bg-white/90 p-6 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900/90 text-white">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-display text-lg">Built with care</h3>
                  <p className="text-sm text-ink-700">
                    Payments are powered by Razorpay. We store only what’s needed to
                    render your invite. You control public links and wishboard.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/privacy" className="underline text-sm">
                  Privacy
                </Link>
                <Link href="/terms" className="underline text-sm">
                  Terms
                </Link>
              </div>
            </div>
          </section>

          {/* Advanced FAQ */}
          <section id="faq" className="mx-auto mt-12 max-w-5xl">
            <div className="mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-rose-600" aria-hidden />
              <h2 className="font-display text-xl">Frequently asked</h2>
            </div>
            <FaqAccordion />
          </section>

          {/* CTA */}
          <section id="cta" className="mx-auto mt-12 max-w-4xl text-center">
            <motion.div {...fadeUp(0.02)}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs text-ink-700 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                Celebrate beautifully, every week • © {year}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/builder"
                  className="inline-flex items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:opacity-95"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Start Building
                </Link>
                <Link href="/#templates" className="underline">
                  Browse Templates
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </div>

      {/* Mobile up button */}
      <ScrollTopButton />
    </main>
  );
}
