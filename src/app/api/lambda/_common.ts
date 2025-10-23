// src/app/api/lambda/_common.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { AwsRegion } from "@remotion/lambda/client";

/** Allow only valid AWS regions (keeps TS happy and catches typos early). */
const VALID: readonly AwsRegion[] = [
  "eu-central-1","eu-central-2","eu-west-1","eu-west-2","eu-west-3",
  "eu-south-1","eu-north-1","us-east-1","us-east-2","us-west-1","us-west-2",
  "af-south-1","ap-south-1","ap-southeast-1","ap-southeast-2","ap-southeast-4",
  "ap-east-1","ap-northeast-1","ap-northeast-2","ap-northeast-3",
  "ca-central-1","me-south-1","sa-east-1",
];

/* ----------------------------- tiny helpers ------------------------------ */
const toBool = (v?: string | null) =>
  v === "true" || v === "1" || (v ?? "").toLowerCase() === "yes";

const toInt = (v: string | undefined, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function normalizeBaseUrl(u?: string | null) {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    // strip trailing slashes for consistent joining
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return undefined;
  }
}

/** Pick a typed & validated AWS region (falls back to ap-south-1). */
function pickRegion(): AwsRegion {
  const r =
    process.env.REMOTION_AWS_REGION ||
    process.env.REMOTION_REGION ||
    process.env.AWS_REGION ||
    "ap-south-1";

  if (!VALID.includes(r as AwsRegion)) {
    throw new Error(
      `Invalid AWS region: "${r}". Set REMOTION_REGION to one of: ${VALID.join(
        ", "
      )}`
    );
  }
  return r as AwsRegion;
}

/* ------------------------------ main export ------------------------------ */
/**
 * Centralized, typed config used by all Lambda routes.
 * - Validates region
 * - Requires function name
 * - Uses SERVE_URL (or falls back to SITE_NAME)
 * - Exposes bucketName and publicBase for convenience
 * - Emits helpful warnings instead of crashing where possible
 */
export function lambdaCfg() {
  const region = pickRegion();

  const functionName = process.env.REMOTION_FUNCTION_NAME?.trim();
  if (!functionName) throw new Error("Missing REMOTION_FUNCTION_NAME");

  // Prefer a full serve URL; fall back to Remotion site name if present.
  const serveUrl =
    process.env.REMOTION_SERVE_URL?.trim() ||
    process.env.REMOTION_SITE_NAME?.trim();
  if (!serveUrl) {
    throw new Error("Missing REMOTION_SERVE_URL or REMOTION_SITE_NAME");
  }

  const bucketName = process.env.REMOTION_BUCKET_NAME?.trim();

  const publicBase =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (!publicBase) {
    console.warn(
      "[env] NEXT_PUBLIC_BASE_URL is not set or invalid. Public links/sharing may fail."
    );
  }

  // Soft warnings that help prevent subtle prod bugs:
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    process.env.NEXT_PUBLIC_BASE_URL &&
    process.env.NEXT_PUBLIC_APP_URL !== process.env.NEXT_PUBLIC_BASE_URL
  ) {
    console.warn(
      "[env] NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_BASE_URL differ. Keep only NEXT_PUBLIC_BASE_URL for consistency."
    );
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    // Fine in AWS (role-based auth), but useful when testing locally:
    console.warn(
      "[env] AWS credentials not found in env. Ensure Lambda has IAM permissions or set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY for local runs."
    );
  }

  return { region, functionName, serveUrl, bucketName, publicBase };
}

/* -------------------------- optional convenience ------------------------- */
/** Caps & flags you can import anywhere (keeps logic consistent). */
export const LIMITS = {
  RENDER_CONCURRENCY_CAP: toInt(process.env.RENDER_CONCURRENCY_CAP, 6),
  RENDER_PER_IP_PER_MIN: toInt(process.env.RENDER_PER_IP_PER_MIN, 4),
  PAYMENTS_PER_IP_PER_MIN: toInt(process.env.PAYMENTS_PER_IP_PER_MIN, 8),
  WISH_PER_IP_PER_MIN: toInt(process.env.WISH_PER_IP_PER_MIN, 2),
  PROGRESS_PER_IP_PER_MIN: toInt(process.env.PROGRESS_PER_IP_PER_MIN, 30),
};

export const FLAGS = {
  DISABLE_EXPORTS: toBool(process.env.DISABLE_EXPORTS),
};
