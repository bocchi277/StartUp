import { getLocale, getTranslations } from "next-intl/server";
import { CalendarClock, ClipboardList } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireWorker } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { confirmJoining, withdrawApplication } from "@/lib/actions/hiring";
import { formatDate, formatDateTime, formatRupees } from "@/lib/format";
import { canReviewPlacement } from "@/lib/reviews";
import { ApplicationStatusBadge } from "@/components/display";
import { PipelineTracker } from "@/components/pipeline-tracker";
import { ActionButton } from "@/components/action-button";
import { EndPlacementForm } from "@/components/forms/end-placement-form";
import { ReviewForm } from "@/components/forms/review-forms";
import { Badge, Card, EmptyState, LinkButton, PageHeader, SectionTitle, Stamp } from "@/components/ui";

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
  const tr = await getTranslations("reviews");
  const supabase = await createClient();

  const [{ data: applications }, { data: placements }, { data: myReviews }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, created_at, updated_at, interview_at, interview_note, jobs(id, title, city, businesses(name))")
      .eq("worker_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("placements")
      .select("id, status, agreed_salary, agreed_pay_frequency, start_date, end_date, worker_confirmed_at, businesses(id, name), jobs(title)")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("placement_id").eq("reviewer_id", user.id),
  ]);

  const reviewed = new Set((myReviews ?? []).map((r) => r.placement_id));
  const pending = (placements ?? []).filter((p) => p.status === "pending");
  const others = (placements ?? []).filter((p) => p.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />

      {pending.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{t("confirmJoiningTitle")}</SectionTitle>
          {pending.map((p) => (
            <div key={p.id} className="ticket overflow-hidden">
              <div className="bg-green-600 px-5 py-3 text-cream">
                <p className="font-mono text-[11px] uppercase tracking-widest text-green-100">{t("hiredEyebrow")}</p>
                <p className="font-display text-xl font-semibold">{p.jobs?.title} · {p.businesses?.name}</p>
              </div>
              <div className="ticket-tear" aria-hidden />
              <div className="space-y-3 p-5">
                <p className="text-sm font-semibold">
                  {t("agreedTerms", {
                    salary: `${formatRupees(p.agreed_salary, locale)} ${te(`payPer.${p.agreed_pay_frequency}`)}`,
                    date: formatDate(p.start_date, locale),
                  })}
                </p>
                <p className="text-xs text-stone-600">{t("confirmExplainer")}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <ActionButton action={confirmJoining} fields={{ placement_id: p.id }} variant="primary">{t("iJoined")}</ActionButton>
                  <EndPlacementForm placementId={p.id} active={false} minDate={p.start_date} />
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle>{t("applicationsTitle")}</SectionTitle>
        {!applications?.length ? (
          <EmptyState icon={<ClipboardList className="size-5" />} title={t("empty")}>
            <LinkButton href="/jobs" className="mt-3">{t("findJobs")}</LinkButton>
          </EmptyState>
        ) : (
          applications.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {a.jobs ? (
                    <Link href={`/jobs/${a.jobs.id}`} className="font-display text-lg font-semibold text-ink hover:underline">{a.jobs.title}</Link>
                  ) : (
                    <span className="font-semibold">{t("jobRemoved")}</span>
                  )}
                  <p className="text-sm text-stone-700">{a.jobs?.businesses?.name} · {a.jobs?.city}</p>
                  <p className="font-mono text-[11px] text-stone-500">{t("appliedOn", { date: formatDate(a.created_at, locale) })}</p>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </div>
              <PipelineTracker status={a.status} />
              {a.status === "interview" && a.interview_at && (
                <div className="mt-4 flex gap-3 rounded-xl border-2 border-ink bg-yellow-100 p-3 text-sm">
                  <CalendarClock className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">{t("interviewAt", { time: formatDateTime(a.interview_at, locale) })}</p>
                    {a.interview_note && <p className="mt-1">{a.interview_note}</p>}
                  </div>
                </div>
              )}
              {WITHDRAWABLE.has(a.status) && (
                <ActionButton action={withdrawApplication} fields={{ application_id: a.id }} variant="ghost" confirm={t("confirmWithdraw")} className="mt-2">
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
                  <p className="font-semibold">{p.jobs?.title} · {p.businesses?.name}</p>
                  <p className="font-mono text-xs text-stone-600">
                    {formatDate(p.start_date, locale)} → {p.end_date ? formatDate(p.end_date, locale) : t("present")}
                  </p>
                </div>
                {p.status === "active" ? <Stamp tone="green">{te(`placement_status.${p.status}`)}</Stamp> : <Badge>{te(`placement_status.${p.status}`)}</Badge>}
              </div>
              {p.status === "active" && <div className="mt-2"><EndPlacementForm placementId={p.id} active minDate={p.start_date} /></div>}
              {reviewed.has(p.id) ? (
                <p className="mt-3 text-sm font-semibold text-green-700">✓ {tr("youReviewed")}</p>
              ) : canReviewPlacement(p) ? (
                <div className="mt-3"><ReviewForm placementId={p.id} side="worker" /></div>
              ) : p.status === "active" ? (
                <p className="mt-3 text-xs text-stone-600">{tr("availableAfter30")}</p>
              ) : null}
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
