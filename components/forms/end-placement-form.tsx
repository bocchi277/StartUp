"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Textarea } from "@/components/ui";
import { endPlacement } from "@/lib/actions/hiring";

/** pending placement -> "It didn't happen" (cancel); active -> "Mark as left" with end date. */
export function EndPlacementForm({ placementId, active, minDate }: { placementId: string; active: boolean; minDate: string }) {
  const t = useTranslations("placement");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-stone-600 underline">
        {active ? t("markLeft") : t("didNotJoin")}
      </button>
    );
  }

  return (
    <ActionForm action={endPlacement} className="mt-2 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <input type="hidden" name="placement_id" value={placementId} />
      {active && (
        <Field label={t("endDate")} htmlFor={`end-${placementId}`} required>
          <Input id={`end-${placementId}`} name="end_date" type="date" required min={minDate} />
        </Field>
      )}
      <Field label={t("reason")} htmlFor={`reason-${placementId}`} hint={t("reasonHint")}>
        <Textarea id={`reason-${placementId}`} name="reason" maxLength={500} className="min-h-16" />
      </Field>
      <div className="flex gap-2">
        <SubmitButton variant="danger">{t("confirm")}</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-600">{t("cancel")}</button>
      </div>
    </ActionForm>
  );
}
