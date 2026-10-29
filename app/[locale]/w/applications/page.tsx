import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireWorker } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { confirmJoining, withdrawApplication } from "@/lib/actions/hiring";
import { formatDate, formatDateTime, formatRupees } from "@/lib/format";
import { ApplicationStatusBadge } from "@/components/display";
import { ActionButton } from "@/components/action-button";
import { EndPlacementForm } from "@/components/forms/end-placement-form";
import { Badge, Card, EmptyState, LinkButton, PageHeader, SectionTitle } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("myApplications") };
}

const WITHDRAWABLE = new Set(["applied", "shortlisted", "interview", "offered"]);

export default async function WorkerApplicationsPage() {
  const user = await requireWorker();
  const locale = await getLocale();
  const t = await getTranslations("workerApplications");
  const te = await getTranslations("enums");
  const supabase = await createClient();

  const [{ data: applications }, { data: placements }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, created_at, updated_at, interview_at, interview_note, jobs(id, title, city, businesses(name))")
      .eq("worker_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("placements")
      .select("id, status, agreed_salary, agreed_pay_frequency, start_date, end_date, businesses(name), jobs(title)")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const pending = (placements ?? []).filter((p) => p.status === "pending");
  const others = (placements ?? []).filter((p) => p.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={t("title")} />

      {pending.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{t("confirmJoiningTitle")}</SectionTitle>
          {pending.map((p) => (
            <Card key={p.id} className="border-green-300 bg-green-50">
              <p className="font-medium">{p.jobs?.title} · {p.businesses?.name}</p>
              <p className="text-sm text-stone-700">
                {t("agreedTerms", {
                  salary: `${formatRupees(p.agreed_salary, locale)} ${te(`payPer.${p.agreed_pay_frequency}`)}`,
                  date: formatDate(p.start_date, locale),
                })}
              </p>
              <p className="mt-1 text-xs text-stone-600">{t("confirmExplainer")}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <ActionButton action={confirmJoining} fields={{ placement_id: p.id }} variant="primary">
                  {t("iJoined")}
                </ActionButton>
                <EndPlacementForm placementId={p.id} active={false} minDate={p.start_date} />
              </div>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle>{t("applicationsTitle")}</SectionTitle>
        {!applications?.length ? (
          <EmptyState title={t("empty")}>
            <LinkButton href="/jobs" className="mt-3">{t("findJobs")}</LinkButton>
          </EmptyState>
        ) : (
          applications.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {a.jobs ? (
                    <Link href={`/jobs/${a.jobs.id}`} className="font-medium text-stone-900 hover:underline">{a.jobs.title}</Link>
                  ) : (
                    <span className="font-medium">{t("jobRemoved")}</span>
                  )}
                  <p className="text-sm text-stone-600">{a.jobs?.businesses?.name} · {a.jobs?.city}</p>
                  <p className="text-xs text-stone-500">{t("appliedOn", { date: formatDate(a.created_at, locale) })}</p>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </div>
              {a.status === "interview" && a.interview_at && (
                <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm">
                  <p className="font-medium text-yellow-900">{t("interviewAt", { time: formatDateTime(a.interview_at, locale) })}</p>
                  {a.interview_note && <p className="mt-1 text-yellow-900">{a.interview_note}</p>}
                </div>
              )}
              {WITHDRAWABLE.has(a.status) && (
                <ActionButton action={withdrawApplication} fields={{ application_id: a.id }} variant="ghost" confirm={t("confirmWithdraw")} className="mt-3">
                  {t("withdraw")}
                </ActionButton>
              )}
            </Card>
          ))
        )}
      </section>

      {others.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{t("jobsTitle")}</SectionTitle>
          {others.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.jobs?.title} · {p.businesses?.name}</p>
                  <p className="text-sm text-stone-600">
                    {formatDate(p.start_date, locale)} – {p.end_date ? formatDate(p.end_date, locale) : t("present")}
                  </p>
                </div>
                <Badge tone={p.status === "active" ? "green" : "neutral"}>{te(`placement_status.${p.status}`)}</Badge>
              </div>
              {p.status === "active" && <EndPlacementForm placementId={p.id} active minDate={p.start_date} />}
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
