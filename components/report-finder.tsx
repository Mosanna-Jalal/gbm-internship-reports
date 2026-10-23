"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { toast } from "sonner";
import { Database, Hash, LoaderCircle, Search, ShieldCheck, Zap } from "lucide-react";
import { Terminal, type TermKind, type TermLine } from "@/components/terminal";
import { ResultCard, type ReportResult } from "@/components/result-card";
import { normalizeRoll } from "@/lib/roll";
import { formatBytes, formatMs, formatRate, parseServerTiming, shortHash } from "@/lib/format";
import type { ApiError, ReportMeta, StatusPayload } from "@/lib/types";

type Vault = { state: "connecting" } | { state: "online"; reports: number } | { state: "offline" };

class RequestFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const FAILURE_TOAST: Record<string, { title: string; description: string }> = {
  not_found: {
    title: "No report found",
    description: "Check the university roll number on your admit card. Still stuck? Contact the college office.",
  },
  invalid_roll: {
    title: "That doesn't look like a roll number",
    description: "Use the number printed on your university admit card.",
  },
  rate_limited: { title: "Too many attempts", description: "Please wait a few minutes and try again." },
  network: { title: "You seem to be offline", description: "Check your internet connection and try again." },
};
const SERVER_BUSY = { title: "Server is busy", description: "The report database could not be reached. Please try again shortly." };

/** fetch() that also returns when the request started. */
async function timedFetch(path: string) {
  const started = performance.now();
  const res = await fetch(path, { cache: "no-store" });
  return { res, started };
}
/** Negotiated protocol (h2, h3, http/1.1) from the Resource Timing entry. */
function transportOf(path: string) {
  const entry = performance.getEntriesByName(new URL(path, location.href).href).at(-1) as
    | PerformanceResourceTiming
    | undefined;
  return entry?.nextHopProtocol || "";
}

const BOOT: TermLine[] = [
  { id: 1, kind: "banner", text: "gbm-reports v1.0 · secure report retrieval", at: 0 },
  { id: 2, kind: "cmd", text: "gbm-reports status", at: 0 },
  { id: 3, kind: "info", text: "GET /api/status", at: 0 },
];

