// Shapes returned by the API routes and consumed by the client.

export type Domain = "Tailoring" | "Beautician" | "Mehndi";
export const DOMAINS: Domain[] = ["Tailoring", "Beautician", "Mehndi"];

export type ServerInfo = {
  cluster: string;
  db: string;
  collection: string;
  connectMs: number;
  queryMs: number;
  totalMs: number;
  pooled: boolean;
};

/** One student's report, as listed on /reports and edited by the correction form. */
export type ReportRow = {
  id: string;
  name: string;
  father: string;
  universityRoll: string | null;
  registrationNo: string | null;
  collegeRoll: string;
  department: string | null;
  programme: string;
  semester: string;
  session: string;
  domain: Domain;
  language: "English" | "Hindi";
  pages: number;
  size: number;
  correctionPending: boolean;
};

export type ReportList = { rows: ReportRow[]; server: ServerInfo };

export type ReportMeta = {
  student: ReportRow;
  file: { name: string; pages: number; size: number; sha256: string; updatedAt: string };
  server: ServerInfo & { matchedBy: "universityRoll" | "registrationNo"; index: string };
};

export type StatusPayload = {
  online: true;
  reports: number;
  domains: Partial<Record<Domain, number>>;
  server: ServerInfo;
};

/** Fields a student can ask to have corrected (or supply for a missing report). */
export const EDITABLE_FIELDS = [
  "name",
  "father",
  "universityRoll",
  "registrationNo",
  "collegeRoll",
  "department",
  "semester",
  "session",
  "domain",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];
export type StudentFields = Record<EditableField, string>;

export type CorrectionRequest = {
  type: "edit" | "missing";
  studentId?: string;
  fields: Partial<StudentFields>;
  contactMobile: string;
  note?: string;
  /** honeypot — must stay empty */
  website?: string;
};

export type ApiError = { error: string; message: string };
