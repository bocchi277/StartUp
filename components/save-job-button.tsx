"use client";

import { useTranslations } from "next-intl";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { toggleSavedJob } from "@/lib/actions/engagement";

export function SaveJobButton({ jobId, saved }: { jobId: string; saved: boolean }) {
  const t = useTranslations("jobs");
  return (
    <ActionForm action={toggleSavedJob} hideMessages>
      <input type="hidden" name="job_id" value={jobId} />
      <SubmitButton variant="secondary" className="w-full" aria-pressed={saved}>
        {saved ? <BookmarkCheck className="size-4 text-orange-600" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
        {saved ? t("saved") : t("save")}
      </SubmitButton>
    </ActionForm>
  );
}
