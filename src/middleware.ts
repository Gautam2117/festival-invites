// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { makeLimiter } from "./lib/ops";
import { getIP } from "./lib/ops";

const renderLimiter = makeLimiter(
  Number(process.env.RENDER_PER_IP_PER_MIN || 4),
  60
);
const paymentsLimiter = makeLimiter(
  Number(process.env.PAYMENTS_PER_IP_PER_MIN || 8),
  60
);
const wishesLimiter = makeLimiter(
  Number(process.env.WISH_PER_IP_PER_MIN || 2),
  60
);
const progressLimiter = makeLimiter(
  Number(process.env.PROGRESS_PER_IP_PER_MIN || 30),
  60
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIP(req as any);

  try {
    if (pathname.startsWith("/api/payments")) {
      await paymentsLimiter?.limit(`pay:${ip}`);
    }
    if (pathname.startsWith("/api/wishes/") && req.method === "POST") {
      await wishesLimiter?.limit(`wish:${ip}`);
    }
    if (pathname.startsWith("/api/lambda/progress")) {
      await progressLimiter?.limit(`prog:${ip}`);
    }
    if (
      (pathname.startsWith("/api/lambda/queue") ||
        pathname.startsWith("/api/lambda/still") ||
        pathname.startsWith("/api/lambda/status") ||
        pathname.startsWith("/api/lambda/gif")) &&
      req.method === "POST"
    ) {
      await renderLimiter?.limit(`render:${ip}`);
      if (process.env.DISABLE_EXPORTS === "true") {
        return NextResponse.json({ error: "Exports temporarily paused" }, { status: 503 });
      }
    }
  } catch (e: any) {
    const retry = e?.retryAfter ? { "Retry-After": String(e.retryAfter) } : {};
    return NextResponse.json({ error: e?.message || "Rate limited" }, { status: e?.status || 429, headers: retry as any });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
