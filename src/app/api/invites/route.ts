// src/app/api/invites/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";
import { shortId } from "@/lib/ids";
import type { Invite } from "@/types/invite";

export const runtime = "nodejs";

function clamp(s: unknown, max: number): string | undefined {
  if (s === undefined || s === null) return undefined;
  const v = String(s);
  return v.length > max ? v.slice(0, max) : v;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const slug = String(body.slug || "").trim();
    const mediaUrl = String(body.mediaUrl || "").trim();
    if (!slug || !mediaUrl) {
      return NextResponse.json({ error: "slug and mediaUrl required" }, { status: 400 });
    }

    const id = (body.id && String(body.id)) || shortId(8);
    const now = Date.now();

    const inv: Invite & {
      views?: number;
      uniques?: number;
      lastViewedAt?: number;
      updatedAt?: number;
    } = {
      id,
      slug,
      title: clamp(body.title || slug, 120) || slug,
      subtitle: clamp(body.subtitle, 200),
      owner: {
        name: clamp(body.owner?.name, 60),
        org: clamp(body.owner?.org, 120) ?? null,
      },
      mediaUrl,
      ogImageUrl: body.ogImageUrl ? String(body.ogImageUrl) : mediaUrl,
      theme: clamp(body.theme || "classic", 40),
      locale: clamp(body.locale || "en", 20),
      props: body.props || {},
      createdAt: now,
      wishesEnabled: body.wishesEnabled ?? true,
      rsvpEnabled: body.rsvpEnabled ?? true,                 // default ON
      rsvpMode: (body.rsvpMode === "simple" ? "simple" : "counts"),
      // analytics defaults (can be overwritten by caller)
      views: typeof body.views === "number" ? body.views : 0,
      uniques: typeof body.uniques === "number" ? body.uniques : 0,
      lastViewedAt: typeof body.lastViewedAt === "number" ? body.lastViewedAt : now,
      updatedAt: now,
      
    };

    await adminDb.collection("invites").doc(id).set(inv, { merge: true });

    // 🔔 Fire-and-forget OG ensure (only if we have a BASE URL)
    // This will render & cache a PNG cover if ogImageUrl isn't already a real image.
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (base) {
      // Don't await — we don't want invite creation to be blocked by OG generation.
      fetch(`${base}/api/invites/${id}/og`, { method: "GET", cache: "no-store" }).catch(() => {});
    }

    return NextResponse.json({ ok: true, id, slug: inv.slug, url: `/${inv.slug}/${id}` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
