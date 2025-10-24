// src/app/api/lambda/probe/route.ts
import { NextResponse } from "next/server";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s3 = new S3Client({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bucketName = searchParams.get("bucketName") || "";
    const outKey = searchParams.get("outKey") || "";
    const renderId = searchParams.get("renderId") || "";
    const ext = (searchParams.get("ext") || "").replace(/^\./, "");

    if (!bucketName) {
      return NextResponse.json({ error: "bucketName is required" }, { status: 400 });
    }

    // Accept: bucketName + (outKey) OR (renderId + ext)
    const objectKey =
      outKey || (renderId && ext ? `renders/${renderId}/out.${ext}` : null);

    if (!objectKey) {
      return NextResponse.json(
        { error: "Provide outKey OR renderId+ext" },
        { status: 400 }
      );
    }

    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );
      // Exists
      return NextResponse.json(
        { exists: true },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    } catch (err: any) {
      const code = err?.$metadata?.httpStatusCode;
      const name = err?.name || err?.Code || "";
      const msg = err?.message || "";

      // Not found → just say not exists
      if (code === 404 || name === "NotFound") {
        return NextResponse.json(
          { exists: false },
          {
            status: 200,
            headers: { "Cache-Control": "no-store" },
          }
        );
      }

      // Access denied → surface for quicker debugging
      if (code === 403 || name === "AccessDenied") {
        return NextResponse.json(
          {
            exists: false,
            error:
              "AccessDenied: s3:GetObject denied for this key. Update IAM to allow GetObject/HeadObject on arn:aws:s3:::" +
              bucketName +
              "/*",
          },
          { status: 200 }
        );
      }

      // Other S3 errors
      return NextResponse.json(
        { exists: false, error: `${name || "S3Error"}: ${msg}` },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Probe failed" },
      { status: 500 }
    );
  }
}
