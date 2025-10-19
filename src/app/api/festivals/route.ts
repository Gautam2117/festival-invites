import { NextResponse } from "next/server";
import { getUpcoming } from "@/lib/festivals";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 45);
  const region = url.searchParams.get("region") || undefined;
  const tags = url.searchParams.getAll("tag");
  const items = getUpcoming({ days, region, tags: tags.length ? tags : undefined });
  // Strip helper fields if any
  const out = items.map(({ _date, ...rest }) => rest);
  return NextResponse.json({ count: out.length, items: out });
}
