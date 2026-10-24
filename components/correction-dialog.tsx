"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Send, X } from "lucide-react";
import { FIELD_LABEL, SEMESTERS, SESSIONS, normalizeField, normalizeMobile } from "@/lib/fields";
import { DOMAINS, EDITABLE_FIELDS, type EditableField, type ReportRow, type StudentFields } from "@/lib/types";
import { Button, buttonClass } from "@/components/ui";

export type CorrectionTarget = { mode: "edit"; row: ReportRow } | { mode: "missing" };

const EMPTY: StudentFields = {
  name: "",
  father: "",
  universityRoll: "",
  registrationNo: "",
  collegeRoll: "",
  department: "",
  semester: "",
  session: "",
  domain: "",
};

function fromRow(row: ReportRow): StudentFields {
  return {
    name: row.name,
    father: row.father,
    universityRoll: row.universityRoll ?? "",
    registrationNo: row.registrationNo ?? "",
    collegeRoll: row.collegeRoll,
    department: row.department ?? "",
    semester: row.semester,
    session: row.session,
    domain: row.domain,
  };
}

export function CorrectionDialog({
  target,
  onClose,
  onSent,
}: {
  target: CorrectionTarget | null;
  onClose: () => void;
  onSent?: (studentId: string | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // The native dialog opens and closes with the target.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (target && !el.open) {
      el.showModal();
      // start on the heading, not the close button, so no focus ring or keyboard pops up
      el.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    } else if (!target && el.open) el.close();
  }, [target]);

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      {target && (
        <CorrectionForm
          key={target.mode === "edit" ? target.row.id : "missing"}
          target={target}
          titleId={titleId}
          onClose={onClose}
          onSent={onSent}
        />
      )}
    </dialog>
  );
}

