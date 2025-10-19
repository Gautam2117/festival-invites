import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/fbAdmin";
import { FieldValue } from "firebase-admin/firestore";
import type { RSVP, RSVPStats } from "@/types/rsvp";

export const runtime = "nodejs";

const MAX_ADULTS = 10;
const MAX_KIDS = 10;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function getIP(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    (req as any).ip ||
    "0.0.0.0"
  );
}

function hashIP(ip: string) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

async function readStats(inviteId: string) {
  const sref = adminDb.collection("rsvp_stats").doc(inviteId);
  const snap = await sref.get();
  const base: RSVPStats = {
    inviteId,
    yes: 0,
    no: 0,
    adults: 0,
    kids: 0,
    updatedAt: 0,
  };
  return snap.exists ? ({ ...base, ...(snap.data() as any) } as RSVPStats) : base;
}

export async function GET(req: Request, { params }: { params: { inviteId: string } }) {
  const bag = await cookies();
  const cookieKey = `rsvp_${params.inviteId}`;
  const mineId = bag.get(cookieKey)?.value;

  let mine: RSVP | null = null;
  if (mineId) {
    const snap = await adminDb.collection("rsvps").doc(mineId).get();
    if (snap.exists) {
      const d = snap.data() as any;
      if (d.inviteId === params.inviteId) {
        mine = { ...(d as RSVP), id: snap.id } as RSVP;
      }
    }
  }

  const stats = await readStats(params.inviteId);
  return NextResponse.json({ mine, stats });
}

export async function POST(req: Request, { params }: { params: { inviteId: string } }) {
  const bag = await cookies();
  const cookieKey = `rsvp_${params.inviteId}`;
  const existingId = bag.get(cookieKey)?.value || "";

  const ip = getIP(req);
  const ipHash = hashIP(ip);
  const body = await req.json();

  // basic parsing
  const attending = !!body.attending;
  const adults = attending
    ? clamp(Number.isFinite(+body.adults) ? +body.adults : 1, 0, MAX_ADULTS)
    : 0;
  const kids = attending
    ? clamp(Number.isFinite(+body.kids) ? +body.kids : 0, 0, MAX_KIDS)
    : 0;

  const name = body.name ? String(body.name).slice(0, 80) : undefined;
  const contact = body.contact ? String(body.contact).slice(0, 80) : undefined;
  const message = body.message ? String(body.message).slice(0, 240) : undefined;

  const now = Date.now();

  let docId = existingId || "";
  let delta = { yes: 0, no: 0, adults: 0, kids: 0 };

  // Update existing RSVP (if cookie is present & valid), else create new
  if (docId) {
    const ref = adminDb.collection("rsvps").doc(docId);
    const snap = await ref.get();
    if (snap.exists && (snap.data() as any).inviteId === params.inviteId) {
      const prev = snap.data() as any;

      // compute delta for stats
      const prevYes = prev.attending ? 1 : 0;
      const prevNo = prev.attending ? 0 : 1;
      const nextYes = attending ? 1 : 0;
      const nextNo = attending ? 0 : 1;

      delta.yes = nextYes - prevYes;
      delta.no = nextNo - prevNo;
      delta.adults = (attending ? adults : 0) - (prev.attending ? (prev.adults || 0) : 0);
      delta.kids = (attending ? kids : 0) - (prev.attending ? (prev.kids || 0) : 0);

      await ref.update({
        attending,
        adults,
        kids,
        name,
        contact,
        message,
        updatedAt: now,
      });
    } else {
      // cookie stale → treat as new
      docId = "";
    }
  }

  if (!docId) {
    const ref = await adminDb.collection("rsvps").add({
      inviteId: params.inviteId,
      attending,
      adults,
      kids,
      name,
      contact,
      message,
      createdAt: now,
      updatedAt: now,
      ipHash,
    });
    docId = ref.id;

    delta = {
      yes: attending ? 1 : 0,
      no: attending ? 0 : 1,
      adults: attending ? adults : 0,
      kids: attending ? kids : 0,
    };
  }

  // Update aggregate stats with atomic increments
  const sref = adminDb.collection("rsvp_stats").doc(params.inviteId);
  await sref.set(
    {
      inviteId: params.inviteId,
      yes: FieldValue.increment(delta.yes),
      no: FieldValue.increment(delta.no),
      adults: FieldValue.increment(delta.adults),
      kids: FieldValue.increment(delta.kids),
      updatedAt: now,
    },
    { merge: true }
  );

  const res = NextResponse.json({ ok: true, id: docId });
  if (!existingId) {
    res.cookies.set(cookieKey, docId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}
