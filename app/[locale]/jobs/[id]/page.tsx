import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getTaxonomy, localName, namesFor } from "@/lib/taxonomy";
import { siteUrl } from "@/lib/env";
import { daysAgo, formatSalaryRange } from "@/lib/format";
import {
  ApplicationStatusBadge, JobStatusBadge, TermsBlock, VerificationBadge, WhatsAppShare,
} from "@/components/display";
import { ApplyForm } from "@/components/forms/apply-form";
import { ReportForm } from "@/components/report-form";
import { Badge, Card, LinkButton } from "@/components/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadJob(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, businesses(id, name, category, city, state, address, description, verification_level), job_roles(name_en, name_hi)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/jobs/[id]">) {
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) return {};
  return { title: `${job.title} · ${job.businesses?.name ?? ""}`, description: `${job.city}, ${job.state}` };
}

export default async function JobDetailPage({ params }: PageProps<"/[locale]/jobs/[id]">) {
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) notFound();

  const [locale, t, te, user, taxonomy] = await Promise.all([
    getLocale(), getTranslations("jobs"), getTranslations("enums"), getCurrentUser(), getTaxonomy(),
  ]);
  const supabase = await createClient();
  const isOpen = job.status === "open" && new Date(job.expires_at) > new Date();
  const isWorker = user?.profile.role === "worker";

  let application: { id: string; status: Parameters<typeof ApplicationStatusBadge>[0]["status"] } | null = null;
  let hasProfile = false;
  if (isWorker && user) {
    const [{ data: app }, { data: profile }] = await Promise.all([
      supabase.from("applications").select("id, status").eq("job_id", job.id).eq("worker_id", user.id).maybeSingle(),
      supabase.from("worker_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]);
    application = app;
    hasProfile = Boolean(profile);
  }

  const origin = (await headers()).get("host");
  const shareUrl = `${siteUrl(origin ? `https://${origin}` : undefined)}/${locale}/jobs/${job.id}`;
  const shareText = `${job.title} – ${job.businesses?.name}, ${job.city}. ${formatSalaryRange(job.salary_min, job.salary_max, locale)} ${te(`payPer.${job.pay_frequency}`)}`;
  const cuisines = namesFor(job.cuisine_ids, taxonomy.cuisines, locale);
  const skills = namesFor(job.skill_ids, taxonomy.skills, locale);
  const days = daysAgo(job.last_confirmed_at);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">{job.title}</h1>
            {!isOpen && <JobStatusBadge status={job.status} expiresAt={job.expires_at} />}
          </div>
          <p className="mt-1 text-stone-600">
            {job.businesses?.name} · {job.city}, {job.state}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{localName(job.job_roles, locale)}</Badge>
            {job.businesses && <VerificationBadge level={job.businesses.verification_level} />}
            <Badge>{days === 0 ? t("activeToday") : t("activeDaysAgo", { days })}</Badge>
          </div>
        </div>

        <TermsBlock job={job} />

        {(cuisines.length > 0 || skills.length > 0) && (
          <Card className="space-y-3">
            {cuisines.length > 0 && (
              <div>
                <h2 className="mb-1 text-sm font-semibold">{t("cuisines")}</h2>
                <div className="flex flex-wrap gap-1.5">{cuisines.map((c) => <Badge key={c}>{c}</Badge>)}</div>
              </div>
            )}
            {skills.length > 0 && (
              <div>
                <h2 className="mb-1 text-sm font-semibold">{t("skills")}</h2>
                <div className="flex flex-wrap gap-1.5">{skills.map((s) => <Badge key={s}>{s}</Badge>)}</div>
              </div>
            )}
          </Card>
        )}

        {job.description && (
          <Card>
            <h2 className="mb-2 text-sm font-semibold">{t("aboutJob")}</h2>
            <p className="whitespace-pre-line text-sm text-stone-700">{job.description}</p>
          </Card>
        )}

        {job.businesses && (
          <Card>
            <h2 className="mb-1 text-sm font-semibold">{t("aboutEmployer")}</h2>
            <p className="font-medium">{job.businesses.name}</p>
            <p className="text-sm text-stone-600">
              {te(`business_category.${job.businesses.category}`)} · {job.businesses.address}, {job.businesses.city}
            </p>
            {job.businesses.description && (
              <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{job.businesses.description}</p>
            )}
          </Card>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="space-y-3 lg:sticky lg:top-28">
          {application ? (
            <div className="space-y-2">
              <p className="text-sm text-stone-700">{t("youApplied")}</p>
              <ApplicationStatusBadge status={application.status} />
              <LinkButton href="/w/applications" variant="secondary" className="w-full">{t("viewApplications")}</LinkButton>
            </div>
          ) : !isOpen ? (
            <p className="text-sm text-stone-600">{t("notAccepting")}</p>
          ) : !user ? (
            <LinkButton href={`/login?next=${encodeURIComponent(`/${locale}/jobs/${job.id}`)}`} className="w-full">
              {t("loginToApply")}
            </LinkButton>
          ) : isWorker && !hasProfile ? (
            <LinkButton href="/onboarding" className="w-full">{t("completeProfileToApply")}</LinkButton>
          ) : isWorker ? (
            <ApplyForm jobId={job.id} />
          ) : (
            <p className="text-sm text-stone-600">{t("employersCannotApply")}</p>
          )}
          {isOpen && <WhatsAppShare text={shareText} url={shareUrl} />}
        </Card>
        {user && <ReportForm targetType="job" targetId={job.id} />}
      </aside>
    </div>
  );
}
