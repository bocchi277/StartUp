import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, EyeOff, ScrollText } from "lucide-react";

/** Split layout for auth pages: an ink "kitchen pass" panel and the form. */
export async function AuthShell({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode }) {
  const t = await getTranslations("authShell");
  const points = [
    { icon: ScrollText, text: t("p1") },
    { icon: BadgeCheck, text: t("p2") },
    { icon: EyeOff, text: t("p3") },
  ];
  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border-2 border-ink bg-cream shadow-hard-lg md:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-9 text-cream md:flex">
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full border-[22px] border-orange-600/50" />
        <div aria-hidden className="pointer-events-none absolute right-8 top-24 size-16 rotate-12 rounded-xl border-4 border-haldi/60" />
        <div className="relative">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-haldi">{t("eyebrow")}</p>
          <p className="font-display-wonky mt-4 text-4xl leading-tight">{t("quote")}</p>
        </div>
        <ul className="relative mt-10 space-y-4">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-stone-200">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-haldi text-ink">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
      </aside>
      <div className="p-6 sm:p-10">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-stone-600">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-stone-500">
      <span className="h-0.5 flex-1 border-t-2 border-dashed border-stone-300" />
      {label}
      <span className="h-0.5 flex-1 border-t-2 border-dashed border-stone-300" />
    </div>
  );
}
