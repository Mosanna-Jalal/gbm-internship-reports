import { connection, type NextRequest } from "next/server";
import { getReports } from "@/lib/db";
import { errorResponse, pdfResponse, rateLimit } from "@/lib/http";
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

    const disposition = request.nextUrl.searchParams.has("download") ? "attachment" : "inline";
    return pdfResponse(doc, disposition, { "db-connect": connectMs, "db-query": queryMs, total: performance.now() - started });
  } catch (err) {
    console.error("[api/reports/pdf] download failed", err);
    return errorResponse(503, "db_unavailable", "The report database is not reachable right now. Please try again shortly.");
  }
}
