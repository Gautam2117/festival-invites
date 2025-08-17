// src/app/api/lambda/probe/route.ts
import { NextResponse } from "next/server";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bucketName = searchParams.get("bucketName");
  const outKey = searchParams.get("outKey");
  const region = process.env.REMOTION_REGION || "ap-south-1";

  if (!bucketName || !outKey) {
    return NextResponse.json({ error: "Missing bucketName/outKey" }, { status: 400 });
  }

  try {
    const s3 = new S3Client({ region });
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: outKey }));
    // Object exists
    return NextResponse.json({ exists: true });
  } catch (err: any) {
    // 404/NotFound -> not yet; other errors -> surface message but keep 200
    const code = err?.$metadata?.httpStatusCode;
    if (code === 404 || err?.name === "NotFound") {
      return NextResponse.json({ exists: false });
    }
    return NextResponse.json({ exists: false, error: String(err?.message || err) });
  }
}
