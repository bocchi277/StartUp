import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Pencil, Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy, localName } from "@/lib/taxonomy";
import { confirmStillHiring, duplicateJob, setJobStatus } from "@/lib/actions/employer";
import { daysAgo, experienceLabel, formatDate } from "@/lib/format";
import { photoUrl } from "@/lib/storage";
import { JobStatusBadge, TermsBlock } from "@/components/display";
import { ActionButton } from "@/components/action-button";
import { Avatar, EmptyState, LinkButton, PageHeader, SectionTitle, cn } from "@/components/ui";

const BOARD = ["applied", "shortlisted", "interview", "offered", "hired"] as const;
const COLUMN_TONE: Record<(typeof BOARD)[number], string> = {
  applied: "bg-blue-100",
  shortlisted: "bg-orange-100",
  interview: "bg-yellow-100",
  offered: "bg-kokum-soft",
  hired: "bg-green-100",
};

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
      .select("id, status, created_at, worker_id, profiles(full_name, worker_profiles(city, primary_role_id, total_experience_months, photo_url))")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false }),
    getTaxonomy(),
  ]);

  const roleById = new Map(taxonomy.roles.map((r) => [r.id, r]));
  const expired = new Date(job.expires_at) < new Date();
  const removed = job.status === "removed";
  const all = applications ?? [];
  const closed = all.filter((a) => a.status === "rejected" || a.status === "withdrawn");

  type App = (typeof all)[number];
  const renderCard = (a: App) => {
    const wp = a.profiles?.worker_profiles;
    const exp = experienceLabel(wp?.total_experience_months ?? 0);
    return (
      <Link key={a.id} href={`/e/applications/${a.id}`} className="block rounded-xl border-2 border-ink bg-cream p-3 shadow-hard transition-transform hover:-translate-y-0.5">
        <div className="flex items-center gap-2.5">
          <Avatar src={photoUrl("avatars", wp?.photo_url)} name={a.profiles?.full_name || "?"} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{a.profiles?.full_name || t("unnamed")}</p>
            <p className="truncate text-xs text-stone-600">{localName(roleById.get(wp?.primary_role_id ?? -1), locale)}</p>
          </div>
        </div>
        <p className="mt-2 font-mono text-[11px] text-stone-600">
          {[wp?.city, t("experience", exp).trim()].filter(Boolean).join(" · ")}
        </p>
        <p className="font-mono text-[10px] text-stone-500">{formatDate(a.created_at, locale)}</p>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={localName(roleById.get(job.role_id), locale)}
        title={job.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2 font-mono text-xs">
            <JobStatusBadge status={job.status} expiresAt={job.expires_at} />
            {t("lastConfirmed", { days: daysAgo(job.last_confirmed_at) })}
            {job.status === "open" && !expired && ` · ${t("expiresOn", { date: formatDate(job.expires_at, locale) })}`}
          </span>
        }
        actions={
          removed ? null : (
            <>
              <LinkButton href={`/e/jobs/${job.id}/edit`} variant="secondary"><Pencil className="size-4" aria-hidden /> {t("edit")}</LinkButton>
              {job.status === "open" && !expired && (
                <LinkButton href={`/jobs/${job.id}`} variant="secondary"><Eye className="size-4" aria-hidden /> {t("viewPublic")}</LinkButton>
              )}
            </>
          )
        }
      />

      {removed ? (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{t("removedByAdmin")}</div>
      ) : (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border-2 border-dashed border-stone-300 p-3">
          {(job.status === "open" || job.status === "paused") && (
            <ActionButton action={confirmStillHiring} fields={{ job_id: job.id }} variant="haldi">{t("stillHiring")}</ActionButton>
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
        </div>
      )}

      <section>
        <SectionTitle>{t("applicants", { count: all.length })}</SectionTitle>
        {!all.length ? (
          <EmptyState title={t("noApplicants")}>{t("noApplicantsHint")}</EmptyState>
        ) : (
          <>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
              {BOARD.map((status) => {
                const items = all.filter((a) => a.status === status);
                return (
                  <div key={status} className="w-64 shrink-0 snap-start rounded-2xl border-2 border-ink bg-paper lg:w-auto">
                    <div className={cn("flex items-center justify-between rounded-t-[14px] border-b-2 border-ink px-3 py-2", COLUMN_TONE[status])}>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-widest">{te(status)}</p>
                      <span className="rounded-full bg-ink px-2 font-mono text-[11px] font-bold text-cream">{items.length}</span>
                    </div>
                    <div className="min-h-24 space-y-2.5 p-2.5">
                      {items.map(renderCard)}
                    </div>
                  </div>
                );
              })}
            </div>
            {closed.length > 0 && (
              <details className="mt-4 rounded-2xl border-2 border-dashed border-stone-300 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-stone-700">{t("closedApplicants", { count: closed.length })}</summary>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {closed.map((a) => (
                    <div key={a.id}>
                      {renderCard(a)}
                      <p className="mt-1 text-center font-mono text-[10px] uppercase text-stone-500">{te(a.status)}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>

      <section className="max-w-xl">
        <TermsBlock job={job} compact />
      </section>
    </div>
  );
}