// Keyed by target, so each opening starts from that student's current details.
function CorrectionForm({
  target,
  titleId,
  onClose,
  onSent,
}: {
  target: CorrectionTarget;
  titleId: string;
  onClose: () => void;
  onSent?: (studentId: string | null) => void;
}) {
  const [original] = useState<StudentFields>(() => (target.mode === "edit" ? fromRow(target.row) : EMPTY));
  const [fields, setFields] = useState<StudentFields>(original);
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Partial<Record<EditableField | "mobile", string>>>({});
  const [sending, setSending] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  const editing = target.mode === "edit";
  const changed = (f: EditableField) => editing && fields[f].trim() !== original[f].trim();
  const changedCount = EDITABLE_FIELDS.filter(changed).length;

  const set = (f: EditableField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setFields((p) => ({ ...p, [f]: v }));
    setErrors((p) => ({ ...p, [f]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    const next: typeof errors = {};
    const required: EditableField[] =
      target.mode === "missing" ? ["name", "father", "collegeRoll", "department", "semester", "session", "domain"] : [];
    for (const f of EDITABLE_FIELDS) {
      const v = fields[f];
      if (!v.trim() && !required.includes(f)) continue;
      const r = normalizeField(f, v);
      if ("error" in r) next[f] = r.error;
    }
    if (target.mode === "missing" && !fields.universityRoll.trim() && !fields.registrationNo.trim()) {
      next.universityRoll = "Enter your university roll or registration number";
    }
    if (!normalizeMobile(mobile)) next.mobile = "Enter a valid 10-digit mobile number";
    if (target.mode === "edit" && changedCount === 0 && !note.trim()) {
      toast.message("Nothing changed yet", { description: "Correct the details that are wrong, then send." });
      return;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: target.mode,
          studentId: target.mode === "edit" ? target.row.id : undefined,
          fields: target.mode === "edit" ? Object.fromEntries(EDITABLE_FIELDS.filter(changed).map((f) => [f, fields[f]])) : fields,
          contactMobile: mobile,
          note,
          website: honeypot.current?.value ?? "",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error("Could not send", { description: body.message ?? "Please try again." });
        return;
      }
      toast.success(target.mode === "edit" ? "Correction sent" : "Request sent", { description: body.message });
      onSent?.(target.mode === "edit" ? target.row.id : null);
      onClose();
    } catch {
      toast.error("You seem to be offline", { description: "Check your connection and try again." });
    } finally {
      setSending(false);
    }
  }

  return (
        <form onSubmit={submit} className="flex max-h-[inherit] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5">
            <div className="min-w-0">
              <h2 id={titleId} data-autofocus tabIndex={-1} className="text-[17px] font-semibold tracking-tight outline-none">
                {editing ? "Suggest a correction" : "Request your report"}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {editing
                  ? `Change only what is wrong in ${target.row.name}’s report. The college office checks every correction before updating the PDF.`
                  : "Not in the list? Send your details and the college office will prepare your report."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-subtle hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid min-h-0 grid-cols-1 gap-x-4 gap-y-3.5 overflow-y-auto px-5 py-5 sm:grid-cols-2">
            <Field label={FIELD_LABEL.name} error={errors.name} changed={changed("name")} wide>
              <input value={fields.name} onChange={set("name")} autoComplete="name" className={inputClass} />
            </Field>
            <Field label={FIELD_LABEL.father} error={errors.father} changed={changed("father")} wide>
              <input value={fields.father} onChange={set("father")} className={inputClass} />
            </Field>
            <Field label={FIELD_LABEL.universityRoll} error={errors.universityRoll} changed={changed("universityRoll")}>
              <input value={fields.universityRoll} onChange={set("universityRoll")} inputMode="numeric" className={`${inputClass} font-mono`} />
            </Field>
            <Field label={FIELD_LABEL.registrationNo} error={errors.registrationNo} changed={changed("registrationNo")}>
              <input value={fields.registrationNo} onChange={set("registrationNo")} inputMode="numeric" className={`${inputClass} font-mono`} />
            </Field>
            <Field label={FIELD_LABEL.collegeRoll} error={errors.collegeRoll} changed={changed("collegeRoll")}>
              <input value={fields.collegeRoll} onChange={set("collegeRoll")} className={`${inputClass} font-mono`} />
            </Field>
            <Field label={FIELD_LABEL.department} error={errors.department} changed={changed("department")}>
              <input value={fields.department} onChange={set("department")} placeholder="e.g. Hindi" className={inputClass} />
            </Field>
            <Field label={FIELD_LABEL.semester} error={errors.semester} changed={changed("semester")}>
              <select value={fields.semester} onChange={set("semester")} className={inputClass}>
                <option value="">Choose…</option>
                {SEMESTERS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label={FIELD_LABEL.session} error={errors.session} changed={changed("session")}>
              <select value={fields.session} onChange={set("session")} className={inputClass}>
                <option value="">Choose…</option>
                {[...new Set([...SESSIONS, original.session].filter(Boolean))].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label={FIELD_LABEL.domain} error={errors.domain} changed={changed("domain")} wide>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-line bg-subtle p-1">
                {DOMAINS.map((d) => (
                  <label
                    key={d}
                    className={`cursor-pointer rounded-lg px-2 py-2 text-center text-[13px] transition ${
                      fields.domain === d ? "bg-surface font-medium text-fg shadow-card" : "text-muted hover:text-fg"
                    }`}
                  >
                    <input type="radio" name="domain" value={d} checked={fields.domain === d} onChange={set("domain")} className="sr-only" />
                    {d}
                  </label>
                ))}
              </div>
            </Field>

            <div className="col-span-full mt-1 border-t border-line pt-4" />
            <Field label="Your mobile number" error={errors.mobile} hint="So the office can confirm with you">
              <input
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setErrors((p) => ({ ...p, mobile: undefined }));
                }}
                inputMode="tel"
                autoComplete="tel"
                placeholder="10-digit number"
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label="Anything else? (optional)">
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. my semester is 6th" className={inputClass} />
            </Field>
            <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
            <p className="text-[12px] text-faint">
              {editing ? (changedCount ? `${changedCount} field${changedCount > 1 ? "s" : ""} changed` : "No changes yet") : "All fields help us find you"}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <button type="submit" disabled={sending} className={buttonClass("primary", "h-10 px-5")}>
                {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" strokeWidth={1.75} />}
                Send
              </button>
            </div>
          </div>
        </form>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-line-strong bg-bg px-3 text-[14px] text-fg outline-none transition placeholder:text-faint focus:border-fg focus:ring-4 focus:ring-fg/[0.06]";

function Field({
  label,
  error,
  changed,
  hint,
  wide,
  children,
}: {
  label: string;
  error?: string;
  changed?: boolean;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-muted">
        {label}
        {changed && <span className="rounded-full bg-accent/10 px-1.5 py-px text-[10.5px] font-medium text-accent">edited</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[12px] text-bad">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] text-faint">{hint}</span>
      ) : null}
    </label>
  );
}
