// src/app/api/lambda/file/route.ts
import { NextResponse } from "next/server";
import { presignUrl, type AwsRegion } from "@remotion/lambda/client";

export { runtime, dynamic } from "../_common";

/**
 * Presign a single S3 object that Remotion produced.
 * Query: ?bucketName=...&outKey=...&ext=mp4|png|jpeg (renderId optional as fallback)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bucketName = searchParams.get("bucketName");
    const outKeyParam = searchParams.get("outKey");
    const renderId = searchParams.get("renderId"); // optional fallback
    const ext = searchParams.get("ext") || "mp4";  // "mp4" | "png" | "jpeg"
    const region =
      (process.env.REMOTION_REGION as AwsRegion) || ("ap-south-1" as AwsRegion);

    if (!bucketName) {
      return NextResponse.json({ error: "Missing bucketName" }, { status: 400 });
    }

    // Remotion’s default out key is <renderId>/out.<ext> (no "renders/" prefix)
    const objectKey =
      outKeyParam ?? (renderId ? `${renderId}/out.${ext}` : null);

    if (!objectKey) {
      return NextResponse.json({ error: "Pass outKey or renderId" }, { status: 400 });
    }

    const url = await presignUrl({
      region,
      bucketName,
      objectKey,
      expiresInSeconds: 3600,
    });

    return NextResponse.json({ url, objectKey });
  } catch (e: any) {
    console.error("SIGN ERROR", e);
    return NextResponse.json({ error: e?.message || "Sign failed" }, { status: 500 });
  }
}
