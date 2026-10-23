export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function formatMs(ms: number) {
  return ms < 1000 ? `${Math.max(0, Math.round(ms))} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function formatRate(bytes: number, ms: number) {
  return `${formatBytes((bytes / Math.max(ms, 1)) * 1000)}/s`;
}

export function shortHash(hex: string) {
  return `${hex.slice(0, 10)}…${hex.slice(-6)}`;
}

/** Parses a Server-Timing header ("db-query;dur=12.3, total;dur=20") into { "db-query": 12.3, … }. */
export function parseServerTiming(header: string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of header?.split(",") ?? []) {
    const [name, ...params] = part.trim().split(";");
    const dur = params.find((p) => p.trim().startsWith("dur="));
    if (name && dur) out[name] = Number(dur.trim().slice(4));
  }
  return out;
}
