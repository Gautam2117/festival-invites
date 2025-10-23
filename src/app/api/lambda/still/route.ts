// src/app/api/lambda/still/route.ts
import { NextResponse } from "next/server";
import {
  renderStillOnLambda,
  type RenderStillOnLambdaInput,
} from "@remotion/lambda/client";

import { lambdaCfg, runtime, dynamic } from "../_common";
export { runtime, dynamic };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      compositionId: "festival-intro" | "image-card";
      inputProps?: any;
      quality?: "free" | "hd";
      frame?: number;
      format?: "png" | "jpeg";
    };

    const compositionId = body.compositionId;
    const quality = body.quality ?? "hd";
    const inputProps = body.inputProps ?? {};
    const frame = Number.isFinite(body.frame as number) ? (body.frame as number) : 60;
    const format: "png" | "jpeg" = body.format ?? "png";

    // typed + validated config (kept in one place)
    const { region, functionName, serveUrl } = lambdaCfg();

    const isFree = quality === "free";

    // Sizes that match your queue route’s logic
    const size =
      compositionId === "image-card"
        ? isFree
          ? { forceWidth: 720, forceHeight: 720 }
          : { forceWidth: 1080, forceHeight: 1080 }
        : isFree
          ? { forceWidth: 540, forceHeight: 960 }
          : { forceWidth: 720, forceHeight: 1280 };

    const args: RenderStillOnLambdaInput = {
      region,
      functionName,
      serveUrl,
      composition: compositionId,
      inputProps: { ...inputProps, watermark: isFree, tier: isFree ? "free" : "hd" },
      imageFormat: format,
      privacy: "private",
      maxRetries: 1,
      timeoutInMilliseconds: 120_000,
      frame,
      ...size,
    };

    const { renderId, bucketName } = await renderStillOnLambda(args);

    // ✅ IMPORTANT: Remotion’s default output key has NO "renders/" prefix
    const outKey = `${renderId}/out.${format}`;

    return NextResponse.json({
      ok: true,
      renderId,
      bucketName,
      functionName,
      outKey,
      ext: format,
    });
  } catch (e: any) {
    console.error("STILL QUEUE ERROR", e);
    return NextResponse.json(
      { error: e?.message || "Still queue failed" },
      { status: 500 }
    );
  }
}
