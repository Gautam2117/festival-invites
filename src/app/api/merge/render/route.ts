import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_ROWS = 300; // guardrail

type Row = Record<string, string>;
type BaseProps = {
  templateSlug: string;           // e.g. "diwali" (for bg/music defaults if you want later)
  title: string;
  names?: string;
  date?: string;
  venue?: string;
  bg?: string | null;
  theme?: string | null;
  language?: string | null;
  isWish?: boolean;
  // watermark tier: force image still export (no audio)
  tier?: "free" | "hd";
  watermark?: boolean;
  watermarkStrategy?: "ribbon" | "tile" | "ribbon+tile";
  wmSeed?: number;
  wmText?: string;
  wmOpacity?: number;
};

function applyMerge(s: string | undefined, row: Row) {
  if (!s) return s;
  // Supports {name} and any {colName} token
  return s.replace(/\{([a-z0-9_-]+)\}/gi, (_, key) => {
    const v = row[key];
    return typeof v === "string" && v.trim().length ? v.trim() : _;
  });
}

export async function POST(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    if (!baseUrl) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_BASE_URL" }, { status: 500 });
    }

    const body = await req.json();
    const rows: Row[] = Array.isArray(body?.rows) ? body.rows : [];
    const base: BaseProps = {
      templateSlug: String(body?.base?.templateSlug || "diwali"),
      title: String(body?.base?.title || "Invitation"),
      names: typeof body?.base?.names === "string" ? body.base.names : "",
      date: typeof body?.base?.date === "string" ? body.base.date : "",
      venue: typeof body?.base?.venue === "string" ? body.base.venue : "",
      bg: body?.base?.bg ?? undefined,
      theme: body?.base?.theme ?? undefined,
      language: body?.base?.language ?? undefined,
      isWish: !!body?.base?.isWish,
      tier: body?.base?.tier === "hd" ? "hd" : "free",
      watermark: !!body?.base?.watermark,
      watermarkStrategy: body?.base?.watermarkStrategy || "ribbon",
      wmSeed: typeof body?.base?.wmSeed === "number" ? body.base.wmSeed : 0,
      wmText: body?.base?.wmText || "Festival Invites — FREE PREVIEW",
      wmOpacity: typeof body?.base?.wmOpacity === "number" ? body.base.wmOpacity : 0.18,
    };

    if (!rows.length) {
      return NextResponse.json({ error: "rows required" }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Too many rows (>${MAX_ROWS})` }, { status: 400 });
    }

    // Always render still image from ImageCard comp
    const compositionId = "image-card";

    // Queue all renders (parallel but not too crazy; small batches)
    const chunk = <T,>(arr: T[], n: number) =>
      arr.reduce<T[][]>((acc, cur, i) => {
        (acc[Math.floor(i / n)] ||= []).push(cur);
        return acc;
      }, []);

    const batches = chunk(rows, 25);
    const queued: Array<{
      index: number;
      name: string | undefined;
      renderId: string;
      bucketName: string;
      functionName?: string;
      outKey?: string;
      ext: "png";
    }> = [];

    let rowIndex = 0;
    for (const group of batches) {
      const results = await Promise.all(
        group.map(async (row) => {
          const title = applyMerge(base.title, row);
          const names = applyMerge(base.names, row);
          const date = applyMerge(base.date, row);
          const venue = applyMerge(base.venue, row);

          const payload: any = {
            compositionId,
            quality: "merge",
            inputProps: {
              title,
              names,
              date,
              venue,
              bg: base.bg ?? undefined,
              tier: base.tier,
              watermark: base.watermark,
              watermarkStrategy: base.watermarkStrategy,
              wmSeed: base.wmSeed,
              wmText: base.wmText,
              wmOpacity: base.wmOpacity,
              isWish: !!base.isWish,
            },
            frame: 60,
            format: "png",
          };

          const r = await fetch(`${baseUrl}/api/lambda/still`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const j = await r.json();
          if (!r.ok || !j?.renderId || !j?.bucketName) {
            throw new Error(j?.error || "Queue error");
          }

          const item = {
            index: rowIndex++,
            name: row.name,
            renderId: j.renderId as string,
            bucketName: j.bucketName as string,
            functionName: j.functionName as string | undefined,
            outKey: j.outKey as string | undefined,
            ext: "png" as const,
          };
          queued.push(item);
          return item;
        })
      );
      // results unused; queued already updated
    }

    return NextResponse.json({ count: queued.length, items: queued });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
