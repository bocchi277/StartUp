"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Select, Textarea } from "@/components/ui";
import { createReport } from "@/lib/actions/moderation";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportForm({ targetType, targetId }: { targetType: "job" | "business" | "worker" | "review"; targetId: string }) {
  const t = useTranslations("report");
  const te = useTranslations("enums.report_reason");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 underline underline-offset-4 hover:text-red-700">
        <Flag className="size-3.5" aria-hidden /> {t(`open.${targetType}`)}
      </button>
    );
  }

  return (
    <ActionForm action={createReport} className="space-y-3 rounded-2xl border-2 border-red-200 bg-red-50/50 p-4">
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <Field label={t("reason")} htmlFor={`report-reason-${targetId}`} required>
        <Select id={`report-reason-${targetId}`} name="reason" required defaultValue="">
          <option value="" disabled>{t("chooseReason")}</option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>{te(r)}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("details")} htmlFor={`report-details-${targetId}`} hint={t("detailsHint")}>
        <Textarea id={`report-details-${targetId}`} name="details" maxLength={1000} />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton variant="danger">{t("submit")}</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-600">{t("cancel")}</button>
      </div>
    </ActionForm>
  );
}
