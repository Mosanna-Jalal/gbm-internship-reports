import { ArrowUpRight, Globe, Mail } from "lucide-react";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/brand-icons";

// Developer details, as on the footer of https://me-mj.vercel.app
const SOCIALS = [
  {
    label: "GitHub",
    handle: "@Mosanna-Jalal",
    href: "https://github.com/Mosanna-Jalal",
    Icon: GitHubIcon,
    bg: "linear-gradient(145deg, #3d444d 0%, #161b22 55%, #0d1117 100%)",
    hover: "hover:border-[#a371f7]/50",
  },
  {
    label: "LinkedIn",
    handle: "Mosanna Jalal",
    href: "https://www.linkedin.com/in/mosanna-jalal-2a1a931aa/",
    Icon: LinkedInIcon,
    bg: "linear-gradient(145deg, #2a8ff0 0%, #0a66c2 50%, #004182 100%)",
    hover: "hover:border-[#0a66c2]/60",
  },
  {
    label: "Instagram",
    handle: "@theycallme_mj__",
    href: "https://www.instagram.com/theycallme_mj__/",
    Icon: InstagramIcon,
    bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
    hover: "hover:border-[#e1306c]/60",
  },
  {
    label: "X / Twitter",
    handle: "@JalalMosanna",
    href: "https://x.com/JalalMosanna",
    Icon: XIcon,
    bg: "linear-gradient(145deg, #2f3336 0%, #0f1419 55%, #000000 100%)",
    hover: "hover:border-[#1d9bf0]/60",
  },
];

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/[0.06] bg-black/40">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,rgb(212_175_55/0.06),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Designed &amp; developed by</p>
            <a
              href="https://me-mj.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-1 inline-flex items-center gap-1 text-2xl font-semibold text-white transition hover:text-gold-soft"
            >
              Mosanna Jalal
              <ArrowUpRight className="size-5 text-gold transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <p className="mt-1 text-sm text-zinc-400">
              Full-Stack Developer · <span className="text-gold-soft">MJX Web Studio</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Full-stack web solutions — MERN, React, AI integrations, and modern web experiences.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="mailto:mjiraqui322@gmail.com"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-black shadow-[0_0_24px_rgb(212_175_55/0.25)] transition hover:brightness-110"
              >
                <Mail className="size-3.5" />
                mjiraqui322@gmail.com
              </a>
              <a
                href="https://me-mj.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gold/40 px-3 py-2 text-xs text-zinc-300 transition hover:border-gold hover:text-white"
              >
                <Globe className="size-3.5" />
                me-mj.vercel.app
              </a>
            </div>
          </div>

          <div className="md:w-[27rem]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Find me on</p>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {SOCIALS.map(({ label, handle, href, Icon, bg, hover }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 transition hover:-translate-y-0.5 hover:bg-white/[0.05] ${hover}`}
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-inner"
                      style={{ background: bg }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-200">{label}</span>
                      <span className="block truncate text-[11px] text-zinc-500">{handle}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-200">
              MJ<span className="text-gold">.</span>
            </span>
            <span className="text-sky-400/70">MJX Web Studio</span>
            <span className="text-zinc-700">·</span>
            <span className="text-purple-400/70">MJX Cinematix Studio</span>
          </div>
          <p className="text-center">© 2026 · Mosanna Jalal · Gaya, India</p>
        </div>
      </div>
    </footer>
  );
}
