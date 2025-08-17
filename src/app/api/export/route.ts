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
export const maxDuration = 300;

// ---- Env (fail fast) -------------------------------------------------
const REGION = (process.env.REMOTION_REGION ?? "ap-south-1") as AwsRegion;
const BUCKET = process.env.REMOTION_BUCKET_NAME!;
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const SERVE_URL = process.env.REMOTION_SERVE_URL!;

if (!BUCKET || !FUNCTION_NAME || !SERVE_URL) {
  throw new Error(
    "Missing env: REMOTION_REGION / REMOTION_BUCKET_NAME / REMOTION_FUNCTION_NAME / REMOTION_SERVE_URL"
  );
}

// ---- Types ------------------------------------------------------------
type Body = {
  compositionId: "festival-intro" | "image-card";
  inputProps: Record<string, unknown>;
  imageFormat?: "png" | "jpeg";
};

// ---- Route ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const { compositionId, inputProps, imageFormat = "png" } =
      (await req.json()) as Body;

    const isStill = compositionId === "image-card";
    let renderId: string;

    if (isStill) {
      const res = await renderStillOnLambda({
        functionName: FUNCTION_NAME,
        serveUrl: SERVE_URL,
        composition: compositionId,
        inputProps,
        region: REGION,
        imageFormat,
        privacy: "public",
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

    const timeoutMs = isStill ? 60_000 : 240_000;
    const deadline = Date.now() + timeoutMs;

    let attempt = 0;
    while (Date.now() < deadline) {
      const prog = await getRenderProgress({
        renderId,
        bucketName: BUCKET,
        region: REGION,
        functionName: FUNCTION_NAME,
      });

      if (prog.fatalErrorEncountered) {
        throw new Error(prog.errors?.[0]?.message ?? "Render failed on Lambda");
      }

      if (prog.done && prog.outputFile) {
        return NextResponse.json({
          url: prog.outputFile,
          size: prog.outputSizeInBytes,
          timeInSeconds: prog.timeToFinish,
        });
      }

      attempt += 1;
      const delay =
        1000 * Math.min(10, Math.pow(1.5, attempt)) + Math.random() * 250;
      await new Promise((r) => setTimeout(r, delay));
    }

    throw new Error("Timed out waiting for Lambda render to finish.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lambda export error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
