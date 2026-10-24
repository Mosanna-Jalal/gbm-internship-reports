"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";

export type TermKind = "banner" | "cmd" | "info" | "ok" | "dim" | "warn" | "err" | "progress" | "done";
export type TermLine = { id: number; kind: TermKind; text: string; at: number; progress?: number };

// Monochrome by design; colour only marks success and failure.
const GLYPH: Record<TermKind, { mark: string; tone: string; text: string }> = {
  banner: { mark: "◆", tone: "text-zinc-500", text: "text-zinc-300" },
  cmd: { mark: "$", tone: "text-zinc-500", text: "text-zinc-100" },
  info: { mark: "›", tone: "text-zinc-600", text: "text-zinc-300" },
  ok: { mark: "›", tone: "text-emerald-400/80", text: "text-zinc-300" },
  dim: { mark: "·", tone: "text-zinc-700", text: "text-zinc-500" },
  warn: { mark: "!", tone: "text-amber-300/80", text: "text-zinc-300" },
  err: { mark: "✕", tone: "text-rose-400/90", text: "text-rose-200/90" },
  progress: { mark: "›", tone: "text-zinc-600", text: "text-zinc-300" },
  done: { mark: "✓", tone: "text-emerald-400", text: "text-zinc-50" },
};

const CELLS = 24;

export function Terminal({ lines, busy }: { lines: TermLine[]; busy: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0b0b0d]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-zinc-700" />
          <span className="size-2 rounded-full bg-zinc-700" />
          <span className="size-2 rounded-full bg-zinc-700" />
        </span>
        <span className="ml-1 truncate font-mono text-[10.5px] text-zinc-500">~/gbm-reports · node · mongodb</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          <span className={`size-1.5 rounded-full ${busy ? "animate-pulse bg-amber-300" : "animate-pulse-dot bg-emerald-400"}`} />
          {busy ? "running" : "idle"}
        </span>
      </div>

      <div
        ref={scroller}
        role="log"
        aria-label="Request log"
        className="term-scroll h-32 overflow-y-auto px-3 py-2 font-mono text-[10.5px] leading-[1.75] sm:h-36 sm:text-[11.5px]"
      >
        {lines.map((line) => (
          <Line key={line.id} line={line} />
        ))}
        <div className="flex items-center gap-2 text-zinc-600">
          <span>❯</span>
          <span className="inline-block h-[12px] w-[6px] animate-blink bg-zinc-400" />
        </div>
      </div>
    </div>
  );
}

function Line({ line }: { line: TermLine }) {
  const g = GLYPH[line.kind];
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="flex gap-2"
    >
      <span className="hidden w-[52px] shrink-0 text-right tabular-nums text-zinc-700 sm:inline">
        {(line.at / 1000).toFixed(3)}
      </span>
      <span className={`shrink-0 ${g.tone}`}>{g.mark}</span>
      <span className={`min-w-0 break-words ${g.text}`}>
        {line.kind === "progress" ? <Progress value={line.progress ?? 0} label={line.text} /> : line.text}
      </span>
    </motion.div>
  );
}

function Progress({ value, label }: { value: number; label: string }) {
  const filled = Math.round(value * CELLS);
  return (
    <span className="whitespace-pre">
      <span className="text-zinc-200">{"━".repeat(filled)}</span>
      <span className="text-zinc-800">{"━".repeat(CELLS - filled)}</span>
      <span className="text-zinc-300"> {String(Math.round(value * 100)).padStart(3)}%</span>
      {label && <span className="text-zinc-500"> · {label}</span>}
    </span>
  );
}
