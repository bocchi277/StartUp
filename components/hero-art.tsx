import { getLocale, getTranslations } from "next-intl/server";
import { BadgeCheck, CalendarOff, Clock, Flame, House, MapPin, Store, Utensils } from "lucide-react";
import { formatSalaryRange } from "@/lib/format";
import { Stamp } from "@/components/ui";

/** Illustration for the hero: a sample ticket pinned over a "terms" slip. Not a real job. */
export async function HeroArt() {
  const locale = await getLocale();
  const t = await getTranslations("home.sample");
  const tt = await getTranslations("terms");

  return (
    <div className="relative mx-auto h-[29rem] w-full max-w-sm select-none" aria-hidden>
      {/* terms slip behind */}
      <div className="ticket absolute right-0 top-0 w-60 rotate-[6deg] overflow-hidden">
        <div className="bg-ink px-4 py-2.5 text-center">
          <p className="font-display-wonky text-xl text-cream">{tt("title")}</p>
        </div>
        <div className="ticket-tear ticket-tear-on-ink" />
        <dl className="space-y-2 px-4 py-3 text-xs">
          {[
            [tt("weeklyOffs"), t("offs")],
            [tt("meals"), t("meals")],
            [tt("accommodation"), tt("provided")],
            [tt("deductions"), t("deductions")],
          ].map(([k, v]) => (
            <div key={k} className="menu-row">
              <dt className="font-semibold text-stone-700">{k}</dt>
              <span className="leader" />
              <dd className="font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* main ticket */}
      <div className="ticket absolute left-0 top-32 w-72 -rotate-[4deg] sm:w-80">
        <div className="flex items-center justify-between px-4 pt-3.5">
          <span className="eyebrow flex items-center gap-1.5 text-orange-700">
            <Flame className="size-3.5" /> {t("role")}
          </span>
          <span className="font-mono text-[11px] text-stone-500">KOT #0427</span>
        </div>
        <div className="px-4 pb-3 pt-1.5">
          <p className="font-display text-xl font-semibold leading-snug">{t("title")}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1"><Store className="size-3.5" />{t("business")}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{t("city")}</span>
          </p>
        </div>
        <div className="ticket-tear" />
        <div className="px-4 pb-2 pt-3">
          <p className="font-display text-2xl font-bold">{formatSalaryRange(18000, 24000, locale)}</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-stone-500">{t("perMonth")}</p>
        </div>
        <ul className="flex flex-wrap gap-1.5 px-4 pb-4">
          <li className="chip"><Clock className="size-3" /> {t("shift")}</li>
          <li className="chip"><CalendarOff className="size-3" /> {t("offs")}</li>
          <li className="chip border-green-200 bg-green-50 text-green-700"><Utensils className="size-3" /> {t("meals")}</li>
          <li className="chip border-green-200 bg-green-50 text-green-700"><House className="size-3" /> {t("stay")}</li>
        </ul>
        <Stamp tone="green" className="absolute -bottom-7 left-5 rotate-[-8deg] bg-cream text-xs">
          <BadgeCheck className="size-4" /> {t("verified")}
        </Stamp>
      </div>

      {/* sticker */}
      <div className="absolute bottom-0 right-6 flex size-28 rotate-[10deg] flex-col items-center justify-center rounded-full border-2 border-ink bg-orange-600 text-center text-cream shadow-hard">
        <span className="font-display text-3xl font-bold leading-none">₹</span>
        <span className="mt-1 px-3 font-mono text-[10px] font-bold uppercase leading-tight tracking-wider">{t("sticker")}</span>
      </div>
    </div>
  );
}
