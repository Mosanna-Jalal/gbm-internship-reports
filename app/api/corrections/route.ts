import { createHash } from "crypto";
import { connection, type NextRequest } from "next/server";
import { DB_NAME, getCorrections, getReports } from "@/lib/db";
import { normalizeMobile, validateFields } from "@/lib/fields";
import { clientIp, errorResponse, rateLimit } from "@/lib/http";
import { EDITABLE_FIELDS, type CorrectionRequest, type EditableField, type StudentFields } from "@/lib/types";

const MAX_BODY = 4096;

// A student reports a mistake in her report ("edit"), or asks for a report
// that isn't in the list ("missing"). Requests wait for the office to review.
export async function POST(request: NextRequest) {
  await connection();

  const limited = rateLimit(request, "write");
  if (limited) return limited;

  const text = await request.text();
  if (text.length > MAX_BODY) return errorResponse(413, "too_large", "That request is too large.");
  let body: CorrectionRequest;
  try {
    body = JSON.parse(text);
  } catch {
    return errorResponse(400, "bad_json", "Could not read the form. Please try again.");
  }

  // Bots fill every field; people never see this one.
  if (body.website) return Response.json({ ok: true, message: "Received." }, { status: 201 });

  if (body.type !== "edit" && body.type !== "missing") return errorResponse(400, "bad_type", "Unknown request type.");
  const contactMobile = normalizeMobile(body.contactMobile);
  if (!contactMobile) return errorResponse(422, "bad_mobile", "Enter a valid 10-digit mobile number.");
  const note = String(body.note ?? "").replace(/\s+/g, " ").trim().slice(0, 500);

  const submitted: Partial<StudentFields> = {};
  for (const f of EDITABLE_FIELDS) if (typeof body.fields?.[f] === "string") submitted[f] = body.fields[f];
  const { values, errors } = validateFields(submitted);
  const firstError = Object.entries(errors)[0];
  if (firstError) return errorResponse(422, `bad_${firstError[0]}`, firstError[1] as string);

  try {
    const { col } = await getReports();
    const corrections = await getCorrections();
    const ipHash = createHash("sha256").update(`${clientIp(request)}|${DB_NAME}`).digest("hex").slice(0, 16);
    const base = {
      contactMobile,
      note,
      status: "pending" as const,
      createdAt: new Date(),
      ipHash,
      userAgent: (request.headers.get("user-agent") ?? "").slice(0, 200),
    };

    if (body.type === "edit") {
      const studentId = String(body.studentId ?? "");
      const doc = await col.findOne({ studentId }, { projection: { pdf: 0 } });
      if (!doc) return errorResponse(404, "not_found", "That report no longer exists. Reload the list.");

      const current: StudentFields = {
        name: doc.name,
        father: doc.father ?? "",
        universityRoll: doc.universityRoll ?? "",
        registrationNo: doc.registrationNo ?? "",
        collegeRoll: doc.collegeRoll,
        department: doc.department ?? "",
        semester: doc.semester,
        session: doc.session,
        domain: doc.domain,
      };
      const changes: Partial<StudentFields> = {};
      const before: Partial<StudentFields> = {};
      for (const [k, v] of Object.entries(values) as [EditableField, string][]) {
        if (v !== current[k]) {
          changes[k] = v;
          before[k] = current[k];
        }
      }
      if (!Object.keys(changes).length && !note) {
        return errorResponse(422, "no_changes", "Nothing was changed. Edit the details that are wrong, then send.");
      }

      const duplicate = await corrections.findOne({ studentId, status: "pending", changes });
      if (duplicate) {
        return Response.json({ ok: true, message: "This correction is already waiting for review." }, { status: 200 });
      }
      await corrections.insertOne({ type: "edit", studentId, studentName: doc.name, before, changes, ...base });
      return Response.json(
        { ok: true, message: "Thanks — the college office will check and update your report." },
        { status: 201 },
      );
    }

    // missing report
    if (!values.name || !values.domain || !(values.universityRoll || values.registrationNo)) {
      return errorResponse(422, "incomplete", "Enter your name, domain, and university roll or registration number.");
    }
    const ids = [values.universityRoll, values.registrationNo].filter(Boolean) as string[];
    const existing = await col.findOne(
      { $or: [{ universityRoll: { $in: ids } }, { registrationNo: { $in: ids } }] },
      { projection: { name: 1 } },
    );
    if (existing) {
      return errorResponse(
        409,
        "exists",
        `A report already exists for this number (${existing.name}). Search for it on the home page.`,
      );
    }
    await corrections.insertOne({
      type: "missing",
      studentId: null,
      studentName: values.name,
      before: null,
      changes: values,
      ...base,
    });
    return Response.json(
      { ok: true, message: "Thanks — the college office will prepare your report and add it here." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/corrections] failed", err);
    return errorResponse(503, "db_unavailable", "Could not send right now. Please try again shortly.");
  }
}
