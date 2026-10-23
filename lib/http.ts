import "server-only";
import type { NextRequest } from "next/server";

const WINDOW_MS = 10 * 60_000;
const MAX_HITS = 120; // a whole computer lab can share one public IP
const hits = new Map<string, number[]>();

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/** Per-instance sliding-window limit; returns a 429 response once exceeded. */
export function rateLimit(request: NextRequest): Response | null {
  const ip = clientIp(request);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_HITS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return errorResponse(429, "rate_limited", "Too many attempts. Please try again in a few minutes.", {
      "Retry-After": String(retryAfter),
    });
  }

  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (now - times[times.length - 1] > WINDOW_MS) hits.delete(key);
  }
  return null;
}

export function serverTiming(entries: Record<string, number>) {
  return Object.entries(entries)
    .map(([name, ms]) => `${name};dur=${ms.toFixed(1)}`)
    .join(", ");
}

export function errorResponse(status: number, error: string, message: string, headers: Record<string, string> = {}) {
  return Response.json({ error, message }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
