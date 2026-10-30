import { getTranslations } from "next-intl/server";
import { Bookmark } from "lucide-react";
import { requireWorker } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_CARD_SELECT, type JobCardData } from "@/lib/queries";
import { JobCard } from "@/components/display";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("saved") };
}

export default async function SavedJobsPage() {
  const user = await requireWorker();
  const t = await getTranslations("savedJobs");
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_jobs")
    .select(`created_at, jobs(${JOB_CARD_SELECT})`)
    .eq("worker_id", user.id)
    .order("created_at", { ascending: false });
  // Jobs that closed and are no longer visible come back as null.
  const jobs = (data ?? []).map((r) => r.jobs as unknown as JobCardData | null).filter((j): j is JobCardData => Boolean(j));

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {jobs.length ? (
        <div className="card-grid">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      ) : (
        <EmptyState icon={<Bookmark className="size-5" />} title={t("empty")}>
          <p>{t("emptyHint")}</p>
          <LinkButton href="/jobs" className="mt-4">{t("browse")}</LinkButton>
        </EmptyState>
      )}
    </div>
  );
}
