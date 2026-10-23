"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flower2,
  Languages,
  RotateCcw,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Domain, ReportMeta } from "@/lib/types";
import { formatBytes } from "@/lib/format";

export type ReportResult = {
  roll: string;
  meta: ReportMeta;
  url: string;
  bytes: number;
  verified: boolean | null;
};

const DOMAIN_STYLE: Record<Domain, { Icon: typeof Scissors; ring: string; chip: string }> = {
  Tailoring: {
    Icon: Scissors,
    ring: "from-sky-400 to-indigo-500",
    chip: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  },
  Beautician: {
    Icon: Sparkles,
    ring: "from-pink-400 to-fuchsia-500",
    chip: "border-pink-300/25 bg-pink-300/10 text-pink-200",
  },
  Mehndi: {
    Icon: Flower2,
    ring: "from-amber-300 to-orange-600",
    chip: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  },
};

export function ResultCard({ result, onReset }: { result: ReportResult; onReset: () => void }) {
  const [preview, setPreview] = useState(false);
  const card = useRef<HTMLElement>(null);

  // Bring the card into view on phones, where it lands below the fold.
  useEffect(() => {
    card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  const { meta, roll, url, bytes, verified } = result;
  const { student, file } = meta;
  const style = DOMAIN_STYLE[student.domain];

  return (
    <motion.section
      ref={card}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      aria-label="Your report"
      className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.07] to-white/[0.02] p-4 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ rotate: -25, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
          className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${style.ring} text-white shadow-lg sm:size-14`}
        >
          <style.Icon className="size-6 sm:size-7" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-300/90">Report found</p>
          <h2 className="mt-0.5 truncate text-xl font-semibold text-white sm:text-2xl">{student.name}</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {student.programme}
            {student.department ? ` · ${student.department}` : ""} · {student.semester} Semester · {student.session}
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2 text-xs">
        <Chip className={style.chip} Icon={style.Icon}>
          {student.domain}
        </Chip>
        <Chip Icon={Languages}>{student.language}</Chip>
        <Chip Icon={BookOpen}>{file.pages} pages</Chip>
        <Chip Icon={FileText}>{formatBytes(bytes)}</Chip>
        {verified === true && (
          <Chip className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200" Icon={ShieldCheck}>
            SHA-256 verified
          </Chip>
        )}
        {verified === false && (
          <Chip className="border-rose-300/25 bg-rose-300/10 text-rose-200" Icon={ShieldAlert}>
            Checksum mismatch
          </Chip>
        )}
      </ul>

      <p className="mt-3 truncate font-mono text-[11px] text-zinc-500" title={file.name}>
        {file.name}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <a
          href={url}
          download={file.name}
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-[0_10px_30px_-10px_rgb(52_211_153/0.7)] transition hover:brightness-110 active:scale-[0.98] sm:col-span-1"
        >
          <Download className="size-4" />
          Download PDF
        </a>
        <a
          href={`/api/reports/${encodeURIComponent(roll)}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98]"
        >
          <ExternalLink className="size-4" />
          Open
        </a>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="hidden items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] md:inline-flex"
        >
          {preview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {preview ? "Hide preview" : "Preview"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200 active:scale-[0.98] sm:ml-auto"
        >
          <RotateCcw className="size-4" />
          New search
        </button>
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
              className="mt-4 h-[72vh] w-full rounded-xl border border-white/10 bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Chip({
  children,
  Icon,
  className = "border-white/10 bg-white/[0.04] text-zinc-300",
}: {
  children: React.ReactNode;
  Icon: typeof Scissors;
  className?: string;
}) {
  return (
    <li className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${className}`}>
      <Icon className="size-3.5" />
      {children}
    </li>
  );
}
