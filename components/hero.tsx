import Image from "next/image";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 pt-12 text-center sm:pt-20">
      <div className="flex animate-rise items-center justify-center gap-3">
        <Logo src="/college-logo.jpg" alt="Gautam Buddha Mahila College, Gaya" />
        <span className="h-px w-6 bg-line-strong" />
        <Logo src="/university-logo.jpg" alt="Magadh University, Bodh Gaya" />
      </div>

      <p
        className="mt-7 animate-rise text-[11px] font-medium uppercase tracking-[0.16em] text-accent"
        style={{ animationDelay: "60ms" }}
      >
        FYUGP Internship · 2026
      </p>
      <h1
        className="mt-3 animate-rise text-balance text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[3.25rem]"
        style={{ animationDelay: "120ms" }}
      >
        Download your internship report
      </h1>
      <p
        className="mx-auto mt-4 max-w-lg animate-rise text-pretty text-[15px] leading-relaxed text-muted"
        style={{ animationDelay: "180ms" }}
      >
        Karuna Swayam Sevi Sansthan × Gautam Buddha Mahila College, Gaya. Tailoring, Beautician and Mehndi · 120
        hours · 4 credits.
      </p>
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
