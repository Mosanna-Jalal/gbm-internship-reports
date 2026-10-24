"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Download, ExternalLink, Eye, EyeOff, PencilLine, RotateCcw, ShieldAlert } from "lucide-react";
import type { ReportMeta } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { Button, Chip, Eyebrow, buttonClass } from "@/components/ui";

export type ReportResult = {
  roll: string;
  meta: ReportMeta;
  url: string;
  bytes: number;
  verified: boolean | null;
};

export function ResultCard({
  result,
  onReset,
  onCorrect,
}: {
  result: ReportResult;
  onReset: () => void;
  onCorrect: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const card = useRef<HTMLElement>(null);
  const { meta, roll, url, bytes, verified } = result;
  const { student, file } = meta;

  // Bring the card into view on phones, where it lands below the fold.
  useEffect(() => {
    card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const details: [string, string][] = [
    ["University roll", student.universityRoll ?? "—"],
    ["Registration", student.registrationNo ?? "—"],
    ["College roll", student.collegeRoll],
    ["Programme", `${student.programme}${student.department ? ` · ${student.department}` : ""}`],
    ["Semester", `${student.semester} · ${student.session}`],
    ["Domain", `${student.domain} · ${student.language}`],
  ];

  return (
    <motion.section
      ref={card}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      aria-label="Your report"
      className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow className="!text-ok">Report found</Eyebrow>
          <h2 className="mt-1.5 truncate text-[1.6rem] font-semibold leading-tight tracking-[-0.02em]">{student.name}</h2>
          <p className="mt-1 text-[13px] text-muted">
            {file.pages} pages · {formatBytes(bytes)}
          </p>
        </div>
        {verified === true && (
          <Chip tone="ok" icon={<Check className="size-3.5" />}>
            Verified
          </Chip>
        )}
        {verified === false && (
          <Chip tone="warn" icon={<ShieldAlert className="size-3.5" />}>
            Checksum mismatch
          </Chip>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-3">
        {details.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">{k}</dt>
            <dd className="mt-0.5 truncate font-mono text-[13px]" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {student.correctionPending && (
        <p className="mt-4 rounded-xl bg-subtle px-3 py-2 text-[12.5px] text-muted">
          A correction for this report is waiting for review by the college office.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <a href={url} download={file.name} className={buttonClass("primary", "col-span-2 h-11 px-5 sm:col-span-1")}>
          <Download className="size-4" strokeWidth={1.75} />
          Download PDF
        </a>
        <a
          href={`/api/reports/${encodeURIComponent(roll)}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "h-11 whitespace-nowrap !px-3")}
        >
          <ExternalLink className="size-4" strokeWidth={1.75} />
          Open
        </a>
        <Button className="!h-11 whitespace-nowrap !px-3" onClick={onCorrect}>
          <PencilLine className="size-4" strokeWidth={1.75} />
          Report a mistake
        </Button>
        <Button className="!hidden !h-11 md:!inline-flex" onClick={() => setPreview((p) => !p)}>
          {preview ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
          {preview ? "Hide preview" : "Preview"}
        </Button>
        <Button variant="ghost" className="col-span-2 !h-11 sm:col-span-1 sm:ml-auto" onClick={onReset}>
          <RotateCcw className="size-4" strokeWidth={1.75} />
          New search
        </Button>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="hidden overflow-hidden md:block"
          >
            <iframe
              src={`${url}#view=FitH`}
              title={`Preview of ${file.name}`}
              className="mt-5 h-[72vh] w-full rounded-xl border border-line bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
