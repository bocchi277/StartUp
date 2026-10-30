import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import type { ReviewRow } from "@/lib/reviews";
import { HistoryList } from "@/components/display";
import { WorkerSummary } from "@/components/worker-summary";
import { ReportForm } from "@/components/report-form";
import { InviteForm } from "@/components/forms/invite-form";
import { ReviewList } from "@/components/reviews";
import { Card, LinkButton, SectionTitle } from "@/components/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CandidatePage({ params }: PageProps<"/[locale]/e/candidates/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { business } = await requireBusiness();
  const t = await getTranslations("candidates");
  const tr = await getTranslations("reviews");
  const ti = await getTranslations("invite");
  const supabase = await createClient();

  const [{ data: profile }, { data: person }, { data: history }, { data: myApps }, { data: myJobs }, { data: invites }, { data: reviewRows }, taxonomy] =
    await Promise.all([
      supabase.from("worker_profiles").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", id).maybeSingle(),
      supabase.from("employment_history").select("*").eq("worker_id", id).order("start_date", { ascending: false }),
      supabase.from("applications").select("id, job_id, jobs!inner(title, business_id)").eq("worker_id", id).eq("jobs.business_id", business.id),
      supabase.from("jobs").select("id, title").eq("business_id", business.id).eq("status", "open").gt("expires_at", new Date().toISOString()),
      supabase.from("job_invites").select("job_id, jobs(title)").eq("worker_id", id).eq("business_id", business.id),
      supabase.from("reviews").select("*, businesses(name)").eq("worker_id", id).eq("reviewer_side", "employer").order("created_at", { ascending: false }),
      getTaxonomy(),
    ]);
  if (!profile) notFound();

  const reviews: ReviewRow[] = (reviewRows ?? []).map((r) => ({ ...r, author: r.businesses?.name }));
  const taken = new Set([...(myApps ?? []).map((a) => a.job_id), ...(invites ?? []).map((i) => i.job_id)]);
  const invitable = (myJobs ?? []).filter((j) => !taken.has(j.id));

  return (
    <div className="space-y-6">
      <Link href="/e/candidates" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> {t("back")}
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <WorkerSummary name={person?.full_name ?? ""} profile={profile} taxonomy={taxonomy} reviews={reviews} />
          <section>
            <SectionTitle>{t("workHistory")}</SectionTitle>
            <Card><HistoryList rows={history ?? []} roles={taxonomy.roles} /></Card>
          </section>
          {reviews.length > 0 && (
            <section>
              <SectionTitle>{tr("fromEmployers")}</SectionTitle>
              <ReviewList reviews={reviews} authorFallback={tr("employer")} />
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {myApps?.length ? (
            <Card className="space-y-2">
              <p className="font-semibold">{t("appliedToYou")}</p>
              {myApps.map((a) => (
                <p key={a.id}><Link href={`/e/applications/${a.id}`} className="text-sm font-semibold text-orange-700 underline">{a.jobs.title}</Link></p>
              ))}
            </Card>
          ) : null}

          <div className="ticket p-5">
            <h2 className="font-display text-xl font-semibold">{ti("title")}</h2>
            <p className="mb-4 mt-1 text-sm text-stone-700">{ti("explainer")}</p>
            {invitable.length ? (
              <InviteForm workerId={id} jobs={invitable} />
            ) : (myJobs ?? []).length ? (
              <p className="text-sm font-semibold text-green-700">✓ {ti("allInvited")}</p>
            ) : (
              <LinkButton href="/e/jobs/new" variant="secondary">{ti("postFirst")}</LinkButton>
            )}
            {(invites ?? []).length > 0 && (
              <ul className="mt-4 space-y-1 border-t-2 border-dashed border-stone-200 pt-3 text-xs text-stone-600">
                {invites!.map((i) => <li key={i.job_id}>✓ {ti("invitedTo", { job: i.jobs?.title ?? "" })}</li>)}
              </ul>
            )}
          </div>
          <p className="text-xs text-stone-600">{t("contactAfterApply")}</p>
          <ReportForm targetType="worker" targetId={id} />
        </aside>
      </div>
    </div>
  );
}
