// src/app/api/lambda/queue/route.ts
import { NextResponse } from "next/server";
import {
  renderMediaOnLambda,
  getFunctions,
  type AwsRegion,
  type RenderMediaOnLambdaInput,
} from "@remotion/lambda/client";
import {
  acquireRenderSlot,
  retry,
  makeLimiter,
  limitOrThrow,
  getIP,
} from "@/lib/ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const perIpRenderLimiter = makeLimiter(
  Number(process.env.RENDER_PER_IP_PER_MIN || 4),
  60
);

export async function POST(req: Request) {
  try {
    if (process.env.DISABLE_EXPORTS === "true") {
      return NextResponse.json(
        { error: "Exports temporarily paused" },
        { status: 503 }
      );
    }

    const ip = getIP(req);
    await limitOrThrow(
      perIpRenderLimiter,
      `render:${ip}`,
      "Too many exports, please wait."
    );

    const release = await acquireRenderSlot(
      Number(process.env.RENDER_CONCURRENCY_CAP || 6)
    );

    try {
      const body = (await req.json()) as {
        compositionId: "festival-intro" | "image-card";
        inputProps: any;
        quality?: "free" | "hd" | "gif" | "status";
        codec?: "h264" | "h265" | "vp8" | "vp9" | "gif";
        container?: "mp4" | "webm" | "gif";
        encoding?: { width?: number; height?: number; fps?: number };
      };

      const compositionId = body.compositionId;
      const inputProps = body.inputProps ?? {};
      const quality = body.quality ?? "hd";

      const isGif =
        body.codec === "gif" ||
        body.container === "gif" ||
        quality === "gif";

      const codec: RenderMediaOnLambdaInput["codec"] = isGif
        ? "gif"
        : (body.codec as any) || "h264";
      const ext = isGif ? "gif" : "mp4";

      const region =
        (process.env.REMOTION_REGION as AwsRegion) || ("ap-south-1" as AwsRegion);
      const serve =
        process.env.REMOTION_SERVE_URL || process.env.REMOTION_SITE_NAME || "";
      if (!serve) {
        return NextResponse.json(
          { error: "Missing REMOTION_SERVE_URL (or REMOTION_SITE_NAME)" },
          { status: 500 }
        );
      }

      let functionName =
        process.env.REMOTION_FUNCTION_NAME ||
        (await (async () => {
          const fns = await getFunctions({ region, compatibleOnly: true });
          return fns[0]?.functionName;
        })());
      if (!functionName) {
        return NextResponse.json(
          { error: "No compatible Lambda function found. Deploy one first." },
          { status: 500 }
        );
      }

      const isFree = quality === "free";
      const defaultSize =
        compositionId === "festival-intro"
          ? isGif
            ? { forceWidth: 540, forceHeight: 960 }
            : isFree
            ? { forceWidth: 540, forceHeight: 960 }
            : { forceWidth: 720, forceHeight: 1280 }
          : isFree
          ? { forceWidth: 720, forceHeight: 720 }
          : { forceWidth: 1080, forceHeight: 1080 };

      const size = {
        forceWidth: body.encoding?.width ?? defaultSize.forceWidth,
        forceHeight: body.encoding?.height ?? defaultSize.forceHeight,
      };

      const args: RenderMediaOnLambdaInput = {
        region,
        functionName,
        serveUrl: serve,
        composition: compositionId,
        inputProps: { ...inputProps, watermark: isFree, tier: isFree ? "free" : "hd" },
        codec,
        crf: isGif ? undefined : isFree ? 28 : 18,
        jpegQuality: isGif ? undefined : isFree ? 80 : 100,
        audioBitrate: isGif ? undefined : isFree ? "128k" : "192k",
        privacy: "private",
        maxRetries: 1,
        timeoutInMilliseconds: 30_000,
        ...size,
      };

      const { renderId, bucketName } = await retry(
        () => renderMediaOnLambda(args),
        3,
        500
      );

      // ✅ Remotion’s default output key (no "renders/" prefix)
      const outKey = `${renderId}/out.${ext}`;

      return NextResponse.json({
        ok: true,
        renderId,
        bucketName,
        functionName,
        outKey,
      });
    } finally {
      await release?.();
    }
  } catch (e: any) {
    const status = e?.status || 500;
    const headers = e?.retryAfter ? { "Retry-After": String(e.retryAfter) } : undefined;
    console.error("QUEUE ERROR", e);
    return NextResponse.json(
      { error: e?.message || "Queue failed" },
      { status, headers: headers as any }
    );
  }
}
