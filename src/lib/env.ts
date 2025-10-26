// src/lib/env.ts
/**
 * Maximum renders the browser is allowed to queue in parallel.
 * Falls back to 6 if the NEXT_PUBLIC var is missing or not a number.
 */
export const MAX_PARALLEL_RENDERS = Number(
  process.env.NEXT_PUBLIC_CONCURRENCY_CAP ?? 6
);
