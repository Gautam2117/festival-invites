// src/app/api/lambda/progress/route.ts
import { NextResponse } from "next/server";
import {
  getRenderProgress,
  getFunctions,
  type AwsRegion,
} from "@remotion/lambda/client";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { makeLimiter, limitOrThrow, getIP } from "@/lib/ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const perIpProgressLimiter = makeLimiter(
  Number(process.env.PROGRESS_PER_IP_PER_MIN || 30),
  60
);

// Try both key layouts and a set of likely file extensions.
async function probeOutKey(opts: {
  s3: S3Client;
  bucket: string;
  renderId: string;
  extHints?: string[]; // in priority order
}) {
  const { s3, bucket, renderId } = opts;
  const exts = opts.extHints?.length
    ? opts.extHints
    : ["mp4", "gif", "webm", "png", "jpeg"];

  const prefixes = ["", "renders/"]; // first try <renderId>/out.*, then renders/<renderId>/out.*

  for (const prefix of prefixes) {
    for (const ext of exts) {
      const Key = `${prefix}${prefix ? "" : ""}${renderId}/out.${ext}`;
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key }));
        return Key; // found!
      } catch {
        /* keep trying */
      }
    }
  }

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const renderId = searchParams.get("renderId") || "";
  const bucketName = searchParams.get("bucketName") || "";
  const fnFromClient = searchParams.get("functionName") || "";
  const region =
    (process.env.REMOTION_REGION as AwsRegion) || ("ap-south-1" as AwsRegion);

  if (!renderId || !bucketName) {
    return NextResponse.json(
      { error: "Missing renderId/bucketName" },
      { status: 400 }
    );
  }

  try {
    // Per-IP flood limit
    const ip = getIP(req as any);
    await limitOrThrow(
      perIpProgressLimiter,
      `prog:${ip}`,
      "Too many progress checks."
    );

    // Resolve function name
    const functionName =
      fnFromClient ||
      process.env.REMOTION_FUNCTION_NAME ||
      (await (async () => {
        const fns = await getFunctions({ region, compatibleOnly: true });
        return fns[0]?.functionName;
      })());

    if (!functionName) {
      return NextResponse.json(
        { error: "Cannot resolve functionName" },
        { status: 500 }
      );
    }

    // Ask Remotion for progress
    const progress = await getRenderProgress({
      region,
      renderId,
      bucketName,
      functionName,
    });

    // If Remotion already signals completion, try to attach an outKey for the client.
    if ((progress as any)?.done === true) {
      const s3 = new S3Client({ region });

      // If Remotion already returned an outKey, pass it through.
      const alreadyHasKey =
        typeof (progress as any).outKey === "string" &&
        (progress as any).outKey.length > 0;

      if (alreadyHasKey) {
        return NextResponse.json(progress);
      }

      // Otherwise probe S3 to figure it out.
      const probed = await probeOutKey({
        s3,
        bucket: bucketName,
        renderId,
      });

      if (probed) {
        return NextResponse.json({ ...progress, outKey: probed });
      }

      // Done but not found (rare race) — still return done:true so the client can retry presign shortly.
      return NextResponse.json(progress);
    }

    // Not done yet — just pass through live progress (framesRendered, totalFrames, ETA, etc.)
    return NextResponse.json(progress);
  } catch (e: any) {
    const msg = String(e?.message || "");

    // When Lambda says it "Cannot merge stills", it’s usually a single-frame export:
    // fall back to S3 probing to determine the real outKey (and mark done if we find it).
    if (msg.includes("Cannot merge stills")) {
      try {
        const s3 = new S3Client({ region });
        const probed = await probeOutKey({
          s3,
          bucket: bucketName,
          renderId,
          // Prefer still extensions first
          extHints: ["png", "jpeg", "mp4", "gif", "webm"],
        });
        if (probed) {
          return NextResponse.json({
            done: true,
            outKey: probed,
            errors: [],
          });
        }
        // Not found yet — keep the client polling
        return NextResponse.json({
          done: false,
          overallProgress: 0,
          errors: [],
        });
      } catch {
        /* fall through to generic handler */
      }
    }

    // Another common transient parsing hiccup from the Lambda API
    if (msg.includes("Invalid JSON")) {
      return NextResponse.json({
        done: false,
        overallProgress: 0,
        errors: [],
      });
    }

    // Signal throttling to the client — your UI already backs off on 429
    const status = msg.includes("Rate") ? 429 : 500;
    console.error("PROGRESS ERROR", e);
    return NextResponse.json(
      { error: msg || "Progress failed" },
      { status }
    );
  }
}
