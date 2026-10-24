// Small shared building blocks for the minimal UI.

import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:opacity-90",
  secondary: "border border-line bg-surface text-fg hover:border-line-strong hover:bg-subtle",
  ghost: "text-muted hover:bg-subtle hover:text-fg",
};

export function buttonClass(variant: Variant = "secondary", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANT[variant]} ${extra}`;
}

export function Button({ variant = "secondary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={buttonClass(variant, `h-10 ${className}`)} {...props} />;
}

export function Chip({ children, tone = "plain", icon }: { children: ReactNode; tone?: "plain" | "ok" | "warn"; icon?: ReactNode }) {
  const tones = {
    plain: "border-line text-muted",
    ok: "border-ok/25 text-ok",
    warn: "border-accent/25 text-accent",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[11px] font-medium uppercase tracking-[0.16em] text-faint ${className}`}>{children}</p>;
}
