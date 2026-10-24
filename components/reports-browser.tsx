"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FilePlus2, PencilLine, RotateCw, Search, X } from "lucide-react";
import { CorrectionDialog, type CorrectionTarget } from "@/components/correction-dialog";
import { Button, Chip, Eyebrow, buttonClass } from "@/components/ui";
import { formatMs } from "@/lib/format";
import { DOMAINS, type ApiError, type Domain, type ReportList, type ReportRow } from "@/lib/types";

type Load =
  | { state: "loading" }
  | { state: "ready"; rows: ReportRow[]; status: string }
  | { state: "error"; message: string };

const squash = (v: string | null | undefined) => (v ?? "").toLowerCase().replace(/[\s.-]/g, "");

export function ReportsBrowser() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<Domain | "All">("All");
  const [target, setTarget] = useState<CorrectionTarget | null>(null);
  const deferredQuery = useDeferredValue(query);
  const fetched = useRef(false);

  async function fetchList() {
    setLoad({ state: "loading" });
    const started = performance.now();
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const body = (await res.json()) as ReportList | ApiError;
      if (!res.ok || !("rows" in body)) throw new Error("message" in body ? body.message : "Could not load the list.");
      const ms = performance.now() - started;
      setLoad({
        state: "ready",
        rows: body.rows,
        status: `GET /api/reports → ${res.status} · ${body.rows.length} rows · db.find ${formatMs(body.server.queryMs)} · ${formatMs(ms)} round trip`,
      });
    } catch (e) {
      setLoad({ state: "error", message: e instanceof Error ? e.message : "Could not load the list." });
    }
  }

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    void fetchList();
  }, []);

  const rows = useMemo(() => (load.state === "ready" ? load.rows : []), [load]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    for (const r of rows) c[r.domain] = (c[r.domain] ?? 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = squash(deferredQuery);
    return rows.filter(
      (r) =>
        (domain === "All" || r.domain === domain) &&
        (!q ||
          squash(r.name).includes(q) ||
          squash(r.universityRoll).includes(q) ||
          squash(r.registrationNo).includes(q) ||
          squash(r.collegeRoll) === q ||
          squash(r.department).includes(q)),
    );
  }, [rows, deferredQuery, domain]);

  const markPending = (id: string | null) => {
    if (!id) return;
    setLoad((l) => (l.state === "ready" ? { ...l, rows: l.rows.map((r) => (r.id === id ? { ...r, correctionPending: true } : r)) } : l));
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search by name or roll number</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, university roll or class roll"
              className="h-11 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-10 text-[14px] outline-none transition placeholder:text-faint focus:border-fg focus:ring-4 focus:ring-fg/[0.06]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-faint hover:bg-subtle hover:text-fg"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-subtle p-1 sm:flex" role="tablist" aria-label="Domain">
            {(["All", ...DOMAINS] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={domain === d}
                onClick={() => setDomain(d)}
                className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] transition sm:px-3 ${
                  domain === d ? "bg-surface font-medium text-fg shadow-card" : "text-muted hover:text-fg"
                }`}
              >
                {d}
                {load.state === "ready" && <span className="ml-1.5 hidden tabular-nums text-faint sm:inline">{counts[d] ?? 0}</span>}
              </button>
            ))}
          </div>
        </div>

        {load.state === "ready" && (
          <p className="truncate font-mono text-[11px] text-faint">
            <span className="text-ok">●</span> {load.status}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {load.state === "loading" && <Skeleton />}
          {load.state === "error" && (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-[14px] font-medium">Couldn’t load the reports</p>
              <p className="text-[13px] text-muted">{load.message}</p>
              <Button onClick={() => void fetchList()}>
                <RotateCw className="size-4" strokeWidth={1.75} /> Try again
              </Button>
            </div>
          )}
          {load.state === "ready" && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <p className="text-[14px] font-medium">No matching reports</p>
              <p className="max-w-sm text-[13px] text-muted">
                Check the spelling or try your class roll number. Still missing? Request your report below.
              </p>
            </div>
          )}
          {load.state === "ready" && filtered.length > 0 && (
            <>
              {/* desktop table */}
              <table className="hidden w-full text-left md:table">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-faint">
                    <th className="w-12 py-3 pl-5 font-medium">#</th>
                    <th className="py-3 font-medium">Name</th>
                    <th className="py-3 font-medium">University roll</th>
                    <th className="py-3 font-medium">Class roll</th>
                    <th className="py-3 font-medium">Domain</th>
                    <th className="py-3 pr-5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr
                      key={r.id}
                      className="animate-rise border-b border-line last:border-0 hover:bg-subtle/60"
                      style={{ animationDelay: `${Math.min(i, 16) * 18}ms` }}
                    >
                      <td className="py-3 pl-5 font-mono text-[12px] text-faint tabular-nums">{i + 1}</td>
                      <td className="py-3 pr-4">
                        <span className="block text-[14px] font-medium">{r.name}</span>
                        <span className="block text-[12px] text-muted">
                          {r.programme}
                          {r.department ? ` · ${r.department}` : ""} · {r.semester} sem
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-[13px] tabular-nums">
                        {r.universityRoll ?? <span className="text-faint">—</span>}
                      </td>
                      <td className="py-3 pr-4 font-mono text-[13px] tabular-nums">{r.collegeRoll}</td>
                      <td className="py-3 pr-4">
                        <span className="text-[13px]">{r.domain}</span>
                        {r.correctionPending && (
                          <span className="ml-2">
                            <Chip tone="warn">correction pending</Chip>
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-5">
                        <RowActions row={r} onEdit={() => setTarget({ mode: "edit", row: r })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* phone cards */}
              <ul className="divide-y divide-line md:hidden">
                {filtered.map((r, i) => (
                  <li key={r.id} className="animate-rise px-4 py-4" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium">{r.name}</p>
                        <p className="mt-0.5 text-[12px] text-muted">
                          {r.department ?? r.programme} · {r.semester} sem · {r.domain}
                        </p>
                      </div>
                      {r.correctionPending && <Chip tone="warn">pending</Chip>}
                    </div>
                    <dl className="mt-2.5 flex gap-5 font-mono text-[12.5px] tabular-nums">
                      <div>
                        <dt className="font-sans text-[10.5px] uppercase tracking-[0.12em] text-faint">University roll</dt>
                        <dd>{r.universityRoll ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="font-sans text-[10.5px] uppercase tracking-[0.12em] text-faint">Class roll</dt>
                        <dd>{r.collegeRoll}</dd>
                      </div>
                    </dl>
                    <div className="mt-3">
                      <RowActions row={r} onEdit={() => setTarget({ mode: "edit", row: r })} stretch />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-line-strong px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-medium">Not in the list?</p>
            <p className="mt-0.5 text-[13px] text-muted">Send your details and the college office will prepare your report.</p>
          </div>
          <Button onClick={() => setTarget({ mode: "missing" })}>
            <FilePlus2 className="size-4" strokeWidth={1.75} />
            Request your report
          </Button>
        </div>
      </div>

      <CorrectionDialog target={target} onClose={() => setTarget(null)} onSent={markPending} />
    </>
  );
}

function RowActions({ row, onEdit, stretch }: { row: ReportRow; onEdit: () => void; stretch?: boolean }) {
  return (
    <div className={`flex gap-2 ${stretch ? "" : "justify-end"}`}>
      <a
        href={`/api/download/${row.id}`}
        download
        onClick={() => toast.success("Downloading report", { description: row.name })}
        className={buttonClass("secondary", `h-9 px-3 text-[13px] ${stretch ? "flex-1" : ""}`)}
      >
        <Download className="size-4" strokeWidth={1.75} />
        Download
      </a>
      <button type="button" onClick={onEdit} className={buttonClass("ghost", `h-9 px-3 text-[13px] ${stretch ? "flex-1 border border-line" : ""}`)}>
        <PencilLine className="size-4" strokeWidth={1.75} />
        Edit
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-3 w-6 animate-pulse rounded bg-subtle" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-48 animate-pulse rounded bg-subtle" />
            <div className="h-3 w-32 animate-pulse rounded bg-subtle" />
          </div>
          <div className="hidden h-8 w-40 animate-pulse rounded-lg bg-subtle sm:block" />
        </div>
      ))}
    </div>
  );
}

export function ReportsHeading() {
  return (
    <div className="animate-rise">
      <Eyebrow className="!text-accent">All reports</Eyebrow>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[2.5rem]">Find your report</h1>
      <p className="mt-2 max-w-xl text-pretty text-[15px] leading-relaxed text-muted">
        Search by your name or roll number. If anything in your report is wrong — university roll, class roll, name or
        semester — tap <span className="font-medium text-fg">Edit</span> and send the correct details.
      </p>
    </div>
  );
}
