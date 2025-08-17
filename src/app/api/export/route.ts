// src/app/api/export/route.ts
import { NextResponse } from "next/server";
import {
  renderMediaOnLambda,
  renderStillOnLambda,
  getRenderProgress,
  type AwsRegion,
} from "@remotion/lambda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // keep serverless timeout safe—Lambda does the heavy lifting

/* ---------------------------
   Environment (fail fast)
   --------------------------- */
const REGION = (
  (process.env.REMOTION_REGION ??
    process.env.REMOTION_AWS_REGION ??
    "ap-south-1") as AwsRegion
);

const BUCKET =
  process.env.REMOTION_BUCKET_NAME ??
  process.env.REMOTION_AWS_BUCKET ??
  process.env.REMOTION_BUCKET ??
  "";

const FUNCTION_NAME =
  process.env.REMOTION_FUNCTION_NAME ??
  process.env.REMOTION_AWS_FUNCTION ??
  process.env.REMOTION_FUNCTION ??
  "";

const SERVE_URL =
  process.env.REMOTION_SERVE_URL ??
  process.env.NEXT_PUBLIC_REMOTION_SERVE_URL ??
  process.env.REMOTION_SERVE_URL_EXTERNAL ??
  "";

if (!BUCKET || !FUNCTION_NAME || !SERVE_URL) {
  // Throw at module load so misconfigured deploys fail early
  throw new Error(
    "Missing one of REMOTION_REGION / REMOTION_BUCKET_NAME / REMOTION_FUNCTION_NAME / REMOTION_SERVE_URL environment variables"
  );
}

/* ---------------------------
   Request body type
   --------------------------- */
type Body = {
  compositionId: "festival-intro" | "image-card";
  inputProps: Record<string, unknown>;
  // optional override for stills
  imageFormat?: "png" | "jpeg";
  // optional hint from client (free/hd) if you want to change inputProps
  quality?: "free" | "hd";
};

/* ---------------------------
   POST handler — start render & poll
   --------------------------- */
export async function POST(req: Request) {
  try {
    const { compositionId, inputProps, imageFormat = "png" } =
      (await req.json()) as Body;

    const isStill = compositionId === "image-card";
    let renderId: string;

    // 1) Kick off Lambda render (use renderStillOnLambda for stills)
    if (isStill) {
      const res = await renderStillOnLambda({
        // NOTE: do not use `downloadBehavior: { type: "bucket", ... }` here
        // unless your @remotion/lambda package version supports it.
        functionName: FUNCTION_NAME,
        serveUrl: SERVE_URL,
        composition: compositionId,
        inputProps,
        region: REGION,
        imageFormat, // "png" | "jpeg"
        privacy: "public", // makes S3 object readable (signed URL still returned)
      });
      renderId = res.renderId;
    } else {
      const res = await renderMediaOnLambda({
        functionName: FUNCTION_NAME,
        serveUrl: SERVE_URL,
        composition: compositionId,
        inputProps,
        region: REGION,
        codec: "h264",
        privacy: "public",
      });
      renderId = res.renderId;
    }

    // 2) Poll for progress with exponential backoff + jitter
    const timeoutMs = isStill ? 60_000 : 240_000; // 1m for still, 4m for video
    const deadline = Date.now() + timeoutMs;
    let attempt = 0;

    while (Date.now() < deadline) {
      // get status
      const prog = await getRenderProgress({
        renderId,
        // this parameter is expected by the SDK's progress call
        bucketName: BUCKET,
        region: REGION,
        functionName: FUNCTION_NAME,
      });

      // fatal => bubble up
      if (prog.fatalErrorEncountered) {
        throw new Error(prog.errors?.[0]?.message ?? "Render failed on Lambda");
      }

      // finished: getRenderProgress returns outputFile (signed URL) when ready
      if (prog.done && prog.outputFile) {
        return NextResponse.json({
          url: prog.outputFile,
          size: prog.outputSizeInBytes ?? null,
          timeInSeconds: prog.timeToFinish ?? null,
        });
      }

      // backoff: 1s → 1.5s → 2.25s … capped + jitter
      attempt += 1;
      const base = Math.min(10, Math.pow(1.5, attempt));
      const delay = Math.round(1000 * base + Math.random() * 250);
      await new Promise((res) => setTimeout(res, delay));
    }

    throw new Error("Timed out waiting for Lambda render to finish.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Lambda export error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