export function ReportFinder() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<TermLine[]>(BOOT);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [vault, setVault] = useState<Vault>({ state: "connecting" });
  const seq = useRef(BOOT.length);
  const origin = useRef(0);
  const booted = useRef(false);
  const blobUrl = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const log = useCallback((kind: TermKind, text: string, progress?: number) => {
    const id = ++seq.current;
    const at = performance.now() - origin.current;
    setLines((prev) => [...prev.slice(-120), { id, kind, text, at, progress }]);
    return id;
  }, []);

  const update = useCallback((id: number, patch: Partial<TermLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  // Boot sequence: real health check against the database.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    origin.current = performance.now();
    const line = BOOT[2].id;
    (async () => {
      try {
        const { res, started } = await timedFetch("/api/status");
        const body = (await res.json()) as StatusPayload | ApiError;
        if (!res.ok || !("online" in body)) throw new Error("offline");
        const proto = transportOf("/api/status");
        update(line, {
          kind: "ok",
          text: `GET /api/status → ${res.status} OK · ${formatMs(performance.now() - started)}${proto ? ` · ${proto}` : ""}`,
        });
        log("dim", `atlas ${body.server.cluster} → ${body.server.db}.${body.server.collection}`);
        const domains = Object.entries(body.domains)
          .map(([d, n]) => `${d} ${n}`)
          .join(" · ");
        log("ok", `vault online · ${body.reports} reports indexed · ${domains}`);
        log("dim", "ready — enter a university roll number ↵");
        setVault({ state: "online", reports: body.reports });
      } catch {
        update(line, { kind: "warn", text: "GET /api/status → vault unreachable, will retry on search" });
        setVault({ state: "offline" });
      }
    })();
  }, [log, update]);

  useEffect(() => () => void (blobUrl.current && URL.revokeObjectURL(blobUrl.current)), []);

  const clearResult = () => {
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = null;
    setResult(null);
  };

  const reset = () => {
    clearResult();
    setValue("");
    log("dim", "session cleared — ready for the next roll number ↵");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  async function fetchReport(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const roll = normalizeRoll(value);
    if (!roll) {
      log("err", `invalid input "${value.trim() || "∅"}" — expected 6–16 letters/digits`);
      toast.error(FAILURE_TOAST.invalid_roll.title, { description: FAILURE_TOAST.invalid_roll.description });
      inputRef.current?.focus();
      return;
    }

    clearResult();
    setBusy(true);
    setLines([]);
    origin.current = performance.now();
    const toastId = toast.loading("Searching the report vault…", { description: `University roll ${roll}` });
    log("cmd", `gbm-reports fetch --roll ${roll}`);
    log("dim", `input normalised → "${roll}" (${roll.length} chars) · ok`);

    try {
      // 1 ── look the student up (metadata only)
      const metaPath = `/api/reports/${encodeURIComponent(roll)}`;
      const lookupLine = log("info", `GET ${metaPath}`);
      const { res, started } = await timedFetch(metaPath).catch(() => {
        throw new RequestFailure(0, "network", "network error");
      });
      const body = (await res.json().catch(() => ({}))) as ReportMeta | ApiError;
      const lookupMs = performance.now() - started;

      if (!res.ok || !("student" in body)) {
        const err = body as ApiError;
        update(lookupLine, { kind: "err", text: `GET ${metaPath} → ${res.status} · ${formatMs(lookupMs)}` });
        const st = parseServerTiming(res.headers.get("server-timing"));
        if (res.status === 404) {
          log("dim", `db.find ${formatMs(st["db-query"] ?? 0)} · 0 documents match { universityRoll | registrationNo: "${roll}" }`);
        }
        throw new RequestFailure(res.status, err.error ?? "server_error", err.message ?? "request failed");
      }

      const meta = body;
      const proto = transportOf(metaPath);
      update(lookupLine, {
        kind: "ok",
        text: `GET ${metaPath} → ${res.status} OK · ${formatMs(lookupMs)}${proto ? ` · ${proto}` : ""}`,
      });
      log("dim", `atlas ${meta.server.cluster} → ${meta.server.db}.${meta.server.collection}`);
      log(
        "dim",
        `db.connect ${formatMs(meta.server.connectMs)} ${meta.server.pooled ? "(pooled)" : "(cold start)"} · db.find ${formatMs(meta.server.queryMs)} via index ${meta.server.index}`,
      );
      const s = meta.student;
      log("ok", `match ✓ ${s.name} · ${s.domain} · ${s.programme}${s.department ? ` ${s.department}` : ""} · ${meta.file.pages} pages`);
      toast.loading("Report found — downloading securely…", {
        id: toastId,
        description: `${s.name} · ${formatBytes(meta.file.size)}`,
      });

      // 2 ── stream the PDF with live progress
      const pdfPath = `${metaPath}/pdf`;
      const downloadLine = log("info", `GET ${pdfPath} · application/pdf · ${formatBytes(meta.file.size)}`);
      const progressLine = log("progress", "", 0);
      const pdfStarted = performance.now();
      const pdfRes = await fetch(pdfPath, { cache: "no-store" }).catch(() => {
        throw new RequestFailure(0, "network", "network error");
      });
      if (!pdfRes.ok || !pdfRes.body) {
        update(downloadLine, { kind: "err", text: `GET ${pdfPath} → ${pdfRes.status}` });
        throw new RequestFailure(pdfRes.status, "server_error", "download failed");
      }

      const reader = pdfRes.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      let painted = 0;
      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        chunks.push(chunk);
        received += chunk.byteLength;
        const now = performance.now();
        if (now - painted > 50) {
          painted = now;
          update(progressLine, {
            progress: Math.min(1, received / meta.file.size),
            text: `${formatBytes(received)} / ${formatBytes(meta.file.size)}`,
          });
        }
      }
      const downloadMs = performance.now() - pdfStarted;
      update(progressLine, { progress: 1, text: `${formatBytes(received)} / ${formatBytes(meta.file.size)}` });
      update(downloadLine, { kind: "ok", text: `GET ${pdfPath} → 200 OK · ${formatMs(downloadMs)}` });
      const st = parseServerTiming(pdfRes.headers.get("server-timing"));
      log(
        "dim",
        `received ${received.toLocaleString("en-US")} bytes in ${chunks.length} chunks · ${formatRate(received, downloadMs)}${
          st["db-query"] !== undefined ? ` · server db.find ${formatMs(st["db-query"])}` : ""
        }`,
      );

      // 3 ── verify integrity against the checksum stored with the report
      const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
      let verified: boolean | null = null;
      if (globalThis.crypto?.subtle) {
        const hashLine = log("info", "sha256 computing digest …");
        const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
        const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
        verified = hex === meta.file.sha256;
        update(
          hashLine,
          verified
            ? { kind: "ok", text: `sha256 ${shortHash(hex)} ✓ matches server checksum` }
            : { kind: "err", text: `sha256 mismatch · expected ${shortHash(meta.file.sha256)} got ${shortHash(hex)}` },
        );
      } else {
        log("warn", "sha256 check skipped (needs HTTPS)");
      }

      blobUrl.current = URL.createObjectURL(blob);
      log("done", `report ready · ${meta.file.pages} pages · total ${formatMs(performance.now() - origin.current)}`);
      setResult({ roll, meta, url: blobUrl.current, bytes: received, verified });
      setVault((v) => (v.state === "online" ? v : { state: "online", reports: 0 }));
      toast.success("Your report is ready", {
        id: toastId,
        description: `${s.name} · ${meta.file.pages} pages · ${formatBytes(received)}`,
      });
    } catch (e) {
      const failure = e instanceof RequestFailure ? e : new RequestFailure(0, "server_error", String(e));
      if (failure.code === "network") log("err", "network error — request did not reach the server");
      else log("err", `aborted · ${failure.code}${failure.status ? ` (${failure.status})` : ""}`);
      const t = FAILURE_TOAST[failure.code] ?? SERVER_BUSY;
      toast.error(t.title, { id: toastId, description: t.description });
    } finally {
      setBusy(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-4">
        <div
          className="relative animate-rise rounded-2xl bg-gradient-to-b from-white/[0.14] via-white/[0.05] to-gold/20 p-px"
          style={{ animationDelay: "320ms" }}
        >
          <div className="rounded-[15px] bg-[#090a11]/90 p-4 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="roll" className="text-sm font-medium text-zinc-200">
                University Roll Number
              </label>
              <VaultBadge vault={vault} />
            </div>

            <form onSubmit={fetchReport} className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Hash className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="roll"
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value.toUpperCase())}
                  inputMode="numeric"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={20}
                  placeholder="Enter your university roll no."
                  aria-describedby="roll-help"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-3 font-mono text-base tracking-[0.12em] text-white outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-600 focus:border-gold/50 focus:ring-4 focus:ring-gold/15"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-soft via-gold to-amber-600 px-6 text-sm font-semibold text-black shadow-[0_12px_32px_-12px_rgb(212_175_55/0.8)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
                <span className="relative">{busy ? "Fetching…" : "Fetch report"}</span>
              </button>
            </form>

            <p id="roll-help" className="mt-2.5 text-xs leading-relaxed text-zinc-500">
              The number printed on your university admit card. No university roll number yet? Enter your university
              registration number instead.
            </p>

            <div className="mt-4">
              <Terminal lines={lines} busy={busy} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {result && <ResultCard key={result.roll} result={result} onReset={reset} />}
        </AnimatePresence>

        <Steps />
      </div>
    </MotionConfig>
  );
}

