import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- buttons
// Chunky ink-outlined buttons with a hard offset shadow that "presses" on click.
const buttonVariants = {
  primary:
    "border-ink bg-orange-600 text-cream shadow-hard hover:bg-orange-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:bg-orange-300 disabled:shadow-none",
  secondary:
    "border-ink bg-cream text-ink shadow-hard hover:bg-stone-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:text-stone-400 disabled:shadow-none",
  haldi:
    "border-ink bg-haldi text-ink shadow-hard hover:bg-yellow-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  danger:
    "border-red-600 bg-cream text-red-700 hover:bg-red-50",
  ghost: "border-transparent text-stone-700 hover:bg-stone-200/60 hover:text-ink",
  whatsapp:
    "border-ink bg-[#25D366] text-ink shadow-hard hover:bg-[#1fbe5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
} as const;
export type ButtonVariant = keyof typeof buttonVariants;

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-[transform,box-shadow,background-color] duration-100 disabled:cursor-not-allowed";

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(buttonBase, buttonVariants[variant], className);
}

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function LinkButton({
  variant = "primary", className, ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

// ---------------------------------------------------------------- form fields
const fieldBase =
  "block w-full rounded-xl border-2 border-stone-300 bg-cream px-3.5 py-2.5 text-base text-ink placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-ink focus:outline-none focus:ring-4 focus:ring-haldi/40 aria-invalid:border-red-500 sm:text-sm";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, "appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231e1915' stroke-width='2' fill='none'/%3E%3C/svg%3E\")" }} {...props} />;
}

export function Field({
  label, htmlFor, hint, required, children, error,
}: {
  label: ReactNode; htmlFor?: string; hint?: ReactNode; required?: boolean; children: ReactNode; error?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-stone-800">
        {label}
        {required && <span className="ml-0.5 text-orange-600" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-stone-600">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function CheckboxPill({ name, value, label, defaultChecked }: {
  name: string; value: string; label: string; defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="select-none rounded-full border-2 border-stone-300 bg-cream px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-500 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:ring-4 peer-focus-visible:ring-haldi/50">
        {label}
      </span>
    </label>
  );
}

export function Toggle({ name, label, defaultChecked, hint }: {
  name: string; label: string; defaultChecked?: boolean; hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border-2 border-ink bg-stone-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-ink after:transition-transform peer-checked:bg-green-500 peer-checked:after:translate-x-5 peer-checked:after:bg-cream peer-focus-visible:ring-4 peer-focus-visible:ring-haldi/50"
      />
      <span>
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {hint && <span className="block text-xs text-stone-600">{hint}</span>}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------- surfaces
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-cream p-4 shadow-soft sm:p-5", className)} {...props} />;
}

const badgeTones = {
  neutral: "border-stone-300 bg-stone-100 text-stone-700",
  green: "border-green-200 bg-green-50 text-green-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  red: "border-red-200 bg-red-50 text-red-700",
  yellow: "border-yellow-300 bg-yellow-100 text-yellow-800",
  ink: "border-ink bg-ink text-cream",
  kokum: "border-kokum/30 bg-kokum-soft text-kokum",
} as const;
export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold", badgeTones[tone], className)}
      {...props}
    />
  );
}

const stampTones = { green: "text-green-600", blue: "text-blue-600", red: "text-red-600", ink: "text-stone-700", masala: "text-orange-600" } as const;

/** Rubber-stamp label, used for verification and statuses that matter. */
export function Stamp({ tone = "green", className, ...props }: ComponentProps<"span"> & { tone?: keyof typeof stampTones }) {
  return <span className={cn("stamp", stampTones[tone], className)} {...props} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function PageHeader({
  title, subtitle, actions, eyebrow,
}: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle && <div className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-cream/60 px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border-2 border-ink bg-haldi text-ink">{icon}</div>}
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-stone-600">{children}</div>}
    </div>
  );
}

export function SectionTitle({ children, index, action }: { children: ReactNode; index?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="flex items-baseline gap-2 font-display text-2xl font-semibold text-ink">
        {index && <span className="font-mono text-xs font-semibold tracking-widest text-orange-600">{index}</span>}
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Big number + label, styled like a till receipt. */
export function StatTile({ value, label, tone = "cream" }: { value: ReactNode; label: ReactNode; tone?: "cream" | "haldi" | "ink" }) {
  const tones = {
    cream: "bg-cream text-ink",
    haldi: "bg-haldi text-ink",
    ink: "bg-ink text-cream",
  };
  return (
    <div className={cn("rounded-2xl border-2 border-ink p-4 shadow-hard", tones[tone])}>
      <p className="font-display text-4xl font-semibold leading-none">{value}</p>
      <p className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-widest opacity-80">{label}</p>
    </div>
  );
}

export function Avatar({ src, name, size = 48, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  return src ? (
    // Plain <img>: Supabase Storage URLs are public and already resized on upload.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className={cn("shrink-0 rounded-full border-2 border-ink object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink bg-haldi font-display font-semibold text-ink", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-orange-600", className)} aria-label={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
              fill={`url(#s${i}-${fill})`}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}
