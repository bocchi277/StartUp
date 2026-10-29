"use client";

import { useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Textarea } from "@/components/ui";
import { applyToJob } from "@/lib/actions/hiring";

export function ApplyForm({ jobId }: { jobId: string }) {
  const t = useTranslations("jobs");
  return (
    <ActionForm action={applyToJob} className="space-y-3">
      <input type="hidden" name="job_id" value={jobId} />
      <Field label={t("coverNote")} htmlFor="cover_note" hint={t("coverNoteHint")}>
        <Textarea id="cover_note" name="cover_note" maxLength={500} className="min-h-20" />
      </Field>
      <SubmitButton className="w-full">{t("apply")}</SubmitButton>
    </ActionForm>
  );
}
