import { NextResponse } from "next/server";
import {
  renderStillOnLambda,
  type RenderStillOnLambdaInput,
} from "@remotion/lambda/client";

import { lambdaCfg, runtime, dynamic } from "../_common";
export { runtime, dynamic };

export async function POST(req: Request) {
  try {
    /* -------------------------------------------------------------------- */
    const body = (await req.json()) as {
      compositionId: "festival-intro" | "image-card";
      inputProps?: any;
      quality?: "free" | "hd";
      frame?: number;
      format?: "png" | "jpeg";
    };

    // QUICK-PREVIEW ↴ ------------------------------------------------------------
    const isPreview = new URL(req.url).searchParams.get("preview") === "1";
    if (isPreview) body.quality = "free"; // force small & cheap
    // ---------------------------------------------------------------------------

    const compositionId = body.compositionId;
    const quality = body.quality ?? "hd";
    const isFree = quality === "free";
    const inputProps = body.inputProps ?? {};
    const frame = Number.isFinite(body.frame) ? body.frame! : 60;
    const format: "png" | "jpeg" = body.format ?? "png";

    /* -------------------------------------------------------------------- */
    const { region, functionName, serveUrl } = lambdaCfg();

    const size =
      compositionId === "image-card"
        ? isFree
          ? { forceWidth: 540, forceHeight: 540 } // 👈 smaller
          : { forceWidth: 1080, forceHeight: 1080 }
        : isFree
        ? { forceWidth: 540, forceHeight: 960 }
        : { forceWidth: 720, forceHeight: 1280 };

    const args: RenderStillOnLambdaInput = {
      region,
      functionName,
      serveUrl,
      composition: compositionId,
      inputProps: {
        ...inputProps,
        watermark: isFree,
        tier: isFree ? "free" : "hd",
      },
      imageFormat: format,
      privacy: "private",
      maxRetries: 1,
      timeoutInMilliseconds: 120_000,
      frame,
      ...size,
    };

    const { renderId, bucketName } = await renderStillOnLambda(args);

    /* -------------------------------------------------------------------- */
    // 🟢 Remotion’s default still key lives under `renders/…`
    const outKey = `renders/${renderId}/out.${format}`;

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
