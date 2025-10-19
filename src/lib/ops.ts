// src/lib/ops.ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis, hasRedis } from "./redis";

/** Sliding window RL per key */
export function makeLimiter(limit: number, windowSec: number) {
  if (!hasRedis()) return null;
  return new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: false,
    prefix: "rl",
  });
}

export async function limitOrThrow(limiter: Ratelimit | null, key: string, hint = "Too many requests") {
  if (!limiter) return; // no redis -> skip (you can fallback to Firestore if you want)
  const res = await limiter.limit(key);
  if (!res.success) {
    const retryAfter = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    const err: any = new Error(hint);
    err.status = 429;
    err.retryAfter = retryAfter;
    throw err;
  }
}

/** Simple global concurrency semaphore for renders */
export async function acquireRenderSlot(max = 6) {
  if (!hasRedis()) return () => {};
  const key = "render:inflight";
  const cur = await redis!.incr(key);
  if (cur === 1) {
    // set TTL so stuck counters auto-clear
    await redis!.expire(key, 300);
  }
  if (cur > max) {
    await redis!.decr(key);
    const e: any = new Error("Busy—please try again in a moment.");
    e.status = 429;
    return Promise.reject(e);
  }
  // release fn
  return async () => {
    try { await redis!.decr(key); } catch {}
  };
}

/** Small helper: retry fn with backoff (for init throttles) */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseMs = 400
): Promise<T> {
  let last: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      last = e;
      const is429 = (e?.message || "").includes("Rate") || e?.status === 429;
      const delay = Math.min(baseMs * Math.pow(1.8, i) + Math.random() * 120, 5000);
      if (i < attempts - 1 && (is429 || true)) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw last;
    }
  }
  throw last;
}

/** tiny helpers */
export function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || (req as any).ip
    || "0.0.0.0";
}
