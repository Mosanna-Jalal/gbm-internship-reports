import { connection } from "next/server";
import { COLLECTION, DB_NAME, getReports, maskedClusterHost } from "@/lib/db";
import { errorResponse, serverTiming } from "@/lib/http";
import type { Domain, StatusPayload } from "@/lib/types";

const TTL_MS = 60_000;
let cached: { at: number; reports: number; domains: StatusPayload["domains"] } | null = null;

// Health check plus report counts per domain; the counts are cached for a minute.
export async function GET() {
  await connection();
  const started = performance.now();

  try {
    const { col, connectMs, pooled } = await getReports();
    const queryStarted = performance.now();
    if (!cached || Date.now() - cached.at > TTL_MS) {
      const groups = await col
        .aggregate<{ _id: Domain; n: number }>([{ $group: { _id: "$domain", n: { $sum: 1 } } }])
        .toArray();
      const domains: StatusPayload["domains"] = {};
      for (const g of groups) domains[g._id] = g.n;
      cached = { at: Date.now(), reports: groups.reduce((a, g) => a + g.n, 0), domains };
    }
    const queryMs = performance.now() - queryStarted;
    const totalMs = performance.now() - started;

    const body: StatusPayload = {
      online: true,
      reports: cached.reports,
      domains: cached.domains,
      server: { cluster: maskedClusterHost(), db: DB_NAME, collection: COLLECTION, connectMs, queryMs, totalMs, pooled },
    };
    return Response.json(body, {
      headers: {
        "Cache-Control": "no-store",
        "Server-Timing": serverTiming({ "db-connect": connectMs, "db-query": queryMs, total: totalMs }),
      },
    });
  } catch (err) {
    console.error("[api/status] database check failed", err);
    return errorResponse(503, "db_unavailable", "The report database is not reachable right now.");
  }
}
