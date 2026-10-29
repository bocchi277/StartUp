"use client";

import { useLocale, useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { addHistory } from "@/lib/actions/worker";
import type { Tables } from "@/types/database";

export function HistoryForm({ roles }: { roles: Tables<"job_roles">[] }) {
  const t = useTranslations("history");
  const locale = useLocale();

  return (
    <ActionForm action={addHistory} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("employerName")} htmlFor="employer_name" required>
          <Input id="employer_name" name="employer_name" required minLength={2} maxLength={120} />
        </Field>
        <Field label={t("role")} htmlFor="h-role">
          <Select id="h-role" name="role_id" defaultValue="">
            <option value="">—</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{locale === "hi" ? r.name_hi : r.name_en}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t("jobTitle")} htmlFor="job_title">
        <Input id="job_title" name="job_title" maxLength={120} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("startDate")} htmlFor="start_date" required>
          <Input id="start_date" name="start_date" type="date" required />
        </Field>
        <Field label={t("endDate")} htmlFor="end_date" hint={t("endDateHint")}>
          <Input id="end_date" name="end_date" type="date" />
        </Field>
      </div>
      <Field label={t("reasonForLeaving")} htmlFor="reason_for_leaving" hint={t("reasonHint")}>
        <Textarea id="reason_for_leaving" name="reason_for_leaving" maxLength={500} className="min-h-16" />
      </Field>
      <SubmitButton variant="secondary">{t("add")}</SubmitButton>
    </ActionForm>
  );
}
