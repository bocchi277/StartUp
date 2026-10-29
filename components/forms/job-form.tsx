"use client";

import { useLocale, useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CheckboxPill, Field, Input, Select, Textarea } from "@/components/ui";
import { LocationFields } from "@/components/location-fields";
import { createJob, updateJob } from "@/lib/actions/employer";
import { EMPLOYMENT_TYPES, MEALS, PAY_FREQUENCIES, WEEKLY_OFFS } from "@/lib/constants";
import type { Tables } from "@/types/database";

type Taxonomy = {
  roles: Tables<"job_roles">[];
  cuisines: Tables<"cuisines">[];
  skills: Tables<"skills">[];
};

export function JobForm({
  taxonomy, job, business,
}: {
  taxonomy: Taxonomy;
  job: Tables<"jobs"> | null;
  business: Pick<Tables<"businesses">, "state" | "city">;
}) {
  const t = useTranslations("jobForm");
  const te = useTranslations("enums");
  const locale = useLocale();
  const name = (i: { name_en: string; name_hi: string }) => (locale === "hi" ? i.name_hi : i.name_en);
  const isDraft = !job || job.status === "draft";

  return (
    <ActionForm action={job ? updateJob : createJob} className="space-y-5">
      {job && <input type="hidden" name="job_id" value={job.id} />}

      <Card className="space-y-4">
        <h2 className="font-semibold text-stone-900">{t("sectionRole")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("role")} htmlFor="role_id" required>
            <Select id="role_id" name="role_id" required defaultValue={job?.role_id ?? ""}>
              <option value="" disabled>{t("chooseRole")}</option>
              {taxonomy.roles.map((r) => (
                <option key={r.id} value={r.id}>{name(r)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("title")} htmlFor="title" required hint={t("titleHint")}>
            <Input id="title" name="title" required minLength={3} maxLength={120} defaultValue={job?.title ?? ""} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("openings")} htmlFor="openings" required>
            <Input id="openings" name="openings" type="number" min={1} max={100} required defaultValue={job?.openings ?? 1} />
          </Field>
          <Field label={t("minExperience")} htmlFor="min_experience_months" required hint={t("minExperienceHint")}>
            <Input id="min_experience_months" name="min_experience_months" type="number" min={0} max={600} required defaultValue={job?.min_experience_months ?? 0} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-800">{t("cuisines")}</legend>
          <div className="flex flex-wrap gap-2">
            {taxonomy.cuisines.map((c) => (
              <CheckboxPill key={c.id} name="cuisine_ids" value={String(c.id)} label={name(c)} defaultChecked={job?.cuisine_ids.includes(c.id)} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-800">{t("skills")}</legend>
          <div className="flex flex-wrap gap-2">
            {taxonomy.skills.map((s) => (
              <CheckboxPill key={s.id} name="skill_ids" value={String(s.id)} label={name(s)} defaultChecked={job?.skill_ids.includes(s.id)} />
            ))}
          </div>
        </fieldset>
        <Field label={t("description")} htmlFor="description" hint={t("descriptionHint")}>
          <Textarea id="description" name="description" maxLength={3000} defaultValue={job?.description ?? ""} />
        </Field>
      </Card>

      <Card className="space-y-4 border-orange-200">
        <div>
          <h2 className="font-semibold text-stone-900">{t("sectionTerms")}</h2>
          <p className="text-sm text-stone-600">{t("termsExplainer")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("salaryMin")} htmlFor="salary_min" required>
            <Input id="salary_min" name="salary_min" type="number" min={1} inputMode="numeric" required defaultValue={job?.salary_min ?? ""} />
          </Field>
          <Field label={t("salaryMax")} htmlFor="salary_max" required>
            <Input id="salary_max" name="salary_max" type="number" min={1} inputMode="numeric" required defaultValue={job?.salary_max ?? ""} />
          </Field>
          <Field label={t("payFrequency")} htmlFor="pay_frequency" required>
            <Select id="pay_frequency" name="pay_frequency" required defaultValue={job?.pay_frequency ?? "monthly"}>
              {PAY_FREQUENCIES.map((p) => (
                <option key={p} value={p}>{te(`pay_frequency.${p}`)}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("shiftStart")} htmlFor="shift_start" required>
            <Input id="shift_start" name="shift_start" type="time" required defaultValue={job?.shift_start?.slice(0, 5) ?? ""} />
          </Field>
          <Field label={t("shiftEnd")} htmlFor="shift_end" required>
            <Input id="shift_end" name="shift_end" type="time" required defaultValue={job?.shift_end?.slice(0, 5) ?? ""} />
          </Field>
          <Field label={t("weeklyOffs")} htmlFor="weekly_offs" required>
            <Select id="weekly_offs" name="weekly_offs" required defaultValue={job ? String(job.weekly_offs) : ""}>
              <option value="" disabled>{t("choose")}</option>
              {WEEKLY_OFFS.map((w) => (
                <option key={w} value={w}>{t("weeklyOffsOption", { count: Number(w) })}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("meals")} htmlFor="meals" required>
            <Select id="meals" name="meals" required defaultValue={job?.meals ?? ""}>
              <option value="" disabled>{t("choose")}</option>
              {MEALS.map((m) => (
                <option key={m} value={m}>{te(`meals.${m}`)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("accommodation")} htmlFor="accommodation" required>
            <Select id="accommodation" name="accommodation" required defaultValue={job ? (job.accommodation ? "yes" : "no") : ""}>
              <option value="" disabled>{t("choose")}</option>
              <option value="yes">{t("yes")}</option>
              <option value="no">{t("no")}</option>
            </Select>
          </Field>
          <Field label={t("employmentType")} htmlFor="employment_type" required>
            <Select id="employment_type" name="employment_type" required defaultValue={job?.employment_type ?? "full_time"}>
              {EMPLOYMENT_TYPES.map((e) => (
                <option key={e} value={e}>{te(`employment_type.${e}`)}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t("deductions")} htmlFor="deductions" required hint={t("deductionsHint")}>
          <Input id="deductions" name="deductions" required maxLength={500} defaultValue={job?.deductions ?? ""} placeholder={t("deductionsPlaceholder")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("tips")} htmlFor="tips_info">
            <Input id="tips_info" name="tips_info" maxLength={300} defaultValue={job?.tips_info ?? ""} placeholder={t("tipsPlaceholder")} />
          </Field>
          <Field label={t("joiningDate")} htmlFor="joining_date">
            <Input id="joining_date" name="joining_date" type="date" defaultValue={job?.joining_date ?? ""} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-stone-900">{t("sectionLocation")}</h2>
        <LocationFields defaultState={job?.state ?? business.state} defaultCity={job?.city ?? business.city} showPincode={false} />
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton name="intent" value="publish">{isDraft ? t("publish") : t("saveChanges")}</SubmitButton>
        {isDraft && (
          <SubmitButton name="intent" value="draft" variant="secondary">{t("saveDraft")}</SubmitButton>
        )}
      </div>
    </ActionForm>
  );
}
