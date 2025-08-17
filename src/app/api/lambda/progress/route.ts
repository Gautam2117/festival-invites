// src/app/api/lambda/progress/route.ts
import { NextResponse } from "next/server";
import { getRenderProgress, getFunctions, type AwsRegion } from "@remotion/lambda/client";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const renderId = searchParams.get("renderId");
  const bucketName = searchParams.get("bucketName");
  const fnFromClient = searchParams.get("functionName");
  const region = (process.env.REMOTION_REGION as AwsRegion) || ("ap-south-1" as AwsRegion);

  if (!renderId || !bucketName) {
    return NextResponse.json({ error: "Missing renderId/bucketName" }, { status: 400 });
  }

  try {
    const functionName =
      fnFromClient ||
      process.env.REMOTION_FUNCTION_NAME ||
      (await (async () => {
        const fns = await getFunctions({ region, compatibleOnly: true });
        return fns[0]?.functionName;
      })());

    if (!functionName) {
      return NextResponse.json({ error: "Cannot resolve functionName" }, { status: 500 });
    }

    const progress = await getRenderProgress({ region, renderId, bucketName, functionName });
    return NextResponse.json(progress);
  } catch (e: any) {
    const msg = String(e?.message || "");

    if (msg.includes("Invalid JSON")) {
      return NextResponse.json({ done: false, overallProgress: 0, errors: [] });
    }

    // Handle stills: try to detect the finished image by probing S3
    if (msg.includes("Cannot merge stills")) {
      const s3 = new S3Client({ region });
      for (const ext of ["png", "jpeg"]) {
        const key = `renders/${renderId}/out.${ext}`;
        try {
          await s3.send(new HeadObjectCommand({ Bucket: bucketName!, Key: key }));
          // Found the file – report done with outKey so the client can fetch it
          return NextResponse.json({ done: true, outKey: key, errors: [] });
        } catch {
          // keep trying other extensions
        }
      }
      // Not there yet – report not done
      return NextResponse.json({ done: false, overallProgress: 0, errors: [] });
    }

    console.error("PROGRESS ERROR", e);
    return NextResponse.json({ error: msg || "Progress failed" }, { status: 500 });
  }
}
