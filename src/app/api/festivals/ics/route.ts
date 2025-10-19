// src/app/api/festivals/ics/route.ts
import { NextResponse } from "next/server";
import { getAll } from "@/lib/festivals";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("festival") || "diwali";

  const all = getAll(); // returns the JSON list typed as Festival[]
  const fest = all.find((f) => f.slug === slug);

  if (!fest) {
    return NextResponse.json({ error: "Unknown festival" }, { status: 404 });
  }

  // Your JSON field is `date_iso` (not `date`)
  // Compose a simple 9am UTC start time for the .ics
  const dtBase = fest.date_iso.replace(/[-:]/g, "").split("T")[0]; // YYYYMMDD
  const dt = `${dtBase}T090000Z`;

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Festival Invites//EN
BEGIN:VEVENT
DTSTAMP:${dt}
DTSTART:${dt}
SUMMARY:${fest.name}
DESCRIPTION:Made with Festival Invites
END:VEVENT
END:VCALENDAR`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
