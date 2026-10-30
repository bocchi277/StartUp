import { cn } from "@/components/ui";

/** Full-bleed scrolling strip of role names, like a ticket printer's tape. */
export function Marquee({ items, label, className }: { items: string[]; label: string; className?: string }) {
  const row = items.flatMap((item, i) => [
    <span key={`i${i}`} className="whitespace-nowrap">{item}</span>,
    <span key={`s${i}`} className="text-haldi" aria-hidden>✦</span>,
  ]);
  return (
    <div className={cn("relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y-2 border-ink bg-ink py-3 text-cream", className)}>
      <p className="sr-only">{label}: {items.join(", ")}</p>
      <div className="flex w-max animate-marquee gap-6 font-mono text-sm font-semibold uppercase tracking-[0.2em]" aria-hidden>
        <div className="flex gap-6">{row}</div>
        <div className="flex gap-6">{row}</div>
      </div>
    </div>
  );
}
