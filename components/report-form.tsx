"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Select, Textarea } from "@/components/ui";
import { createReport } from "@/lib/actions/moderation";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportForm({ targetType, targetId }: { targetType: "job" | "business" | "worker"; targetId: string }) {
  const t = useTranslations("report");
  const te = useTranslations("enums.report_reason");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-stone-500 underline hover:text-red-700">
        {t(`open.${targetType}`)}
      </button>
    );
  }

  return (
    <ActionForm action={createReport} className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <Field label={t("reason")} htmlFor="report-reason" required>
        <Select id="report-reason" name="reason" required defaultValue="">
          <option value="" disabled>{t("chooseReason")}</option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>{te(r)}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("details")} htmlFor="report-details" hint={t("detailsHint")}>
        <Textarea id="report-details" name="details" maxLength={1000} />
      </Field>
      <div className="flex gap-2">
        <SubmitButton variant="danger">{t("submit")}</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-600">{t("cancel")}</button>
      </div>
    </ActionForm>
  );
}
