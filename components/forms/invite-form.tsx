"use client";

import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Select, Textarea } from "@/components/ui";
import { inviteWorker } from "@/lib/actions/engagement";

export function InviteForm({ workerId, jobs }: { workerId: string; jobs: { id: string; title: string }[] }) {
  const t = useTranslations("invite");
  return (
    <ActionForm action={inviteWorker} className="space-y-3">
      <input type="hidden" name="worker_id" value={workerId} />
      <Field label={t("job")} htmlFor="invite-job" required>
        <Select id="invite-job" name="job_id" required defaultValue={jobs.length === 1 ? jobs[0].id : ""}>
          <option value="" disabled>{t("chooseJob")}</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </Select>
      </Field>
      <Field label={t("message")} htmlFor="invite-message" hint={t("messageHint")}>
        <Textarea id="invite-message" name="message" maxLength={300} className="min-h-16" />
      </Field>
      <SubmitButton><Send className="size-4" aria-hidden /> {t("send")}</SubmitButton>
    </ActionForm>
  );
}
