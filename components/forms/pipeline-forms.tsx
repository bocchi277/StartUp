"use client";

import { useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { addNote, hireApplicant, setApplicationStatus } from "@/lib/actions/hiring";
import { PAY_FREQUENCIES, type ApplicationStatus } from "@/lib/constants";

export function StatusButtons({ applicationId, next }: { applicationId: string; next: ApplicationStatus[] }) {
  const t = useTranslations("pipeline");
  const simple = next.filter((s) => s !== "interview");
  if (!simple.length) return null;
  return (
    <ActionForm action={setApplicationStatus} className="flex flex-wrap gap-2">
      <input type="hidden" name="application_id" value={applicationId} />
      {simple.map((s) => (
        <SubmitButton key={s} name="status" value={s} variant={s === "rejected" ? "danger" : "secondary"}>
          {t(`moveTo.${s}`)}
        </SubmitButton>
      ))}
    </ActionForm>
  );
}

export function InterviewForm({ applicationId, defaultAt, defaultNote }: {
  applicationId: string; defaultAt?: string; defaultNote?: string | null;
}) {
  const t = useTranslations("pipeline");
  return (
    <ActionForm action={setApplicationStatus} className="space-y-3">
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="status" value="interview" />
      <Field label={t("interviewAt")} htmlFor="interview_at" required hint={t("interviewHint")}>
        <Input id="interview_at" name="interview_at" type="datetime-local" required defaultValue={defaultAt} />
      </Field>
      <Field label={t("interviewNote")} htmlFor="interview_note">
        <Textarea id="interview_note" name="interview_note" maxLength={500} className="min-h-16" defaultValue={defaultNote ?? ""} placeholder={t("interviewNotePlaceholder")} />
      </Field>
      <SubmitButton variant="secondary">{t("scheduleInterview")}</SubmitButton>
    </ActionForm>
  );
}

export function HireForm({ applicationId, defaultSalary, defaultFrequency, today }: {
  applicationId: string; defaultSalary: number; defaultFrequency: string; today: string;
}) {
  const t = useTranslations("pipeline");
  const te = useTranslations("enums.pay_frequency");
  return (
    <ActionForm action={hireApplicant} className="space-y-3" confirm={t("confirmHire")}>
      <input type="hidden" name="application_id" value={applicationId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("agreedSalary")} htmlFor="agreed_salary" required>
          <Input id="agreed_salary" name="agreed_salary" type="number" min={1} required inputMode="numeric" defaultValue={defaultSalary} />
        </Field>
        <Field label={t("payFrequency")} htmlFor="hire_freq" required>
          <Select id="hire_freq" name="pay_frequency" required defaultValue={defaultFrequency}>
            {PAY_FREQUENCIES.map((p) => <option key={p} value={p}>{te(p)}</option>)}
          </Select>
        </Field>
        <Field label={t("startDate")} htmlFor="start_date" required>
          <Input id="start_date" name="start_date" type="date" required defaultValue={today} />
        </Field>
      </div>
      <p className="text-xs text-stone-500">{t("hireExplainer")}</p>
      <SubmitButton>{t("markHired")}</SubmitButton>
    </ActionForm>
  );
}

export function NoteForm({ applicationId }: { applicationId: string }) {
  const t = useTranslations("pipeline");
  return (
    <ActionForm action={addNote} className="space-y-2">
      <input type="hidden" name="application_id" value={applicationId} />
      <Textarea name="body" required maxLength={1000} className="min-h-16" placeholder={t("notePlaceholder")} aria-label={t("addNote")} />
      <SubmitButton variant="secondary">{t("addNote")}</SubmitButton>
    </ActionForm>
  );
}
