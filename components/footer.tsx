import type { CSSProperties } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/brand-icons";
import { Eyebrow } from "@/components/ui";

// Developer details, as on the footer of https://me-mj.vercel.app
const SOCIALS = [
  { label: "GitHub", handle: "@Mosanna-Jalal", href: "https://github.com/Mosanna-Jalal", Icon: GitHubIcon, tint: "var(--brand-github)" },
  { label: "LinkedIn", handle: "Mosanna Jalal", href: "https://www.linkedin.com/in/mosanna-jalal-2a1a931aa/", Icon: LinkedInIcon, tint: "var(--brand-linkedin)" },
  { label: "Instagram", handle: "@theycallme_mj__", href: "https://www.instagram.com/theycallme_mj__/", Icon: InstagramIcon, tint: "var(--brand-instagram)" },
  { label: "X", handle: "@JalalMosanna", href: "https://x.com/JalalMosanna", Icon: XIcon, tint: "var(--brand-x)" },
];

const SKILLS = ["MERN", "React", "AI integrations", "Modern web"];

export function Footer() {
  return (
    <footer className="mt-auto bg-surface/60">
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />

      <div className="mx-auto grid max-w-5xl gap-9 px-4 py-11 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex gap-4">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-[13px] font-semibold tracking-tight"
          >
            <span>
              MJ<span className="text-accent">.</span>
            </span>
          </span>
          <div className="min-w-0">
            <Eyebrow>Designed &amp; developed by</Eyebrow>
            <a
              href="https://me-mj.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-1.5 inline-flex items-center gap-1 text-lg font-semibold tracking-tight"
            >
              Mosanna Jalal
              <ArrowUpRight
                className="size-4 text-faint transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
                strokeWidth={1.75}
              />
            </a>
            <p className="text-[13px] text-muted">Full-stack developer · MJX Web Studio</p>
            <ul className="mt-3.5 flex flex-wrap gap-1.5" aria-label="Skills">
              {SKILLS.map((s) => (
                <li key={s} className="rounded-full border border-line px-2.5 py-0.5 text-[11.5px] text-muted">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 md:items-end">
          {/* On larger screens the hover tooltips name each link, so the label is only shown on phones. */}
          <Eyebrow className="md:hidden">Connect</Eyebrow>
          <ul className="flex gap-2">
            {SOCIALS.map(({ label, handle, href, Icon, tint }) => (
              <li key={label} className="relative">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label}: ${handle}`}
                  style={{ "--tint": tint } as CSSProperties}
                  className="social group grid size-9 place-items-center rounded-full border transition duration-200 hover:-translate-y-0.5"
                >
                  <Icon className="size-[15px]" />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-muted opacity-0 shadow-card transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                  >
                    {handle}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="mailto:mjiraqui322@gmail.com"
            className="inline-flex h-9 w-fit items-center gap-2 rounded-full border border-line bg-surface pl-3 pr-3.5 text-[13px] text-muted transition hover:border-line-strong hover:text-fg"
          >
            <Mail className="size-[15px] text-faint" strokeWidth={1.75} />
            mjiraqui322@gmail.com
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1.5 px-4 py-4 text-[12px] text-faint sm:flex-row">
          <span>© 2026 Mosanna Jalal · Gaya, India</span>
          <span>
            <span className="font-semibold text-muted">
              MJ<span className="text-accent">.</span>
            </span>{" "}
            MJX Web Studio · MJX Cinematix Studio
          </span>
        </div>
      </div>
    </footer>
  );
}
