"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";

export type TermKind = "banner" | "cmd" | "info" | "ok" | "dim" | "warn" | "err" | "progress" | "done";
export type TermLine = { id: number; kind: TermKind; text: string; at: number; progress?: number };

const GLYPH: Record<TermKind, { mark: string; tone: string; text: string }> = {
  banner: { mark: "◆", tone: "text-gold", text: "text-gold-soft font-medium" },
  cmd: { mark: "$", tone: "text-emerald-400", text: "text-zinc-100" },
  info: { mark: "›", tone: "text-sky-400", text: "text-zinc-300" },
  ok: { mark: "›", tone: "text-emerald-400", text: "text-zinc-300" },
  dim: { mark: "·", tone: "text-zinc-600", text: "text-zinc-500" },
  warn: { mark: "!", tone: "text-amber-400", text: "text-amber-200/90" },
  err: { mark: "✗", tone: "text-rose-400", text: "text-rose-300" },
  progress: { mark: "›", tone: "text-sky-400", text: "text-zinc-300" },
  done: { mark: "✓", tone: "text-emerald-400", text: "text-emerald-300 font-medium" },
};

const CELLS = 20;

export function Terminal({ lines, busy }: { lines: TermLine[]; busy: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#04050a]/95 shadow-[0_0_0_1px_rgb(212_175_55/0.05),0_24px_60px_-28px_rgb(0_0_0/0.9)]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]/90" />
        <span className="size-2.5 rounded-full bg-[#febc2e]/90" />
        <span className="size-2.5 rounded-full bg-[#28c840]/90" />
        <span className="ml-2 truncate font-mono text-[10.5px] text-zinc-500">gbm-reports — node — mongodb</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
          <span
            className={`size-1.5 rounded-full ${busy ? "animate-pulse bg-amber-400" : "animate-pulse-ring bg-emerald-400"}`}
          />
          <span className={busy ? "text-amber-300" : "text-emerald-400"}>{busy ? "running" : "idle"}</span>
        </span>
      </div>

      <div
        ref={scroller}
        role="log"
        aria-label="Request log"
        className="term-scroll h-36 overflow-y-auto px-3 py-2 font-mono text-[10.5px] leading-[1.7] [mask-image:linear-gradient(to_bottom,transparent,#000_10px)] sm:h-40 sm:text-[11.5px]"
      >
        {lines.map((line) => (
          <Line key={line.id} line={line} />
        ))}
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-gold">❯</span>
          <span className="inline-block h-[12px] w-[7px] animate-blink bg-gold/80" />
        </div>
      </div>

      <div aria-hidden className="scanlines pointer-events-none absolute inset-0" />
    </div>
  );
}

function Line({ line }: { line: TermLine }) {
  const g = GLYPH[line.kind];
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex gap-2"
    >
      <span className="hidden w-[52px] shrink-0 text-right text-zinc-600 tabular-nums sm:inline">
        +{(line.at / 1000).toFixed(3)}s
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
      <span className="text-zinc-500">streaming </span>
      <span className="text-gold">{"█".repeat(filled)}</span>
      <span className="text-zinc-700">{"░".repeat(CELLS - filled)}</span>
      <span className="text-zinc-300"> {String(Math.round(value * 100)).padStart(3)}%</span>
      {label && <span className="text-zinc-500"> · {label}</span>}
    </span>
  );
}