function VaultBadge({ vault }: { vault: Vault }) {
  const view =
    vault.state === "online"
      ? { dot: "bg-emerald-400 animate-pulse-ring", text: "online", count: vault.reports }
      : vault.state === "offline"
        ? { dot: "bg-rose-400", text: "offline", count: 0 }
        : { dot: "bg-amber-400 animate-pulse", text: "connecting…", count: 0 };
  return (
    <motion.span
      key={vault.state}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-zinc-400"
    >
      <span className={`size-1.5 rounded-full ${view.dot}`} />
      <span className="hidden sm:inline">vault </span>
      {view.text}
      {view.count > 0 && <span>· {view.count}<span className="hidden sm:inline"> reports</span></span>}
    </motion.span>
  );
}

const STEPS = [
  { Icon: Hash, title: "Enter roll no.", text: "As printed on your admit card" },
  { Icon: Database, title: "Fetched live", text: "From the MongoDB report vault" },
  { Icon: ShieldCheck, title: "Verified", text: "SHA-256 checked, then saved" },
];

function Steps() {
  return (
    <div className="animate-rise" style={{ animationDelay: "420ms" }}>
    <ol className="grid grid-cols-3 gap-2 text-center">
      {STEPS.map(({ Icon, title, text }, i) => (
        <li key={title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-3">
          <div className="mx-auto grid size-8 place-items-center rounded-lg bg-gold/10 text-gold">
            <Icon className="size-4" />
          </div>
          <p className="mt-2 text-xs font-medium text-zinc-200">
            <span className="text-zinc-500">{i + 1}.</span> {title}
          </p>
          <p className="mt-0.5 hidden text-[11px] text-zinc-500 sm:block">{text}</p>
        </li>
      ))}
    </ol>
    <p className="mt-3 text-center text-[11px] text-zinc-500">
      <Zap className="mr-1 inline size-3 -translate-y-px text-gold/70" />
      Found a mistake in your report? Contact the GBM College internship cell.
    </p>
    </div>
  );
}
