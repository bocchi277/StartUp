import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSalaryRange } from "@/lib/format";
import { JobStatusBadge, VerificationBadge } from "@/components/display";
import { Card, EmptyState, LinkButton, PageHeader, SectionTitle } from "@/components/ui";

export default async function EmployerDashboard() {
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("employerHome");
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: jobs }, { data: apps }, { count: hiresThisMonth }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, city, salary_min, salary_max, expires_at, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("applications")
      .select("id, status, job_id, jobs!inner(business_id)")
      .eq("jobs.business_id", business.id),
    supabase
      .from("placements")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", monthStart.toISOString()),
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
  const newApplicants = (apps ?? []).filter((a) => a.status === "applied").length;

  const stats = [
    { label: t("openJobs"), value: openJobs },
    { label: t("newApplicants"), value: newApplicants },
    { label: t("hiresThisMonth"), value: hiresThisMonth ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={business.name}
        subtitle={<span className="inline-flex items-center gap-2">{business.city} · <VerificationBadge level={business.verification_level} /></span>}
        actions={<LinkButton href="/e/jobs/new">{t("postJob")}</LinkButton>}
      />

      {business.verification_level !== "business_verified" && (
        <Card className="border-blue-200 bg-blue-50 text-sm text-blue-900">{t("verificationHint")}</Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-600">{s.label}</p>
          </Card>
        ))}
      </div>

      <section>
        <SectionTitle>{t("yourJobs")}</SectionTitle>
        {!jobs?.length ? (
          <EmptyState title={t("noJobs")}>
            <LinkButton href="/e/jobs/new" className="mt-3">{t("postFirstJob")}</LinkButton>
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <ul className="divide-y divide-stone-200">
              {jobs.map((job) => {
                const c = countsByJob.get(job.id) ?? { total: 0, fresh: 0 };
                return (
                  <li key={job.id}>
                    <Link href={`/e/jobs/${job.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-stone-50">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900">{job.title}</p>
                        <p className="text-sm text-stone-600">{formatSalaryRange(job.salary_min, job.salary_max, locale)} · {job.city}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-stone-600">
                          {t("applicantsCount", { count: c.total })}
                          {c.fresh > 0 && <span className="ml-1 font-semibold text-orange-700">({t("newCount", { count: c.fresh })})</span>}
                        </span>
                        <JobStatusBadge status={job.status} expiresAt={job.expires_at} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
