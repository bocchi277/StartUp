"use client";

import { useLocale, useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CheckboxPill, Field, Input, Select, Textarea, Toggle } from "@/components/ui";
import { LocationFields } from "@/components/location-fields";
import { saveWorkerProfile } from "@/lib/actions/worker";
import { EMPLOYMENT_TYPES, PAY_FREQUENCIES, SHIFT_PREFERENCES, SPOKEN_LANGUAGES } from "@/lib/constants";
import type { Tables } from "@/types/database";

type Taxonomy = {
  roles: Tables<"job_roles">[];
  cuisines: Tables<"cuisines">[];
  skills: Tables<"skills">[];
};

export function WorkerProfileForm({
  taxonomy, profile, contacts, fullName, after,
}: {
  taxonomy: Taxonomy;
  profile: Tables<"worker_profiles"> | null;
  contacts: Tables<"worker_contacts"> | null;
  fullName: string;
  after?: "onboarding";
}) {
  const t = useTranslations("workerForm");
  const te = useTranslations("enums");
  const tl = useTranslations("languages");
  const locale = useLocale();
  const name = (i: { name_en: string; name_hi: string }) => (locale === "hi" ? i.name_hi : i.name_en);
  const months = profile?.total_experience_months ?? 0;

  return (
    <ActionForm action={saveWorkerProfile} className="space-y-5">
      {after && <input type="hidden" name="after" value={after} />}

      <Card className="space-y-4">
        <h2 className="font-semibold text-stone-900">{t("sectionBasics")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("fullName")} htmlFor="full_name" required>
            <Input id="full_name" name="full_name" required minLength={2} maxLength={120} defaultValue={fullName} autoComplete="name" />
          </Field>
          <Field label={t("phone")} htmlFor="phone" hint={t("phoneHint")}>
            <Input id="phone" name="phone" type="tel" inputMode="tel" pattern="\+?[0-9\s\-]{10,16}" defaultValue={contacts?.phone ?? ""} autoComplete="tel" />
          </Field>
        </div>
        <Toggle name="whatsapp_opt_in" label={t("whatsappOptIn")} defaultChecked={contacts?.whatsapp_opt_in ?? true} />
        <Field label={t("headline")} htmlFor="headline" hint={t("headlineHint")}>
          <Input id="headline" name="headline" maxLength={120} defaultValue={profile?.headline ?? ""} />
        </Field>
        <LocationFields defaultState={profile?.state} defaultCity={profile?.city} defaultPincode={profile?.pincode} />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-stone-900">{t("sectionWork")}</h2>
        <Field label={t("primaryRole")} htmlFor="primary_role_id" required>
          <Select id="primary_role_id" name="primary_role_id" required defaultValue={profile?.primary_role_id ?? ""}>
            <option value="" disabled>{t("chooseRole")}</option>
            {taxonomy.roles.map((r) => (
              <option key={r.id} value={r.id}>{name(r)}</option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-800">{t("secondaryRoles")}</legend>
          <div className="flex flex-wrap gap-2">
            {taxonomy.roles.map((r) => (
              <CheckboxPill key={r.id} name="secondary_role_ids" value={String(r.id)} label={name(r)} defaultChecked={profile?.secondary_role_ids.includes(r.id)} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-800">{t("cuisines")}</legend>
          <div className="flex flex-wrap gap-2">
            {taxonomy.cuisines.map((c) => (
              <CheckboxPill key={c.id} name="cuisine_ids" value={String(c.id)} label={name(c)} defaultChecked={profile?.cuisine_ids.includes(c.id)} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-800">{t("skills")}</legend>
          <div className="flex flex-wrap gap-2">
            {taxonomy.skills.map((s) => (
              <CheckboxPill key={s.id} name="skill_ids" value={String(s.id)} label={name(s)} defaultChecked={profile?.skill_ids.includes(s.id)} />
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("experienceYears")} htmlFor="experience_years" required>
            <Input id="experience_years" name="experience_years" type="number" min={0} max={50} required defaultValue={Math.floor(months / 12)} />
          </Field>
          <Field label={t("experienceMonths")} htmlFor="experience_months" required>
            <Input id="experience_months" name="experience_months" type="number" min={0} max={11} required defaultValue={months % 12} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-stone-900">{t("sectionPreferences")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("salaryMin")} htmlFor="expected_salary_min">
            <Input id="expected_salary_min" name="expected_salary_min" type="number" min={0} step={500} inputMode="numeric" defaultValue={profile?.expected_salary_min ?? ""} />
          </Field>
          <Field label={t("salaryMax")} htmlFor="expected_salary_max">
            <Input id="expected_salary_max" name="expected_salary_max" type="number" min={0} step={500} inputMode="numeric" defaultValue={profile?.expected_salary_max ?? ""} />
          </Field>
          <Field label={t("payFrequency")} htmlFor="pay_frequency" required>
            <Select id="pay_frequency" name="pay_frequency" required defaultValue={profile?.pay_frequency ?? "monthly"}>
              {PAY_FREQUENCIES.map((p) => (
                <option key={p} value={p}>{te(`pay_frequency.${p}`)}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("preferredShift")} htmlFor="preferred_shift" required>
            <Select id="preferred_shift" name="preferred_shift" required defaultValue={profile?.preferred_shift ?? "any"}>
              {SHIFT_PREFERENCES.map((s) => (
                <option key={s} value={s}>{te(`shift_preference.${s}`)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("availableFrom")} htmlFor="available_from">
            <Input id="available_from" name="available_from" type="date" defaultValue={profile?.available_from ?? ""} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-800">
            {t("employmentTypes")} <span className="text-red-600">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPES.map((e) => (
              <CheckboxPill key={e} name="employment_types" value={e} label={te(`employment_type.${e}`)} defaultChecked={(profile?.employment_types ?? ["full_time"]).includes(e)} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-800">{t("languages")}</legend>
          <div className="flex flex-wrap gap-2">
            {SPOKEN_LANGUAGES.map((l) => (
              <CheckboxPill key={l} name="languages_spoken" value={l} label={tl(l)} defaultChecked={profile?.languages_spoken.includes(l)} />
            ))}
          </div>
        </fieldset>
        <div className="space-y-3">
          <Toggle name="open_to_work" label={t("openToWork")} hint={t("openToWorkHint")} defaultChecked={profile?.open_to_work ?? true} />
          <Toggle name="needs_accommodation" label={t("needsAccommodation")} defaultChecked={profile?.needs_accommodation} />
          <Toggle name="willing_to_relocate" label={t("willingToRelocate")} defaultChecked={profile?.willing_to_relocate} />
        </div>
        <Field label={t("about")} htmlFor="about" hint={t("aboutHint")}>
          <Textarea id="about" name="about" maxLength={1000} defaultValue={profile?.about ?? ""} />
        </Field>
      </Card>

      <SubmitButton className="w-full sm:w-auto">{after ? t("saveAndContinue") : t("save")}</SubmitButton>
    </ActionForm>
  );
}
