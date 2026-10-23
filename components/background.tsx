import { Flower2, Scissors, Sparkles } from "lucide-react";

// Decorative backdrop: drifting glows, a fading grid and a few floating craft icons.
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(212_175_55/0.16),transparent_62%)] blur-2xl" />
      <div className="absolute -left-40 top-1/3 h-[30rem] w-[30rem] animate-drift-a rounded-full bg-[radial-gradient(circle,rgb(142_28_28/0.32),transparent_65%)] blur-3xl" />
      <div className="absolute -right-32 top-[55%] h-[28rem] w-[28rem] animate-drift-b rounded-full bg-[radial-gradient(circle,rgb(56_189_248/0.12),transparent_65%)] blur-3xl" />
      <div className="bg-grid absolute inset-0" />

      <Scissors className="absolute left-[7%] top-[22%] size-8 animate-float text-gold/15 [animation-delay:-2s]" />
      <Sparkles className="absolute right-[9%] top-[16%] size-7 animate-float text-pink-300/15 [animation-delay:-5s]" />
      <Flower2 className="absolute right-[14%] top-[62%] hidden size-9 animate-float text-amber-400/15 sm:block" />
      <Scissors className="absolute bottom-[12%] left-[12%] hidden size-6 animate-float text-sky-300/10 [animation-delay:-7s] sm:block" />
    </div>
  );
}
