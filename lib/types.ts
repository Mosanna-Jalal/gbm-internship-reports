// Shapes returned by the API routes and consumed by the client.

export type Domain = "Tailoring" | "Beautician" | "Mehndi";

export type ServerInfo = {
  cluster: string;
  db: string;
  collection: string;
  connectMs: number;
  queryMs: number;
  totalMs: number;
  pooled: boolean;
};

export type ReportMeta = {
  student: {
    name: string;
    programme: string;
    department: string | null;
    semester: string;
    session: string;
    collegeRoll: string;
    domain: Domain;
    language: "English" | "Hindi";
  };
  file: { name: string; pages: number; size: number; sha256: string; updatedAt: string };
  server: ServerInfo & { matchedBy: "universityRoll" | "registrationNo"; index: string };
};

export type StatusPayload = {
  online: true;
  reports: number;
  domains: Partial<Record<Domain, number>>;
  server: ServerInfo;
};

export type ApiError = { error: string; message: string };
