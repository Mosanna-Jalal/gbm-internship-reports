import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, List } from "lucide-react";

export function SiteHeader({ current }: { current: "home" | "reports" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/college-logo.jpg"
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-full bg-white object-contain ring-1 ring-line"
            priority
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-semibold tracking-tight">GBM College, Gaya</span>
            <span className="block truncate text-[11px] text-muted">Internship Reports</span>
          </span>
        </Link>
        {current === "home" ? (
          <Link
            href="/reports"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium transition hover:border-line-strong"
          >
            <List className="size-4" strokeWidth={1.75} />
            All reports
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium transition hover:border-line-strong"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Search
          </Link>
        )}
      </div>
    </header>
  );
}
