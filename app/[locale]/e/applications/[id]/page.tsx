import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import { deleteNote } from "@/lib/actions/hiring";
import { NEXT_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime, formatRupees, todayIst } from "@/lib/format";
import { ApplicationStatusBadge, HistoryList } from "@/components/display";
import { WorkerSummary } from "@/components/worker-summary";
import { ActionButton } from "@/components/action-button";
import { HireForm, InterviewForm, NoteForm, StatusButtons } from "@/components/forms/pipeline-forms";
import { ReportForm } from "@/components/report-form";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { ReviewList } from "@/components/reviews";
import { PipelineTracker } from "@/components/pipeline-tracker";
import type { ReviewRow } from "@/lib/reviews";

// datetime-local value in IST for an ISO timestamp.
function toIstLocal(iso: string | null) {
  if (!iso) return undefined;
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export default async function ApplicantPage({ params }: PageProps<"/[locale]/e/applications/[id]">) {
  const { id } = await params;
  await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("applicant");
  const te = await getTranslations("enums");
  const supabase = await createClient();

  // RLS returns nothing unless this application belongs to one of my jobs.
  const { data: app } = await supabase
    .from("applications")
    .select("*, jobs(id, title, salary_min, salary_max, pay_frequency, business_id), profiles(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!app || !app.jobs) notFound();

  const [{ data: profile }, { data: contacts }, { data: history }, { data: notes }, { data: placement }, { data: reviewRows }, taxonomy] =
    await Promise.all([
      supabase.from("worker_profiles").select("*").eq("user_id", app.worker_id).maybeSingle(),
      supabase.from("worker_contacts").select("*").eq("user_id", app.worker_id).maybeSingle(),
      supabase.from("employment_history").select("*").eq("worker_id", app.worker_id).order("start_date", { ascending: false }),
      supabase.from("application_notes").select("*").eq("application_id", app.id).order("created_at", { ascending: false }),
      supabase.from("placements").select("*").eq("application_id", app.id).maybeSingle(),
      supabase.from("reviews").select("*, businesses(name)").eq("worker_id", app.worker_id).eq("reviewer_side", "employer").order("created_at", { ascending: false }),
      getTaxonomy(),
    ]);

  const next = NEXT_STATUSES[app.status];
  const canHire = ["shortlisted", "interview", "offered"].includes(app.status);
  const name = app.profiles?.full_name ?? "";
  const reviews: ReviewRow[] = (reviewRows ?? []).map((r) => ({ ...r, author: r.businesses?.name }));
  const tr = await getTranslations("reviews");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/e/jobs/${app.jobs.id}`} className="text-sm text-orange-700 hover:underline">← {app.jobs.title}</Link>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <PipelineTracker status={app.status} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {profile ? (
            <WorkerSummary name={name} profile={profile} taxonomy={taxonomy} reviews={reviews} />
          ) : (
            <Card>{t("noProfile")}</Card>
          )}

          {app.cover_note && (
            <Card>
              <p className="mb-1 text-xs text-stone-500">{t("coverNote")}</p>
              <p className="whitespace-pre-line text-sm">{app.cover_note}</p>
            </Card>
          )}

          <section>
            <SectionTitle>{t("workHistory")}</SectionTitle>
            <Card>
              <HistoryList rows={history ?? []} roles={taxonomy.roles} />
            </Card>
          </section>
          {reviews.length > 0 && (
            <section>
              <SectionTitle>{tr("fromEmployers")}</SectionTitle>
              <ReviewList reviews={reviews} authorFallback={tr("employer")} />
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Card className={contacts ? "space-y-2 border-2 border-ink bg-haldi" : "space-y-2"}>
            <h2 className="font-display text-lg font-semibold">{t("contact")}</h2>
            {contacts ? (
              <div className="space-y-1 text-sm">
                {contacts.phone && (
                  <p>
                    <a href={`tel:${contacts.phone}`} className="font-mono text-base font-bold text-ink underline">{contacts.phone}</a>
                    {contacts.whatsapp_opt_in && (
                      <a href={`https://wa.me/${contacts.phone.replace(/^\+/, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noopener noreferrer" className="ml-3 font-semibold text-green-800 underline">
                        WhatsApp
                      </a>
                    )}
                  </p>
                )}
                {contacts.email && <p><a href={`mailto:${contacts.email}`} className="underline">{contacts.email}</a></p>}
              </div>
            ) : (
              <p className="text-sm text-stone-600">{t("contactHidden")}</p>
            )}
          </Card>

          {placement ? (
            <Card className="space-y-1 border-green-200 bg-green-50 text-sm">
              <h2 className="font-semibold text-green-900">{t("placement")}</h2>
              <p>{formatRupees(placement.agreed_salary, locale)} {te(`payPer.${placement.agreed_pay_frequency}`)} · {formatDate(placement.start_date, locale)}</p>
              <Badge tone={placement.status === "active" ? "green" : "neutral"}>{te(`placement_status.${placement.status}`)}</Badge>
              {placement.status === "pending" && <p className="text-xs text-stone-600">{t("waitingForWorker")}</p>}
              <p><Link href="/e/team" className="text-orange-700 underline">{t("goToTeam")}</Link></p>
            </Card>
          ) : (
            <>
              {app.status === "interview" && app.interview_at && (
                <Card className="bg-yellow-50 text-sm">
                  <p className="font-medium">{t("interviewScheduled", { time: formatDateTime(app.interview_at, locale) })}</p>
                  {app.interview_note && <p className="mt-1">{app.interview_note}</p>}
                </Card>
              )}
              {next.length > 0 && (
                <Card className="space-y-4">
                  <h2 className="font-display text-lg font-semibold">{t("nextStep")}</h2>
                  <StatusButtons applicationId={app.id} next={next} />
                  {next.includes("interview") && (
                    <details open={app.status === "shortlisted"}>
                      <summary className="cursor-pointer text-sm font-medium text-orange-700">{t("scheduleInterview")}</summary>
                      <div className="mt-3">
                        <InterviewForm applicationId={app.id} defaultAt={toIstLocal(app.interview_at)} defaultNote={app.interview_note} />
                      </div>
                    </details>
                  )}
                </Card>
              )}
              {canHire && (
                <Card className="space-y-3">
                  <h2 className="font-display text-lg font-semibold">{t("hire")}</h2>
                  <HireForm applicationId={app.id} defaultSalary={app.jobs.salary_min} defaultFrequency={app.jobs.pay_frequency} today={todayIst()} />
                </Card>
              )}
              {app.status === "withdrawn" && <Card className="text-sm text-stone-600">{t("withdrawn")}</Card>}
            </>
          )}

          <Card className="space-y-3">
            <div>
              <h2 className="font-display text-lg font-semibold">{t("notes")}</h2>
              <p className="text-xs text-stone-500">{t("notesPrivate")}</p>
            </div>
            <NoteForm applicationId={app.id} />
            <ul className="space-y-2">
              {(notes ?? []).map((n) => (
                <li key={n.id} className="rounded-lg bg-stone-50 p-2 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
                    <span>{formatDateTime(n.created_at, locale)}</span>
                    <ActionButton action={deleteNote} fields={{ note_id: n.id }} variant="ghost" confirm={t("confirmDeleteNote")}>
                      {t("delete")}
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <ReportForm targetType="worker" targetId={app.worker_id} />
        </aside>
      </div>
    </div>
  );
}
