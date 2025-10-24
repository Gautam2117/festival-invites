// src/app/api/lambda/progress/route.ts
import { NextResponse } from "next/server";
import { getRenderProgress } from "@remotion/lambda/client";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { makeLimiter, limitOrThrow, getIP } from "@/lib/ops";

import { lambdaCfg, runtime, dynamic } from "../_common";
export { runtime, dynamic };

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

  // First try <renderId>/out.*, then old "renders/<renderId>/out.*"
  const prefixes = ["", "renders/"];

  for (const prefix of prefixes) {
    for (const ext of exts) {
      const Key = `${prefix}${renderId}/out.${ext}`;
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

    // Typed region + default function name from shared helper
    const { region, functionName: defaultFn } = lambdaCfg();
    const functionName = fnFromClient || defaultFn;

    await new Promise(
      (r) => setTimeout(r, Math.random() * 300 + 200) // 200-500 ms extra
    );

    // Ask Remotion for progress
    const progress = await getRenderProgress({
      region, // AwsRegion (narrow type)
      renderId,
      bucketName,
      functionName,
    });

    // If done, try to ensure we return an outKey (so the client can presign)
    if ((progress as any)?.done === true) {
      const s3 = new S3Client({ region });
      const alreadyHasKey =
        typeof (progress as any).outKey === "string" &&
        (progress as any).outKey.length > 0;

      if (alreadyHasKey) {
        return NextResponse.json(progress);
      }

      const probed = await probeOutKey({
        s3,
        bucket: bucketName,
        renderId,
      });

      if (probed) {
        return NextResponse.json({ ...progress, outKey: probed });
      }

      // Done but key not found yet — return done:true and let client retry presign shortly
      return NextResponse.json(progress);
    }

    // Not done yet — pass through live progress (framesRendered, totalFrames, ETA, etc.)
    return NextResponse.json(progress);
  } catch (e: any) {
    const msg = String(e?.message || "");

    // Single-frame export oddity: "Cannot merge stills" → probe S3 and return synthesized result
    if (msg.includes("Cannot merge stills")) {
      try {
        const { region } = lambdaCfg();
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
        return NextResponse.json({
          done: false,
          overallProgress: 0,
          errors: [],
        });
      } catch {
        /* fall through */
      }
    }

    // Transient JSON parsing issue from Lambda API — keep polling
    if (msg.includes("Invalid JSON")) {
      return NextResponse.json({
        done: false,
        overallProgress: 0,
        errors: [],
      });
    }

    const status = msg.includes("Rate") ? 429 : 500;
    console.error("PROGRESS ERROR", e);
    return NextResponse.json({ error: msg || "Progress failed" }, { status });
  }
}
