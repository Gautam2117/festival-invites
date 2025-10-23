// src/app/[slug]/[id]/page.tsx
import Image from "next/image";
import type { Metadata } from "next";
import type { Invite } from "@/types/invite";
import ShareBar from "@/components/ShareBar";

// Client-only wrappers (each file begins with "use client")
import PublicCaptions from "@/components/lazy/CaptionsPanel.nossr";
import SocialPreviewStudio from "@/components/lazy/SocialPreviewStudio.nossr";
import InviteAnalytics from "@/components/lazy/InviteAnalytics.nossr";
import WishForm from "@/components/lazy/WishForm.nossr";
import WishList from "@/components/lazy/WishList.nossr";
import WishMontageButton from "@/components/lazy/WishMontageButton.nossr";
import RSVPForm from "@/components/lazy/RSVPForm.nossr";
import RSVPStats from "@/components/lazy/RSVPStats.nossr";

/* --------------------------------------------- */
/* Data fetch (shared by page + metadata)        */
/* --------------------------------------------- */
async function fetchInvite(id: string): Promise<Invite | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) return null;

  const r = await fetch(`${base}/api/invites/${id}`, {
    next: { revalidate: 60 },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data.item as Invite;
}

/* --------------------------------------------- */
/* SEO / Social cards                            */
/* --------------------------------------------- */
type RouteParams = { slug: string; id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const inv = await fetchInvite(id);
  if (!inv) return { title: "Invite not found" };

  const title = inv.title || "Invitation";
  const desc = inv.subtitle || "Join the celebration";
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const canonical = `/${inv.slug}/${inv.id}`;
  const url = `${base}${canonical}`;

  // Be tolerant to image URLs that include query strings.
  const looksLikeImage = (u?: string) => {
    if (!u) return false;
    try {
      const pathname = new URL(u, base || "http://localhost").pathname || "";
      return /\.(png|jpe?g|webp|gif)$/i.test(pathname);
    } catch {
      return /\.(png|jpe?g|webp|gif)$/i.test(u);
    }
  };

  let ogUrl: string | undefined =
    inv.ogImageUrl && looksLikeImage(inv.ogImageUrl)
      ? inv.ogImageUrl
      : undefined;

  // Attempt to generate/fetch an OG still if we don't have one already.
  if (!ogUrl && base) {
    try {
      const ensure = await fetch(`${base}/api/invites/${inv.id}/og`, {
        cache: "no-store",
      });
      const j = await ensure.json();
      if (ensure.ok && j?.url) ogUrl = j.url as string;
    } catch {
      /* ignore */
    }
  }

  const finalOg = ogUrl || inv.mediaUrl;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      url,
      images: finalOg ? [{ url: finalOg }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: finalOg ? [finalOg] : [],
    },
    alternates: { canonical },
    metadataBase: base ? new URL(base) : undefined,
  };
}

/* --------------------------------------------- */
/* Small festive background + section tabs       */
/* --------------------------------------------- */
function FestiveBackdrop() {
  // Reduced intensity on small screens for perf; keep depth on larger viewports.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "1200px 800px",
      }}
    >
      <div className="absolute -top-28 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,193,7,0.16),transparent_60%)] blur-2xl md:h-[40rem] md:w-[40rem] md:blur-3xl" />
      <div className="absolute top-40 right-[-15%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,67,54,0.12),transparent_60%)] blur-xl md:h-[28rem] md:w-[28rem] md:blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(103,58,183,0.12),transparent_60%)] blur-xl md:h-[26rem] md:w-[26rem] md:blur-3xl" />
    </div>
  );
}

function SectionTabs({
  hasRSVP,
  hasWishes,
}: {
  hasRSVP: boolean;
  hasWishes: boolean;
}) {
  return (
    <div
      className="sticky z-30 -mx-4 mb-4 bg-gradient-to-b from-white/85 to-white/65 px-4 py-2 supports-[backdrop-filter]:backdrop-blur"
      style={{ top: "max(0px, env(safe-area-inset-top))" }}
    >
      <nav
        aria-label="Sections"
        className="flex w-full items-center justify-between gap-2 overflow-x-auto"
      >
        <a
          href="#media"
          className="rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-white"
        >
          Media
        </a>
        {hasWishes && (
          <a
            href="#wishes"
            className="rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-white"
          >
            Wishes
          </a>
        )}
        {hasRSVP && (
          <a
            href="#rsvp"
            className="rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-white"
          >
            RSVP
          </a>
        )}
        <a
          href="#share"
          className="rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-white"
        >
          Share
        </a>
        <a
          href="#extras"
          className="rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-white"
        >
          Extras
        </a>
      </nav>
    </div>
  );
}

