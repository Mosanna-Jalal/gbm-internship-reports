import Image from "next/image";
import { Clock, Flower2, GraduationCap, Scissors, Sparkles } from "lucide-react";

const DOMAINS = [
  { label: "Tailoring", Icon: Scissors, tone: "text-sky-300 border-sky-300/20 bg-sky-300/5" },
  { label: "Beautician", Icon: Sparkles, tone: "text-pink-300 border-pink-300/20 bg-pink-300/5" },
  { label: "Mehndi", Icon: Flower2, tone: "text-amber-300 border-amber-300/20 bg-amber-300/5" },
];

export function Hero() {
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-10 text-center sm:pt-16">
      <div className="flex animate-rise items-center gap-3 sm:gap-4">
        <Logo src="/college-logo.jpg" alt="Gautam Buddha Mahila College, Gaya" />
        <span className="text-lg font-light text-zinc-600">×</span>
        <Logo src="/university-logo.jpg" alt="Magadh University, Bodh Gaya" />
      </div>

      <p
        className="mt-6 inline-flex animate-rise items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold-soft"
        style={{ animationDelay: "80ms" }}
      >
        <GraduationCap className="size-3.5" />
        FYUGP Internship · 2026
      </p>

      <h1
        className="mt-4 animate-rise text-balance text-[2rem] font-semibold leading-tight tracking-tight text-white sm:text-5xl"
        style={{ animationDelay: "140ms" }}
      >
        Internship Report{" "}
        <span className="bg-gradient-to-r from-gold-soft via-gold to-amber-600 bg-clip-text text-transparent">
          Portal
        </span>
      </h1>

      <p
        className="mt-3 max-w-xl animate-rise text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base"
        style={{ animationDelay: "200ms" }}
      >
        Gautam Buddha Mahila College, Gaya × Karuna Swayam Sevi Sansthan. Enter your university roll number to fetch
        your internship report.
      </p>

      <ul
        className="mt-5 flex animate-rise flex-wrap items-center justify-center gap-2"
        style={{ animationDelay: "260ms" }}
      >
        {DOMAINS.map(({ label, Icon, tone }) => (
          <li key={label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${tone}`}>
            <Icon className="size-3.5" />
            {label}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <Clock className="size-3.5" />
          120 hrs · 4 credits
        </li>
      </ul>
    </header>
  );
}

function Logo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative grid size-14 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_10px_30px_-10px_rgb(212_175_55/0.45)] sm:size-16">
      <Image src={src} alt={alt} width={64} height={64} className="h-full w-full object-contain" priority />
    </div>
  );
}
