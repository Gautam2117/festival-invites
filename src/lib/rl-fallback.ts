// Very rough per-IP per-minute fallback using Firestore counters + TTL
import { adminDb } from "@/lib/fbAdmin";

export async function limitFSOrThrow(key: string, limit = 5) {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const id = `${key}:${minute}`;
  const ref = adminDb.collection("ratelimits").doc(id);
  const doc = await ref.get();
  let count = 0;
  if (doc.exists) {
    count = (doc.data()?.count as number) || 0;
  }
  if (count >= limit) {
    const e: any = new Error("Too many requests");
    e.status = 429;
    throw e;
  }
  await ref.set({ count: count + 1, ts: now }, { merge: true });
  // Optionally run a scheduled function to TTL old docs.
}
