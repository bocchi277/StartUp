import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy, localName } from "@/lib/taxonomy";
import { confirmStillHiring, duplicateJob, setJobStatus } from "@/lib/actions/employer";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { daysAgo, experienceLabel, formatDate } from "@/lib/format";
import { ApplicationStatusBadge, JobStatusBadge, TermsBlock } from "@/components/display";
import { ActionButton } from "@/components/action-button";
import { Badge, Card, EmptyState, LinkButton, PageHeader, SectionTitle } from "@/components/ui";

export default async function EmployerJobPage({ params }: PageProps<"/[locale]/e/jobs/[id]">) {
  const { id } = await params;
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("employerJob");
  const te = await getTranslations("enums.application_status");
  const supabase = await createClient();

  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!job) notFound();

  const [{ data: applications }, taxonomy] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, created_at, worker_id, profiles(full_name, worker_profiles(city, primary_role_id, total_experience_months))")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false }),
    getTaxonomy(),
  ]);

  const roleById = new Map(taxonomy.roles.map((r) => [r.id, r]));
  const expired = new Date(job.expires_at) < new Date();
  const removed = job.status === "removed";
  const byStatus = APPLICATION_STATUSES.map((s) => ({
    status: s,
    items: (applications ?? []).filter((a) => a.status === s),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} expiresAt={job.expires_at} />
            {t("lastConfirmed", { days: daysAgo(job.last_confirmed_at) })}
            {job.status === "open" && !expired && ` · ${t("expiresOn", { date: formatDate(job.expires_at, locale) })}`}
          </span>
        }
        actions={
          removed ? null : (
            <>
              <LinkButton href={`/e/jobs/${job.id}/edit`} variant="secondary">{t("edit")}</LinkButton>
              {job.status === "open" && !expired && <LinkButton href={`/jobs/${job.id}`} variant="secondary">{t("viewPublic")}</LinkButton>}
            </>
          )
        }
      />

      {removed ? (
        <Card className="border-red-200 bg-red-50 text-sm text-red-800">{t("removedByAdmin")}</Card>
      ) : (
        <Card className="flex flex-wrap items-center gap-3">
          {(job.status === "open" || job.status === "paused") && (
            <ActionButton action={confirmStillHiring} fields={{ job_id: job.id }} variant="primary">{t("stillHiring")}</ActionButton>
          )}
          {job.status === "open" && (
            <ActionButton action={setJobStatus} fields={{ job_id: job.id, status: "paused" }}>{t("pause")}</ActionButton>
          )}
          {["paused", "closed", "filled", "draft"].includes(job.status) && (
            <ActionButton action={setJobStatus} fields={{ job_id: job.id, status: "open" }} variant="primary">
              {job.status === "draft" ? t("publish") : t("reopen")}
            </ActionButton>
          )}
          {job.status !== "closed" && job.status !== "draft" && (
            <ActionButton action={setJobStatus} fields={{ job_id: job.id, status: "closed" }} variant="danger" confirm={t("confirmClose")}>
              {t("close")}
            </ActionButton>
          )}
          <ActionButton action={duplicateJob} fields={{ job_id: job.id }} variant="ghost">{t("duplicate")}</ActionButton>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionTitle>{t("applicants", { count: applications?.length ?? 0 })}</SectionTitle>
          {!byStatus.length ? (
            <EmptyState title={t("noApplicants")}>{t("noApplicantsHint")}</EmptyState>
          ) : (
            <div className="space-y-5">
              {byStatus.map((group) => (
                <div key={group.status}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                    {te(group.status)} ({group.items.length})
                  </h3>
                  <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
                    {group.items.map((a) => {
                      const wp = a.profiles?.worker_profiles;
                      const exp = experienceLabel(wp?.total_experience_months ?? 0);
                      return (
                        <li key={a.id}>
                          <Link href={`/e/applications/${a.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-stone-50">
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900">{a.profiles?.full_name || t("unnamed")}</p>
                              <p className="text-sm text-stone-600">
                                {[localName(roleById.get(wp?.primary_role_id ?? -1), locale), wp?.city, t("experience", exp)]
                                  .filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <ApplicationStatusBadge status={a.status} />
                              <span className="text-xs text-stone-500">{formatDate(a.created_at, locale)}</span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-3">
          <TermsBlock job={job} />
          <Badge>{localName(roleById.get(job.role_id), locale)}</Badge>
        </aside>
      </div>
    </div>
  );
}
