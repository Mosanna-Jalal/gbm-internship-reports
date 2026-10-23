import { connection, type NextRequest } from "next/server";
import { getReports } from "@/lib/db";
import { errorResponse, rateLimit, serverTiming } from "@/lib/http";
import { normalizeRoll } from "@/lib/roll";

// The report PDF itself. Shown inline by default; ?download=1 saves it as a file.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/reports/[roll]/pdf">) {
  await connection();
  const started = performance.now();

  const roll = normalizeRoll((await ctx.params).roll);
  if (!roll) return errorResponse(400, "invalid_roll", "Enter a valid university roll number.");

  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const { col, connectMs } = await getReports();
    const queryStarted = performance.now();
    const doc = await col.findOne(
      { $or: [{ universityRoll: roll }, { registrationNo: roll }] },
      { projection: { pdf: 1, fileName: 1, sha256: 1, contentType: 1 } },
    );
    const queryMs = performance.now() - queryStarted;
    if (!doc) return errorResponse(404, "not_found", `No report is registered for ${roll}.`);

    // Copy into a standalone buffer: the driver's Binary is a view over a larger one.
    const bytes = new Uint8Array(doc.pdf.buffer.subarray(0, doc.pdf.position));
    const disposition = request.nextUrl.searchParams.has("download") ? "attachment" : "inline";
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
        "Server-Timing": serverTiming({
          "db-connect": connectMs,
          "db-query": queryMs,
          total: performance.now() - started,
        }),
      },
    });
  } catch (err) {
    console.error("[api/reports/pdf] download failed", err);
    return errorResponse(503, "db_unavailable", "The report database is not reachable right now. Please try again shortly.");
  }
}
