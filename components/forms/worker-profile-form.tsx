"use client";

import { useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Button, Card, CheckboxPill, Field, Input, Select, Textarea, Toggle, cn } from "@/components/ui";
import { LocationFields } from "@/components/location-fields";
import { saveWorkerProfile } from "@/lib/actions/worker";
import { EMPLOYMENT_TYPES, PAY_FREQUENCIES, SHIFT_PREFERENCES, SPOKEN_LANGUAGES } from "@/lib/constants";
import type { Tables } from "@/types/database";

type Taxonomy = {
  roles: Tables<"job_roles">[];
  cuisines: Tables<"cuisines">[];
  skills: Tables<"skills">[];
};

function Step({ active, wizard, title, index, children }: { active: boolean; wizard: boolean; title: string; index: number; children: ReactNode }) {
  return (
    <Card data-step={index} hidden={wizard && !active} className="space-y-5">
      <h2 className="flex items-baseline gap-2 font-display text-2xl font-semibold">
        <span className="font-mono text-xs font-semibold tracking-widest text-orange-600">0{index + 1}</span>
        {title}
      </h2>
      {children}
    </Card>
  );
}

function PillGroup({ legend, children, required }: { legend: string; children: ReactNode; required?: boolean }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-stone-800">
        {legend}
        {required && <span className="ml-0.5 text-orange-600" aria-hidden>*</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

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

  // Onboarding shows one section at a time; the profile page shows all three.
  const wizard = after === "onboarding";
  const [step, setStep] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const titles = [t("sectionBasics"), t("sectionWork"), t("sectionPreferences")];

  function next() {
    const section = wrapper.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const fields = Array.from(section?.querySelectorAll<HTMLInputElement>("input, select, textarea") ?? []);
    const firstBad = fields.find((f) => !f.checkValidity());
    if (firstBad) {
      firstBad.reportValidity();
      return;
    }
    setStep((s) => Math.min(2, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ActionForm action={saveWorkerProfile} className="space-y-5">
      {after && <input type="hidden" name="after" value={after} />}

      {wizard && (
        <ol className="grid grid-cols-3 gap-2" aria-label={t("progress")}>
          {titles.map((title, i) => (
            <li key={title} aria-current={i === step ? "step" : undefined}>
              <div className={cn("h-2 rounded-full border-2 border-ink", i <= step ? "bg-orange-600" : "bg-cream")} />
              <p className={cn("mt-1.5 truncate font-mono text-[11px] uppercase tracking-wider", i === step ? "font-bold text-ink" : "text-stone-500")}>
                {i + 1}. {title}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div ref={wrapper} className="space-y-5">
        <Step index={0} active={step === 0} wizard={wizard} title={titles[0]}>
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
        </Step>

        <Step index={1} active={step === 1} wizard={wizard} title={titles[1]}>
          <Field label={t("primaryRole")} htmlFor="primary_role_id" required>
            <Select id="primary_role_id" name="primary_role_id" required defaultValue={profile?.primary_role_id ?? ""}>
              <option value="" disabled>{t("chooseRole")}</option>
              {taxonomy.roles.map((r) => (
                <option key={r.id} value={r.id}>{name(r)}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("experienceYears")} htmlFor="experience_years" required>
              <Input id="experience_years" name="experience_years" type="number" min={0} max={50} required defaultValue={Math.floor(months / 12)} />
            </Field>
            <Field label={t("experienceMonths")} htmlFor="experience_months" required>
              <Input id="experience_months" name="experience_months" type="number" min={0} max={11} required defaultValue={months % 12} />
            </Field>
          </div>
          <PillGroup legend={t("cuisines")}>
            {taxonomy.cuisines.map((c) => (
              <CheckboxPill key={c.id} name="cuisine_ids" value={String(c.id)} label={name(c)} defaultChecked={profile?.cuisine_ids.includes(c.id)} />
            ))}
          </PillGroup>
          <PillGroup legend={t("skills")}>
            {taxonomy.skills.map((s) => (
              <CheckboxPill key={s.id} name="skill_ids" value={String(s.id)} label={name(s)} defaultChecked={profile?.skill_ids.includes(s.id)} />
            ))}
          </PillGroup>
          <PillGroup legend={t("secondaryRoles")}>
            {taxonomy.roles.map((r) => (
              <CheckboxPill key={r.id} name="secondary_role_ids" value={String(r.id)} label={name(r)} defaultChecked={profile?.secondary_role_ids.includes(r.id)} />
            ))}
          </PillGroup>
        </Step>

        <Step index={2} active={step === 2} wizard={wizard} title={titles[2]}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("salaryMin")} htmlFor="expected_salary_min">
              <Input id="expected_salary_min" name="expected_salary_min" type="number" min={0} inputMode="numeric" defaultValue={profile?.expected_salary_min ?? ""} />
            </Field>
            <Field label={t("salaryMax")} htmlFor="expected_salary_max">
              <Input id="expected_salary_max" name="expected_salary_max" type="number" min={0} inputMode="numeric" defaultValue={profile?.expected_salary_max ?? ""} />
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
          <PillGroup legend={t("employmentTypes")} required>
            {EMPLOYMENT_TYPES.map((e) => (
              <CheckboxPill key={e} name="employment_types" value={e} label={te(`employment_type.${e}`)} defaultChecked={(profile?.employment_types ?? ["full_time"]).includes(e)} />
            ))}
          </PillGroup>
          <PillGroup legend={t("languages")}>
            {SPOKEN_LANGUAGES.map((l) => (
              <CheckboxPill key={l} name="languages_spoken" value={l} label={tl(l)} defaultChecked={profile?.languages_spoken.includes(l)} />
            ))}
          </PillGroup>
          <div className="space-y-4 rounded-2xl bg-stone-100 p-4">
            <Toggle name="open_to_work" label={t("openToWork")} hint={t("openToWorkHint")} defaultChecked={profile?.open_to_work ?? true} />
            <Toggle name="needs_accommodation" label={t("needsAccommodation")} defaultChecked={profile?.needs_accommodation} />
            <Toggle name="willing_to_relocate" label={t("willingToRelocate")} defaultChecked={profile?.willing_to_relocate} />
          </div>
          <Field label={t("about")} htmlFor="about" hint={t("aboutHint")}>
            <Textarea id="about" name="about" maxLength={1000} defaultValue={profile?.about ?? ""} />
          </Field>
        </Step>
      </div>

      {wizard ? (
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" aria-hidden /> {t("back")}
            </Button>
          ) : <span />}
          {step < 2 ? (
            <Button type="button" onClick={next}>
              {t("next")} <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <SubmitButton>{t("saveAndContinue")}</SubmitButton>
          )}
        </div>
      ) : (
        <SubmitButton className="w-full sm:w-auto">{t("save")}</SubmitButton>
      )}
    </ActionForm>
  );
}
