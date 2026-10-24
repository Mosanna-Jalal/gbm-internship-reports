import { connection, type NextRequest } from "next/server";
import { getReports } from "@/lib/db";
import { errorResponse, pdfResponse, rateLimit } from "@/lib/http";

// A report PDF by student id, as linked from the /reports list.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/download/[id]">) {
  await connection();
  const started = performance.now();

  const id = (await ctx.params).id;
  if (!/^[a-z0-9]{2,40}$/.test(id)) return errorResponse(400, "invalid_id", "Unknown report.");

  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const { col, connectMs } = await getReports();
    const queryStarted = performance.now();
    const doc = await col.findOne({ studentId: id }, { projection: { pdf: 1, fileName: 1, sha256: 1, contentType: 1 } });
    const queryMs = performance.now() - queryStarted;
    if (!doc) return errorResponse(404, "not_found", "This report is no longer available. Reload the list.");

    const disposition = request.nextUrl.searchParams.has("view") ? "inline" : "attachment";
    return pdfResponse(doc, disposition, { "db-connect": connectMs, "db-query": queryMs, total: performance.now() - started });
  } catch (err) {
    console.error("[api/download] failed", err);
    return errorResponse(503, "db_unavailable", "The report database is not reachable right now. Please try again shortly.");
  }
}
