import Image from "next/image";
import { DomainDot } from "@/components/ui";
import { DOMAINS } from "@/lib/types";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 pt-12 text-center sm:pt-20">
      <div className="flex animate-rise items-center justify-center gap-3">
        <Logo src="/college-logo.jpg" alt="Gautam Buddha Mahila College, Gaya" />
        <span className="h-px w-6 bg-line-strong" />
        <Logo src="/university-logo.jpg" alt="Magadh University, Bodh Gaya" />
      </div>

      <p
        className="mt-7 inline-flex animate-rise items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-accent"
        style={{ animationDelay: "60ms" }}
      >
        <span className="size-1.5 rounded-full bg-accent" />
        FYUGP Internship · 2026
      </p>
      <h1
        className="mt-4 animate-rise text-balance text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[3.25rem]"
        style={{ animationDelay: "120ms" }}
      >
        Download your{" "}
        <span className="bg-linear-to-r from-fg from-35% to-accent bg-clip-text text-transparent">internship report</span>
      </h1>
      <p
        className="mx-auto mt-4 max-w-lg animate-rise text-pretty text-[15px] leading-relaxed text-muted"
        style={{ animationDelay: "180ms" }}
      >
        Karuna Swayam Sevi Sansthan × Gautam Buddha Mahila College, Gaya
      </p>
      <ul
        className="mt-5 flex animate-rise flex-wrap items-center justify-center gap-2"
        style={{ animationDelay: "220ms" }}
        aria-label="Internship domains"
      >
        {DOMAINS.map((d) => (
          <li
            key={d}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1 text-[12.5px] text-muted"
          >
            <DomainDot domain={d} />
            {d}
          </li>
        ))}
        <li className="px-1 text-[12.5px] text-faint">120 hours · 4 credits</li>
      </ul>
    </section>
  );
}

function Logo({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="grid size-12 place-items-center rounded-2xl border border-line bg-white p-1.5 shadow-card">
      <Image src={src} alt={alt} width={48} height={48} className="h-full w-full object-contain" priority />
    </span>
  );
}
