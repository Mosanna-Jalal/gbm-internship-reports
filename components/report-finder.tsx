"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle, Search, Users } from "lucide-react";
import { Terminal, type TermKind, type TermLine } from "@/components/terminal";
import { ResultCard, type ReportResult } from "@/components/result-card";
import { CorrectionDialog, type CorrectionTarget } from "@/components/correction-dialog";
import { buttonClass } from "@/components/ui";
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
    description: "Check the number on your admit card, or find your name in the list of all reports.",
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
  { id: 1, kind: "banner", text: "gbm-reports v2 · secure report retrieval", at: 0 },
  { id: 2, kind: "cmd", text: "gbm-reports status", at: 0 },
  { id: 3, kind: "info", text: "GET /api/status", at: 0 },
];

export function ReportFinder() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<TermLine[]>(BOOT);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [vault, setVault] = useState<Vault>({ state: "connecting" });
  const [correction, setCorrection] = useState<CorrectionTarget | null>(null);
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
    const toastId = toast.loading("Searching the report vault…", { description: `Roll number ${roll}` });
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
          log("dim", "tip: browse /reports to find your name ↵");
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
        <div className="relative animate-rise rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6" style={{ animationDelay: "240ms" }}>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 -top-px h-px bg-linear-to-r from-transparent via-accent/45 to-transparent"
          />
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="roll" className="text-[13px] font-medium">
              University roll number
            </label>
            <VaultBadge vault={vault} />
          </div>

          <form onSubmit={fetchReport} className="mt-3 flex flex-col gap-2 sm:flex-row">
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
              placeholder="e.g. 24281041312"
              aria-describedby="roll-help"
              className="h-12 w-full rounded-xl sm:flex-1 border border-line-strong bg-bg px-4 font-mono text-[16px] tracking-[0.08em] outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-faint focus:border-accent/50 focus:ring-4 focus:ring-accent/10"
            />
            <button type="submit" disabled={busy} className={buttonClass("primary", "h-12 px-6 disabled:!opacity-80")}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" strokeWidth={1.75} />}
              {busy ? "Fetching…" : "Fetch report"}
            </button>
          </form>

          <p id="roll-help" className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
            As printed on your admit card. No university roll number yet? Use your registration number.
          </p>

          <div className="mt-4">
            <Terminal lines={lines} busy={busy} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <ResultCard
              key={result.roll}
              result={result}
              onReset={reset}
              onCorrect={() => setCorrection({ mode: "edit", row: result.meta.student })}
            />
          )}
        </AnimatePresence>

        <Link
          href="/reports"
          className="group flex animate-rise items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4 transition hover:border-line-strong"
          style={{ animationDelay: "320ms" }}
        >
          <span className="flex min-w-0 items-center gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-bg text-muted transition group-hover:text-fg">
              <Users className="size-[18px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-medium">Can’t find your report?</span>
              <span className="mt-0.5 block text-[13px] text-muted">
                {vault.state === "online" && vault.reports ? `Browse all ${vault.reports} reports` : "Browse all reports"},
                check your roll numbers, or ask for a correction.
              </span>
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-fg" />
        </Link>
      </div>

      <CorrectionDialog
        target={correction}
        onClose={() => setCorrection(null)}
        onSent={() =>
          setResult((r) => (r ? { ...r, meta: { ...r.meta, student: { ...r.meta.student, correctionPending: true } } } : r))
        }
      />
    </MotionConfig>
  );
}

function VaultBadge({ vault }: { vault: Vault }) {
  const view =
    vault.state === "online"
      ? { dot: "bg-ok animate-pulse-dot", text: vault.reports ? `${vault.reports} reports online` : "online" }
      : vault.state === "offline"
        ? { dot: "bg-bad", text: "offline" }
        : { dot: "bg-faint animate-pulse", text: "connecting…" };
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] text-muted">
      <span className={`size-1.5 rounded-full ${view.dot}`} />
      {view.text}
    </span>
  );
}
