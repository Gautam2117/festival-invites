import { NextResponse } from "next/server";
import {
  renderStillOnLambda,
  getFunctions,
  type AwsRegion,
  type RenderStillOnLambdaInput,
} from "@remotion/lambda/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      compositionId: "festival-intro" | "image-card";
      inputProps: any;
      quality?: "free" | "hd";
      frame?: number;
      format?: "png" | "jpeg";
    };

    const compositionId = body.compositionId;
    const quality = body.quality ?? "hd";
    const inputProps = body.inputProps ?? {};
    const frame = Number.isFinite(body.frame) ? (body.frame as number) : 60;
    const format = body.format ?? "png";

    const region = (process.env.REMOTION_REGION as AwsRegion) || ("ap-south-1" as AwsRegion);
    const serve = process.env.REMOTION_SERVE_URL || process.env.REMOTION_SITE_NAME || "";
    if (!serve) return NextResponse.json({ error: "Missing REMOTION_SERVE_URL (or REMOTION_SITE_NAME)" }, { status: 500 });

    let functionName =
      process.env.REMOTION_FUNCTION_NAME ||
      (await (async () => {
        const fns = await getFunctions({ region, compatibleOnly: true });
        return fns[0]?.functionName;
      })());
    if (!functionName) {
      return NextResponse.json({ error: "No compatible Lambda function found. Deploy one first." }, { status: 500 });
    }

    const isFree = quality === "free";
    const size =
      compositionId === "image-card"
        ? isFree ? { forceWidth: 720,  forceHeight: 720 }  : { forceWidth: 1080, forceHeight: 1080 }
        : isFree ? { forceWidth: 540,  forceHeight: 960 }  : { forceWidth: 720,  forceHeight: 1280 };

    const args: RenderStillOnLambdaInput = {
      region,
      functionName,
      serveUrl: serve,
      composition: compositionId,
      inputProps: { ...inputProps, watermark: isFree, tier: isFree ? "free" : "hd" },
      imageFormat: format,
      privacy: "private",
      maxRetries: 1,
      timeoutInMilliseconds: 120_000, // ↑ give stills more time
      frame,
      ...size,
    };

    const { renderId, bucketName } = await renderStillOnLambda(args);
    const outKey = `renders/${renderId}/out.${format}`;
    return NextResponse.json({ ok: true, renderId, bucketName, functionName, outKey, ext: format });
  } catch (e: any) {
    console.error("STILL QUEUE ERROR", e);
    return NextResponse.json({ error: e?.message || "Still queue failed" }, { status: 500 });
  }
}