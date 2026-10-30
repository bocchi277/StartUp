import { getLocale, getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { experienceLabel, formatDate, formatSalaryRange } from "@/lib/format";
import { localName, namesFor, type Taxonomy } from "@/lib/taxonomy";
import { photoUrl } from "@/lib/storage";
import { summarize, type ReviewRow } from "@/lib/reviews";
import { Avatar, Badge, Stamp, Stars } from "@/components/ui";
import { RoleIcon } from "@/components/role-icon";
import type { Tables } from "@/types/database";

export async function WorkerSummary({
  name, profile, taxonomy, reviews = [],
}: {
  name: string;
  profile: Tables<"worker_profiles">;
  taxonomy: Taxonomy;
  reviews?: ReviewRow[];
}) {
  const locale = await getLocale();
  const t = await getTranslations("workerSummary");
  const te = await getTranslations("enums");
  const tl = await getTranslations("languages");
  const tr = await getTranslations("reviews");
  const role = taxonomy.roles.find((r) => r.id === profile.primary_role_id);
  const exp = experienceLabel(profile.total_experience_months);
  const secondary = namesFor(profile.secondary_role_ids, taxonomy.roles, locale);
  const cuisines = namesFor(profile.cuisine_ids, taxonomy.cuisines, locale);
  const skills = namesFor(profile.skill_ids, taxonomy.skills, locale);
  const summary = summarize(reviews);

  const facts: [string, string][] = [
    [t("experience"), t("experienceValue", exp) || t("fresher")],
    [
      t("expectedSalary"),
      profile.expected_salary_min || profile.expected_salary_max
        ? `${formatSalaryRange(profile.expected_salary_min, profile.expected_salary_max, locale)} ${te(`payPer.${profile.pay_frequency}`)}`
        : t("notSpecified"),
    ],
    [t("shift"), te(`shift_preference.${profile.preferred_shift}`)],
    [t("employmentTypes"), profile.employment_types.map((e) => te(`employment_type.${e}`)).join(", ")],
    [t("availableFrom"), profile.available_from ? formatDate(profile.available_from, locale) : t("immediately")],
    [t("accommodation"), profile.needs_accommodation ? t("needsAccommodation") : t("noAccommodation")],
  ];

  return (
    <section className="ticket overflow-hidden">
      <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
        <Avatar src={photoUrl("avatars", profile.photo_url)} name={name || "?"} size={76} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow flex items-center gap-1.5 text-orange-700">
            <RoleIcon slug={role?.slug} className="size-3.5" /> {localName(role, locale)}
          </p>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{name || t("unnamed")}</h2>
          {profile.headline && <p className="text-stone-700">{profile.headline}</p>}
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-stone-600">
            <MapPin className="size-3.5" aria-hidden /> {profile.city}, {profile.state}
          </p>
          {summary.count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Stars value={summary.average} size={14} />
              <span className="font-mono text-xs text-stone-600">{summary.average.toFixed(1)} · {tr("count", { count: summary.count })}</span>
            </p>
          )}
        </div>
        {profile.open_to_work && <Stamp tone="green">{t("openToWork")}</Stamp>}
      </div>
      <div className="ticket-tear" aria-hidden />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3 sm:p-6">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="eyebrow text-[10px]">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-4 border-t-2 border-dashed border-stone-200 p-5 sm:p-6">
        {[
          [t("cuisines"), cuisines, "orange"],
          [t("skills"), skills, "neutral"],
          [t("otherRoles"), secondary, "neutral"],
          [t("languages"), profile.languages_spoken.map((l) => (tl.has(l as "hindi") ? tl(l as "hindi") : l)), "neutral"],
        ].map(([label, items, tone]) =>
          (items as string[]).length ? (
            <div key={label as string}>
              <p className="eyebrow mb-1.5 text-[10px]">{label as string}</p>
              <div className="flex flex-wrap gap-1.5">
                {(items as string[]).map((i) => <Badge key={i} tone={tone as "orange" | "neutral"}>{i}</Badge>)}
              </div>
            </div>
          ) : null,
        )}
        {profile.willing_to_relocate && <p className="text-sm font-medium text-stone-700">{t("willingToRelocate")}</p>}
        {profile.about && <p className="whitespace-pre-line text-sm leading-relaxed text-stone-800">{profile.about}</p>}
      </div>
    </section>
  );
}
