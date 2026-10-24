import { ArrowUpRight } from "lucide-react";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/brand-icons";

// Developer details, as on the footer of https://me-mj.vercel.app
const SOCIALS = [
  { label: "GitHub", handle: "@Mosanna-Jalal", href: "https://github.com/Mosanna-Jalal", Icon: GitHubIcon },
  { label: "LinkedIn", handle: "Mosanna Jalal", href: "https://www.linkedin.com/in/mosanna-jalal-2a1a931aa/", Icon: LinkedInIcon },
  { label: "Instagram", handle: "@theycallme_mj__", href: "https://www.instagram.com/theycallme_mj__/", Icon: InstagramIcon },
  { label: "X", handle: "@JalalMosanna", href: "https://x.com/JalalMosanna", Icon: XIcon },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Designed &amp; developed by</p>
          <a
            href="https://me-mj.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 inline-flex items-center gap-1 text-[1.35rem] font-semibold tracking-tight"
          >
            Mosanna Jalal
            <ArrowUpRight className="size-4 text-faint transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
          </a>
          <p className="mt-1 text-[13px] text-muted">Full-stack developer · MJX Web Studio</p>
          <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-faint">
            Full-stack web solutions — MERN, React, AI integrations, and modern web experiences.
          </p>
          <a
            href="mailto:mjiraqui322@gmail.com"
            className="mt-3 inline-block text-[13px] underline decoration-line-strong underline-offset-4 transition hover:decoration-fg"
          >
            mjiraqui322@gmail.com
          </a>
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:flex">
          {SOCIALS.map(({ label, handle, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label}: ${handle}`}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-muted transition hover:border-line-strong hover:text-fg"
              >
                <Icon className="size-[15px] shrink-0" />
                <span className="truncate">{handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1 px-4 py-4 text-[12px] text-faint sm:flex-row">
          <span>© 2026 · Mosanna Jalal · Gaya, India</span>
          <span>
            MJ<span className="text-accent">.</span> MJX Web Studio · MJX Cinematix Studio
          </span>
        </div>
      </div>
    </footer>
  );
}