/* --------------------------------------------- */
/* Page                                          */
/* --------------------------------------------- */
export default async function InvitePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug, id } = await params;
  const inv = await fetchInvite(id);

  if (!inv || inv.slug !== slug) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Invite not found</h1>
        <p className="mt-2 text-sm text-zinc-600">
          The link may be incorrect or has been removed.
        </p>
      </main>
    );
  }

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${inv.slug}/${inv.id}`;
  const isVideo = /\.(mp4|webm|mov)$/i.test(inv.mediaUrl);
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(inv.mediaUrl);

  const hasWishes = !!inv.wishesEnabled;
  const hasRSVP = !!inv.rsvpEnabled;

  const infoChips = [
    inv.props?.date ? { label: inv.props.date } : null,
    inv.props?.venue ? { label: inv.props.venue } : null,
    inv.owner?.name ? { label: `by ${inv.owner.name}` } : null,
    inv.owner?.org ? { label: inv.owner.org } : null,
  ].filter(Boolean) as Array<{ label: string }>;

  // Suggest a friendly filename for downloads
  const downloadName =
    `${inv.slug}-${(inv.title || "invite")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)+/g, "")}` + (isVideo ? ".mp4" : ".png");

  return (
    <>
      <main
        className="relative mx-auto max-w-3xl px-4 py-10"
        style={{
          // keep content clear of notches + future bottom bars (esp. iOS)
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
          contentVisibility: "auto",
        }}
      >
        <FestiveBackdrop />

        {/* Header */}
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-ink-700 shadow-sm supports-[backdrop-filter]:backdrop-blur">
            Invitation
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            <span className="bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
              {inv.title}
            </span>
          </h1>
          {inv.subtitle && <p className="mt-1 text-ink-700">{inv.subtitle}</p>}

          {infoChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {infoChips.map((c, i) => (
                <span
                  key={`${c.label}-${i}`}
                  className="rounded-full border border-white/60 bg-white/85 px-3 py-1 text-xs text-ink-700 supports-[backdrop-filter]:backdrop-blur"
                >
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </header>

        <SectionTabs hasRSVP={hasRSVP} hasWishes={hasWishes} />

        {/* Media */}
        <section id="media" className="scroll-mt-20">
          <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 supports-[backdrop-filter]:backdrop-blur shadow-sm">
            {/* Use a centered, aspect-ratio wrapper for perfect scaling */}
            <div className="mx-auto w-full max-w-[min(720px,100%)]">
              <div className="relative w-full aspect-[9/16] bg-black/90">
                {isVideo ? (
                  <video
                    src={inv.mediaUrl}
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    playsInline
                    preload="metadata"
                    poster={inv.ogImageUrl || undefined}
                    className="absolute inset-0 h-full w-full object-contain"
                    aria-label={`${inv.title} video`}
                  />
                ) : (
                  <Image
                    src={inv.mediaUrl}
                    alt={inv.title}
                    fill
                    sizes="(max-width: 768px) 92vw, 720px"
                    priority
                    className="object-cover"
                    draggable={false}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div
            id="share"
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <ShareBar title={inv.title} url={url} />
            <div className="flex flex-wrap items-center gap-2">
              {inv.wishesEnabled && <WishMontageButton inviteId={inv.id} />}
              {inv.wishesEnabled && (
                <a
                  href={`/${inv.slug}/${inv.id}#wishes`}
                  className="rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
                >
                  Send a wish
                </a>
              )}
              <a
                href={inv.mediaUrl}
                download={downloadName}
                className="rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-sm text-ink-800 shadow-sm supports-[backdrop-filter]:backdrop-blur hover:bg-white"
              >
                Download
              </a>
            </div>
          </div>

          {/* Reminders + shortlist */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`/api/festivals/ics?festival=${inv.slug}`}
              className="rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-sm shadow-sm supports-[backdrop-filter]:backdrop-blur hover:bg-white"
              title="Add to Calendar"
            >
              Remind me
            </a>
            <button
              className="rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-sm shadow-sm supports-[backdrop-filter]:backdrop-blur hover:bg-white"
              onClick={() => {
                try {
                  const key = "fi:shortlist";
                  const raw =
                    typeof window !== "undefined"
                      ? localStorage.getItem(key)
                      : "[]";
                  const list = JSON.parse(raw || "[]");
                  if (!list.find((x: any) => x.id === inv.id)) {
                    list.push({ id: inv.id, slug: inv.slug, title: inv.title });
                    typeof window !== "undefined" &&
                      localStorage.setItem(key, JSON.stringify(list));
                  }
                  alert("Saved to shortlist!");
                } catch {
                  /* no-op */
                }
              }}
            >
              Save to shortlist
            </button>
          </div>
        </section>

        {/* Extras */}
        <section
          id="extras"
          className="mt-8 scroll-mt-20"
          style={{
            contentVisibility: "auto",
            containIntrinsicSize: "800px 600px",
          }}
        >
          {(inv.ogImageUrl || isImage) && (
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 supports-[backdrop-filter]:backdrop-blur">
              <SocialPreviewStudio
                src={inv.ogImageUrl || inv.mediaUrl}
                overlayTitle={inv.title}
              />
            </div>
          )}

          <div className="mt-4">
            <PublicCaptions
              templateSlug={inv.slug}
              lang={(inv.locale as any) || "en"}
              title={inv.title}
              names={inv.subtitle}
              date={inv.props?.date}
              venue={inv.props?.venue}
            />
          </div>
        </section>

        {/* RSVP */}
        {hasRSVP && (
          <section id="rsvp" className="mt-10 scroll-mt-20">
            <h2 className="mb-2 text-lg font-semibold">RSVP</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <RSVPForm inviteId={inv.id} mode={inv.rsvpMode || "counts"} />
              <RSVPStats inviteId={inv.id} />
            </div>
          </section>
        )}

        {/* Wishes */}
        {hasWishes && (
          <section id="wishes" className="mt-10 scroll-mt-20">
            <h2 className="mb-2 text-lg font-semibold">Wishes</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <WishForm inviteId={inv.id} />
              <div>
                <WishList inviteId={inv.id} />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Analytics (client only) */}
      <InviteAnalytics inviteId={inv.id} />
    </>
  );
}
