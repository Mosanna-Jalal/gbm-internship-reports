import "server-only";
import { MongoClient, type Binary, type Db } from "mongodb";
import type { Domain, ReportRow, StudentFields } from "@/lib/types";

export type ReportDoc = {
  studentId: string;
  universityRoll: string | null;
  registrationNo: string | null;
  collegeRoll: string;
  name: string;
  father: string;
  department: string | null;
  programme: string;
  semester: string;
  session: string;
  domain: Domain;
  language: "English" | "Hindi";
  fileName: string;
  contentType: string;
  pages: number;
  size: number;
  sha256: string;
  pdf: Binary;
  updatedAt: Date;
};

export type CorrectionDoc = {
  type: "edit" | "missing";
  studentId: string | null;
  studentName: string;
  before: Partial<StudentFields> | null;
  changes: Partial<StudentFields>;
  contactMobile: string;
  note: string;
  status: "pending" | "applied" | "rejected";
  createdAt: Date;
  ipHash: string;
  userAgent: string;
};

export const DB_NAME = process.env.MONGODB_DB || "gbm-internship-reports";
export const COLLECTION = "reports";
export const CORRECTIONS = "corrections";

declare global {
  var __gbmMongo: Promise<MongoClient> | undefined;
}

/**
 * The database from a client shared across requests (and across hot reloads
 * in dev), with how long getting it took.
 */
async function getDb(): Promise<{ db: Db; connectMs: number; pooled: boolean }> {
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
    return { db: client.db(DB_NAME), connectMs: performance.now() - started, pooled };
  } catch (err) {
    globalThis.__gbmMongo = undefined;
    throw err;
  }
}

export async function getReports() {
  const { db, ...timing } = await getDb();
  return { col: db.collection<ReportDoc>(COLLECTION), ...timing };
}

export async function getCorrections() {
  const { db } = await getDb();
  return db.collection<CorrectionDoc>(CORRECTIONS);
}

/** Everything about a report except the PDF itself. */
export const ROW_PROJECTION = { pdf: 0, sha256: 0, contentType: 0 } as const;

export function toRow(doc: Omit<ReportDoc, "pdf" | "sha256" | "contentType">, correctionPending = false): ReportRow {
  return {
    id: doc.studentId,
    name: doc.name,
    father: doc.father ?? "",
    universityRoll: doc.universityRoll,
    registrationNo: doc.registrationNo,
    collegeRoll: doc.collegeRoll,
    department: doc.department,
    programme: doc.programme,
    semester: doc.semester,
    session: doc.session,
    domain: doc.domain,
    language: doc.language,
    pages: doc.pages,
    size: doc.size,
    correctionPending,
  };
}

/** "gbm.lehaxws.mongodb.net" → "gbm.•••••••.mongodb.net", safe to show in the UI. */
export function maskedClusterHost() {
  const host = /@([^/?]+)/.exec(process.env.MONGODB_URI ?? "")?.[1] ?? "cluster";
  return host.replace(/^([^.]+)\.([^.]+)\./, (_, a: string, b: string) => `${a}.${"•".repeat(b.length)}.`);
}
