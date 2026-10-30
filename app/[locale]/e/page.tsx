import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, PlusCircle, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { daysAgo, formatDateTime, formatSalaryRange } from "@/lib/format";
import { photoUrl } from "@/lib/storage";
import { Freshness, JobStatusBadge, VerificationBadge } from "@/components/display";
import { Avatar, EmptyState, LinkButton, PageHeader, SectionTitle, StatTile } from "@/components/ui";

export default async function EmployerDashboard() {
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("employerHome");
  const tj = await getTranslations("jobs");
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: jobs }, { data: apps }, { count: hiresThisMonth }, { count: activeTeam }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, city, salary_min, salary_max, expires_at, created_at, last_confirmed_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("applications")
      .select("id, status, job_id, created_at, profiles(full_name, worker_profiles(photo_url)), jobs!inner(business_id, title)")
      .eq("jobs.business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase.from("placements").select("id", { count: "exact", head: true }).eq("business_id", business.id).gte("created_at", monthStart.toISOString()),
    supabase.from("placements").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "active"),
  ]);

  const countsByJob = new Map<string, { total: number; fresh: number }>();
  for (const a of apps ?? []) {
    const c = countsByJob.get(a.job_id) ?? { total: 0, fresh: 0 };
    c.total += 1;
    if (a.status === "applied") c.fresh += 1;
    countsByJob.set(a.job_id, c);
  }
  const now = new Date();
  const openJobs = (jobs ?? []).filter((j) => j.status === "open" && new Date(j.expires_at) > now).length;
  const fresh = (apps ?? []).filter((a) => a.status === "applied");
  const stale = (jobs ?? []).filter((j) => j.status === "open" && daysAgo(j.last_confirmed_at) >= 14);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <span className="flex items-center gap-3">
            <Avatar src={photoUrl("business-photos", business.photo_url)} name={business.name} size={52} className="rounded-2xl" />
            {business.name}
          </span>
        }
        subtitle={<span className="inline-flex flex-wrap items-center gap-2">{business.city} · <VerificationBadge level={business.verification_level} /></span>}
        actions={<LinkButton href="/e/jobs/new"><PlusCircle className="size-4" aria-hidden /> {t("postJob")}</LinkButton>}
      />

      {business.verification_level !== "business_verified" && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <BadgeCheck className="mt-0.5 size-5 shrink-0" aria-hidden /> {t("verificationHint")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile value={openJobs} label={t("openJobs")} />
        <StatTile value={fresh.length} label={t("newApplicants")} tone="haldi" />
        <StatTile value={hiresThisMonth ?? 0} label={t("hiresThisMonth")} />
        <Link href="/e/team"><StatTile value={activeTeam ?? 0} label={t("activeTeam")} tone="ink" /></Link>
      </div>

      {stale.length > 0 && (
        <div className="rounded-2xl border-2 border-ink bg-yellow-100 p-4 text-sm">
          <p className="font-semibold">{t("staleTitle", { count: stale.length })}</p>
          <p className="mt-1 text-stone-700">{t("staleHint")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stale.map((j) => <Link key={j.id} href={`/e/jobs/${j.id}`} className="chip bg-cream">{j.title}</Link>)}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <SectionTitle>{t("yourJobs")}</SectionTitle>
          {!jobs?.length ? (
            <EmptyState icon={<PlusCircle className="size-5" />} title={t("noJobs")}>
              <LinkButton href="/e/jobs/new" className="mt-3">{t("postFirstJob")}</LinkButton>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => {
                const c = countsByJob.get(job.id) ?? { total: 0, fresh: 0 };
                const days = daysAgo(job.last_confirmed_at);
                return (
                  <li key={job.id}>
                    <Link href={`/e/jobs/${job.id}`} className="ticket ticket-hover flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold">{job.title}</p>
                        <p className="font-mono text-xs text-stone-600">
                          {formatSalaryRange(job.salary_min, job.salary_max, locale)} · {job.city}
                        </p>
                        {job.status === "open" && (
                          <p className="mt-1 font-mono text-[11px] text-stone-500">
                            <Freshness days={days} label={days === 0 ? tj("activeToday") : tj("activeDaysAgo", { days })} />
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-display text-2xl font-bold leading-none">{c.total}</p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{t("applicantsLabel")}</p>
                          {c.fresh > 0 && <p className="text-xs font-semibold text-orange-700">{t("newCount", { count: c.fresh })}</p>}
                        </div>
                        <JobStatusBadge status={job.status} expiresAt={job.expires_at} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <SectionTitle>{t("latestApplicants")}</SectionTitle>
          {!fresh.length ? (
            <EmptyState icon={<UserPlus className="size-5" />} title={t("noNewApplicants")} />
          ) : (
            <ul className="divide-y-2 divide-dashed divide-stone-200 overflow-hidden rounded-2xl border-2 border-ink bg-cream">
              {fresh.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link href={`/e/applications/${a.id}`} className="flex items-center gap-3 p-3 hover:bg-yellow-50">
                    <Avatar src={photoUrl("avatars", a.profiles?.worker_profiles?.photo_url)} name={a.profiles?.full_name || "?"} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.profiles?.full_name}</p>
                      <p className="truncate text-xs text-stone-600">{a.jobs.title} · {formatDateTime(a.created_at, locale)}</p>
                    </div>
                    <ArrowRight className="size-4 text-stone-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
