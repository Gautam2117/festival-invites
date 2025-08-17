import { NextResponse } from "next/server";
import {
  renderMediaOnLambda,
  getFunctions,
  type AwsRegion,
  type RenderMediaOnLambdaInput,
} from "@remotion/lambda/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      compositionId: "festival-intro" | "image-card";
      inputProps: any;
      quality?: "free" | "hd";
    };

    const compositionId = body.compositionId;
    const quality = body.quality ?? "hd";
    const inputProps = body.inputProps ?? {};

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
      compositionId === "festival-intro"
        ? isFree
          ? { forceWidth: 540, forceHeight: 960 }
          : { forceWidth: 720, forceHeight: 1280 } // bump to 1080×1920 later if you want
        : isFree
        ? { forceWidth: 720, forceHeight: 720 }
        : { forceWidth: 1080, forceHeight: 1080 };

    const args: RenderMediaOnLambdaInput = {
      region,
      functionName,
      serveUrl: serve,
      composition: compositionId,
      inputProps: { ...inputProps, watermark: isFree, tier: isFree ? "free" : "hd" },
      codec: "h264",
      crf: isFree ? 28 : 18,
      jpegQuality: isFree ? 80 : 100,
      audioBitrate: isFree ? "128k" : "192k",
      privacy: "private",
      maxRetries: 1,
      timeoutInMilliseconds: 30_000,
      ...size,
    };

    const { renderId, bucketName } = await renderMediaOnLambda(args);
    return NextResponse.json({ ok: true, renderId, bucketName, functionName });
  } catch (e: any) {
    // surface error for debugging while you iterate
    console.error("QUEUE ERROR", e);
    return NextResponse.json({ error: e?.message || "Queue failed" }, { status: 500 });
  }
}
