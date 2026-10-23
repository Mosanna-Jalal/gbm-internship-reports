import { connection, type NextRequest } from "next/server";
import { COLLECTION, DB_NAME, getReports, maskedClusterHost } from "@/lib/db";
import { errorResponse, rateLimit, serverTiming } from "@/lib/http";
import { normalizeRoll } from "@/lib/roll";
import type { ReportMeta } from "@/lib/types";

// Report details for a university roll (or registration) number, without the PDF.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/reports/[roll]">) {
  await connection();
  const started = performance.now();

  const roll = normalizeRoll((await ctx.params).roll);
  if (!roll) return errorResponse(400, "invalid_roll", "Enter a valid university roll number.");

  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const { col, connectMs, pooled } = await getReports();
    const queryStarted = performance.now();
    const doc = await col.findOne(
      { $or: [{ universityRoll: roll }, { registrationNo: roll }] },
      { projection: { pdf: 0 } },
    );
    const queryMs = performance.now() - queryStarted;
    const totalMs = performance.now() - started;
    const timing = serverTiming({ "db-connect": connectMs, "db-query": queryMs, total: totalMs });

    if (!doc) {
      return errorResponse(404, "not_found", `No report is registered for ${roll}.`, { "Server-Timing": timing });
    }

    const matchedBy = doc.universityRoll === roll ? "universityRoll" : "registrationNo";
    const body: ReportMeta = {
      student: {
        name: doc.name,
        programme: doc.programme,
        department: doc.department,
        semester: doc.semester,
        session: doc.session,
        collegeRoll: doc.collegeRoll,
        domain: doc.domain,
        language: doc.language,
      },
      file: {
        name: doc.fileName,
        pages: doc.pages,
        size: doc.size,
        sha256: doc.sha256,
        updatedAt: doc.updatedAt.toISOString(),
      },
      server: {
        cluster: maskedClusterHost(),
        db: DB_NAME,
        collection: COLLECTION,
        connectMs,
        queryMs,
        totalMs,
        pooled,
        matchedBy,
        index: `${matchedBy}_1`,
      },
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store", "Server-Timing": timing } });
  } catch (err) {
    console.error("[api/reports] lookup failed", err);
    return errorResponse(503, "db_unavailable", "The report database is not reachable right now. Please try again shortly.");
  }
}
