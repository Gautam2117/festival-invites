// src/app/api/export/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Local export is disabled in this deployment. Use /api/lambda/queue (video) or /api/lambda/still (image).",
    },
    { status: 400 }
  );
}
