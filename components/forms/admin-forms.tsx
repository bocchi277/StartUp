"use client";

import { useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Input, Select } from "@/components/ui";
import { adminSetJobStatus, adminSetVerification, adminUpdateReport } from "@/lib/actions/moderation";
import { JOB_STATUSES, REPORT_STATUSES, VERIFICATION_LEVELS } from "@/lib/constants";

export function VerificationForm({ businessId, level }: { businessId: string; level: string }) {
  const t = useTranslations("admin");
  const te = useTranslations("enums.verification_level");
  return (
    <ActionForm action={adminSetVerification} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="business_id" value={businessId} />
      <Select name="level" defaultValue={level} className="w-auto" aria-label={t("verification")}>
        {VERIFICATION_LEVELS.map((v) => <option key={v} value={v}>{te(v)}</option>)}
      </Select>
      <SubmitButton variant="secondary">{t("save")}</SubmitButton>
    </ActionForm>
  );
}

export function ReportStatusForm({ reportId, status }: { reportId: string; status: string }) {
  const t = useTranslations("admin");
  const te = useTranslations("enums.report_status");
  return (
    <ActionForm action={adminUpdateReport} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="report_id" value={reportId} />
      <Select name="status" defaultValue={status} className="w-auto" aria-label={t("status")}>
        {REPORT_STATUSES.map((s) => <option key={s} value={s}>{te(s)}</option>)}
      </Select>
      <Input name="note" maxLength={1000} placeholder={t("notePlaceholder")} className="min-w-48 flex-1" />
      <SubmitButton variant="secondary">{t("save")}</SubmitButton>
    </ActionForm>
  );
}

export function JobStatusForm({ jobId, status }: { jobId: string; status: string }) {
  const t = useTranslations("admin");
  const te = useTranslations("enums.job_status");
  return (
    <ActionForm action={adminSetJobStatus} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="job_id" value={jobId} />
      <Select name="status" defaultValue={status} className="w-auto" aria-label={t("status")}>
        {JOB_STATUSES.map((s) => <option key={s} value={s}>{te(s)}</option>)}
      </Select>
      <SubmitButton variant="secondary">{t("save")}</SubmitButton>
    </ActionForm>
  );
}
