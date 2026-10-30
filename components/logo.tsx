import { APP_NAME } from "@/lib/brand";
import { cn } from "@/components/ui";

/** Ticket-shaped mark: a kitchen order ticket with a torn edge and a tick. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 40" className={cn("h-9 w-8", className)} aria-hidden>
      <path
        d="M4 3h28v29l-3.5 3-3.5-3-3.5 3-3.5-3-3.5 3-3.5-3L4 35z"
        fill="#f4b02a"
        stroke="#1e1915"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M10 11h16M10 16h10" stroke="#1e1915" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 23.5l3.5 3.5 8-8" fill="none" stroke="#bc3f15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className, inverted }: { className?: string; inverted?: boolean }) {
  // Splits "SomethingHire" into "Something" + italic "Hire" when the name ends that way.
  const m = /^(.*?)(Hire)$/.exec(APP_NAME);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cn("font-display text-xl font-bold leading-none tracking-tight", inverted ? "text-cream" : "text-ink")}>
        {m ? (
          <>
            {m[1]}
            <span className={cn("font-display-wonky", inverted ? "text-haldi" : "text-orange-600")}>{m[2]}</span>
          </>
        ) : (
          APP_NAME
        )}
      </span>
    </span>
  );
}
