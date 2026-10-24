// Normalisation and validation for the correction form, shared by the client
// (for instant feedback) and the API (which is the source of truth).

import { DOMAINS, type EditableField, type StudentFields } from "@/lib/types";
import { normalizeRoll } from "@/lib/roll";

export const FIELD_LABEL: Record<EditableField, string> = {
  name: "Student's name",
  father: "Father's name",
  universityRoll: "University roll no.",
  registrationNo: "Registration no.",
  collegeRoll: "College (class) roll no.",
  department: "Department",
  semester: "Semester",
  session: "Session",
  domain: "Internship domain",
};

export const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
export const SESSIONS = ["2023–2027", "2024–2028", "2025–2029"];

const clean = (v: string, max: number) =>
  v
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const titleCase = (v: string) => v.replace(/\b([a-z])/g, (c) => c.toUpperCase());

/** Returns the normalised value, or an error message. */
export function normalizeField(field: EditableField, raw: string): { value: string } | { error: string } {
  const v = clean(raw ?? "", 80);
  switch (field) {
    case "name":
    case "father":
      if (v.length < 2) return { error: "Enter the full name" };
      if (!/^[\p{L}\p{M} .'-]+$/u.test(v)) return { error: "Use letters only" };
      return { value: titleCase(v) };
    case "universityRoll":
    case "registrationNo": {
      if (!v) return { value: "" };
      const roll = normalizeRoll(v);
      return roll ? { value: roll } : { error: "Use 6–16 letters or digits" };
    }
    case "collegeRoll":
      if (!/^[0-9A-Za-z/-]{1,10}$/.test(v)) return { error: "Enter the class roll number" };
      return { value: v.toUpperCase() };
    case "department":
      if (v.length < 2) return { error: "Enter the department" };
      return { value: titleCase(v) };
    case "semester": {
      const m = /^([1-8])\s*(st|nd|rd|th)?/i.exec(v);
      return m ? { value: SEMESTERS[Number(m[1]) - 1] } : { error: "Choose the semester" };
    }
    case "session": {
      const m = /^(20\d\d)\s*[–—/-]\s*(?:20)?(\d\d)$/.exec(v);
      return m ? { value: `${m[1]}–20${m[2]}` } : { error: "Use the form 2024–2028" };
    }
    case "domain":
      return (DOMAINS as string[]).includes(v) ? { value: v } : { error: "Choose the domain" };
  }
}

export function normalizeMobile(raw: string): string | null {
  const digits = (raw ?? "").replace(/[\s-]/g, "").replace(/^(\+?91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Validates a set of fields; returns normalised values and per-field errors. */
export function validateFields(fields: Partial<StudentFields>) {
  const values: Partial<StudentFields> = {};
  const errors: Partial<Record<EditableField, string>> = {};
  for (const [k, raw] of Object.entries(fields) as [EditableField, string][]) {
    const r = normalizeField(k, raw);
    if ("error" in r) errors[k] = r.error;
    else values[k] = r.value;
  }
  return { values, errors };
}
