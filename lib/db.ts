import "server-only";
import { MongoClient, type Binary } from "mongodb";

export type ReportDoc = {
  studentId: string;
  universityRoll: string | null;
  registrationNo: string | null;
  collegeRoll: string;
  name: string;
  department: string | null;
  programme: string;
  semester: string;
  session: string;
  domain: "Tailoring" | "Beautician" | "Mehndi";
  language: "English" | "Hindi";
  fileName: string;
  contentType: string;
  pages: number;
  size: number;
  sha256: string;
  pdf: Binary;
  updatedAt: Date;
};

export const DB_NAME = process.env.MONGODB_DB || "gbm-internship-reports";
export const COLLECTION = "reports";

declare global {
  var __gbmMongo: Promise<MongoClient> | undefined;
}

/**
 * Returns the reports collection from a client shared across requests
 * (and across hot reloads in dev), with how long getting it took.
 */
export async function getReports() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const pooled = globalThis.__gbmMongo !== undefined;
  const started = performance.now();
  globalThis.__gbmMongo ??= new MongoClient(uri, {
    appName: "gbm-internship-reports",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  }).connect();

  try {
    const client = await globalThis.__gbmMongo;
    return {
      col: client.db(DB_NAME).collection<ReportDoc>(COLLECTION),
      connectMs: performance.now() - started,
      pooled,
    };
  } catch (err) {
    globalThis.__gbmMongo = undefined;
    throw err;
  }
}

/** "gbm.lehaxws.mongodb.net" → "gbm.••••••.mongodb.net", safe to show in the UI. */
export function maskedClusterHost() {
  const host = /@([^/?]+)/.exec(process.env.MONGODB_URI ?? "")?.[1] ?? "cluster";
  return host.replace(/^([^.]+)\.([^.]+)\./, (_, a: string, b: string) => `${a}.${"•".repeat(b.length)}.`);
}
