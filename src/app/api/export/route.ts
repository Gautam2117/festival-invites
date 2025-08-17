// src/app/api/export/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // safe serverless limit; Lambda does the heavy work

// Environment (fail fast)
const REGION = process.env.REMOTION_REGION ?? process.env.REMOTION_AWS_REGION ?? "ap-south-1";
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
  throw new Error(
    "Missing env: REMOTION_REGION / REMOTION_BUCKET_NAME / REMOTION_FUNCTION_NAME / REMOTION_SERVE_URL"
  );
}

type Body = {
  compositionId: "festival-intro" | "image-card";
  inputProps: Record<string, unknown>;
  imageFormat?: "png" | "jpeg";
  quality?: "free" | "hd";
};

export async function POST(req: Request) {
  try {
    const { compositionId, inputProps, imageFormat = "png" } = (await req.json()) as Body;

    const isStill = compositionId === "image-card";

    // Dynamically import @remotion/lambda at runtime so Next.js build doesn't try to bundle Studio.
    // Use `as any` to avoid strict type mismatches at build time.
    const lambda = (await import("@remotion/lambda")) as any;
    const { renderMediaOnLambda, renderStillOnLambda, getRenderProgress } = lambda;

    let renderId: string;

    if (isStill) {
      const start = await renderStillOnLambda({
        functionName: FUNCTION_NAME,
        serveUrl: SERVE_URL,
        composition: compositionId,
        inputProps,
        region: REGION as any,
        imageFormat, // "png" | "jpeg"
        // privacy public makes objects public; keep signed URL behavior safe on the SDK side
        privacy: "public",
      } as any);
      renderId = start.renderId;
    } else {
      const start = await renderMediaOnLambda({
        functionName: FUNCTION_NAME,
        serveUrl: SERVE_URL,
        composition: compositionId,
        inputProps,
        region: REGION as any,
        codec: "h264",
        privacy: "public",
      } as any);
      renderId = start.renderId;
    }

    // Poll for progress
    const timeoutMs = isStill ? 60_000 : 240_000;
    const deadline = Date.now() + timeoutMs;
    let attempt = 0;

    while (Date.now() < deadline) {
      const prog = await getRenderProgress({
        renderId,
        bucketName: BUCKET,
        region: REGION as any,
        functionName: FUNCTION_NAME,
      } as any);

      if (prog?.fatalErrorEncountered) {
        throw new Error(prog.errors?.[0]?.message ?? "Render failed on Lambda");
      }

      if (prog?.done && prog?.outputFile) {
        return NextResponse.json({
          url: prog.outputFile, // presigned URL (or public URL depending on SDK flags)
          size: prog.outputSizeInBytes ?? null,
          timeInSeconds: prog.timeToFinish ?? null,
        });
      }

      attempt += 1;
      const delay = Math.round(1000 * Math.min(10, Math.pow(1.5, attempt)) + Math.random() * 250);
      await new Promise((r) => setTimeout(r, delay));
    }

    throw new Error("Timed out waiting for Lambda render to finish.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown Lambda export error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
