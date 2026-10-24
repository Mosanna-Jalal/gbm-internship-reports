import { connection, type NextRequest } from "next/server";
import { COLLECTION, DB_NAME, ROW_PROJECTION, getCorrections, getReports, maskedClusterHost, toRow } from "@/lib/db";
import { errorResponse, rateLimit, serverTiming } from "@/lib/http";
import type { ReportList } from "@/lib/types";

// Every report (without the PDFs), sorted by name, for the /reports list.
export async function GET(request: NextRequest) {
  await connection();
  const started = performance.now();

  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const { col, connectMs, pooled } = await getReports();
    const queryStarted = performance.now();
    const [docs, pending] = await Promise.all([
      col.find({}, { projection: ROW_PROJECTION }).collation({ locale: "en" }).sort({ name: 1, collegeRoll: 1 }).toArray(),
      getCorrections().then((c) => c.distinct("studentId", { status: "pending", type: "edit" })),
    ]);
    const queryMs = performance.now() - queryStarted;
    const totalMs = performance.now() - started;

    const pendingIds = new Set(pending);
    const body: ReportList = {
      rows: docs.map((d) => toRow(d, pendingIds.has(d.studentId))),
      server: { cluster: maskedClusterHost(), db: DB_NAME, collection: COLLECTION, connectMs, queryMs, totalMs, pooled },
    };
    return Response.json(body, {
      headers: {
        "Cache-Control": "no-store",
        "Server-Timing": serverTiming({ "db-connect": connectMs, "db-query": queryMs, total: totalMs }),
      },
    });
  } catch (err) {
    console.error("[api/reports] list failed", err);
    return errorResponse(503, "db_unavailable", "The report database is not reachable right now. Please try again shortly.");
  }
}
