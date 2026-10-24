import "server-only";
import type { NextRequest } from "next/server";

const WINDOW_MS = 10 * 60_000;
const LIMITS = {
  read: 120, // a whole computer lab can share one public IP
  write: 12,
} as const;
const hits = new Map<string, number[]>();

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/** Per-instance sliding-window limit; returns a 429 response once exceeded. */
export function rateLimit(request: NextRequest, bucket: keyof typeof LIMITS = "read"): Response | null {
  const key = `${bucket}:${clientIp(request)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= LIMITS[bucket]) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return errorResponse(429, "rate_limited", "Too many attempts. Please try again in a few minutes.", {
      "Retry-After": String(retryAfter),
    });
  }

  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (now - times[times.length - 1] > WINDOW_MS) hits.delete(k);
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

/** Streams a stored report PDF back to the browser. */
export function pdfResponse(
  doc: { pdf: { buffer: Uint8Array; position: number }; fileName: string; sha256: string; contentType?: string },
  disposition: "inline" | "attachment",
  timing: Record<string, number>,
) {
  // Copy into a standalone buffer: the driver's Binary is a view over a larger one.
  const bytes = new Uint8Array(doc.pdf.buffer.subarray(0, doc.pdf.position));
  const asciiName = doc.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return new Response(bytes, {
    headers: {
      "Content-Type": doc.contentType || "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      "X-Content-SHA256": doc.sha256,
      "Server-Timing": serverTiming(timing),
    },
  });
}
