import { NextResponse } from "next/server";
import { adminDb } from "@/lib/fbAdmin";

export const runtime = "nodejs";

function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || (req as any).ip
      || "0.0.0.0";
}
function hashIP(ip: string) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export async function POST(req: Request, { params }: { params: { inviteId: string } }) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref") || "-";
  const ua = req.headers.get("user-agent") || "-";
  const ipHash = hashIP(getIP(req));
  const now = Date.now();

  // Best-effort unique per invite via cookie
  const cookieKey = `u_${params.inviteId}`;
  const hasCookie = (req.headers.get("cookie") || "").includes(cookieKey + "=");

  // Append event row (write-optimized)
  await adminDb.collection("invite_events").add({
    type: "page_view",
    inviteId: params.inviteId,
    ref,
    ua,
    ipHash,
    at: now,
  });

  // Increment counters on the invite
  const invRef = adminDb.collection("invites").doc(params.inviteId);
  await adminDb.runTransaction(async (trx) => {
    const snap = await trx.get(invRef);
    if (!snap.exists) return;
    const cur = snap.data() as any;
    trx.set(
      invRef,
      {
        views: (cur.views || 0) + 1,
        uniques: (cur.uniques || 0) + (hasCookie ? 0 : 1),
        lastViewedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  const res = NextResponse.json({ ok: true });
  if (!hasCookie) {
    res.headers.set("Set-Cookie", `${cookieKey}=1; Path=/; Max-Age=86400; SameSite=Lax`);
  }
  return res;
}
