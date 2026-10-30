import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, MapPin, Store } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getTaxonomy, localName, namesFor } from "@/lib/taxonomy";
import { siteUrl } from "@/lib/env";
import { daysAgo, formatSalaryRange } from "@/lib/format";
import { photoUrl } from "@/lib/storage";
import { summarize } from "@/lib/reviews";
import {
  ApplicationStatusBadge, Freshness, JobStatusBadge, TermsBlock, VerificationBadge, WhatsAppShare,
} from "@/components/display";
import { ApplyForm } from "@/components/forms/apply-form";
import { ReportForm } from "@/components/report-form";
import { SaveJobButton } from "@/components/save-job-button";
import { RoleIcon } from "@/components/role-icon";
import { Avatar, Badge, Card, Eyebrow, LinkButton, Stars } from "@/components/ui";
import type { Enums } from "@/types/database";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadJob(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, businesses(id, name, category, city, state, address, description, verification_level, photo_url), job_roles(slug, name_en, name_hi)")
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
  const tr = await getTranslations("reviews");
  const supabase = await createClient();
  const isOpen = job.status === "open" && new Date(job.expires_at) > new Date();
  const isWorker = user?.profile.role === "worker";

  const { data: reviewRows } = job.businesses
    ? await supabase.from("business_reviews_public").select("rating, would_return, terms_matched, paid_on_time").eq("business_id", job.businesses.id)
    : { data: [] };
  const summary = summarize((reviewRows ?? []).map((r, i) => ({
    id: String(i), rating: r.rating ?? 0, would_return: Boolean(r.would_return), terms_matched: r.terms_matched,
    paid_on_time: r.paid_on_time, comment: null, response: null, response_at: null, created_at: "",
  })));

  let application: { id: string; status: Enums<"application_status"> } | null = null;
  let hasProfile = false;
  let saved = false;
  let invite: { message: string | null } | null = null;
  if (isWorker && user) {
    const [{ data: app }, { data: profile }, { data: savedRow }, { data: inviteRow }] = await Promise.all([
      supabase.from("applications").select("id, status").eq("job_id", job.id).eq("worker_id", user.id).maybeSingle(),
      supabase.from("worker_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("saved_jobs").select("job_id").eq("job_id", job.id).eq("worker_id", user.id).maybeSingle(),
      supabase.from("job_invites").select("message").eq("job_id", job.id).eq("worker_id", user.id).maybeSingle(),
    ]);
    application = app;
    hasProfile = Boolean(profile);
    saved = Boolean(savedRow);
    invite = inviteRow;
  }

  const host = (await headers()).get("host");
  const shareUrl = `${siteUrl(host ? `https://${host}` : undefined)}/${locale}/jobs/${job.id}`;
  const salary = `${formatSalaryRange(job.salary_min, job.salary_max, locale)} ${te(`payPer.${job.pay_frequency}`)}`;
  const shareText = `${job.title} – ${job.businesses?.name}, ${job.city}. ${salary}`;
  const cuisines = namesFor(job.cuisine_ids, taxonomy.cuisines, locale);
  const skills = namesFor(job.skill_ids, taxonomy.skills, locale);
  const days = daysAgo(job.last_confirmed_at);
  const biz = job.businesses;

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------ header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          {biz && <Avatar src={photoUrl("business-photos", biz.photo_url)} name={biz.name} size={64} className="rounded-2xl" />}
          <div className="min-w-0">
            <Eyebrow className="flex items-center gap-1.5 text-orange-700">
              <RoleIcon slug={job.job_roles?.slug} className="size-3.5" /> {localName(job.job_roles, locale)}
            </Eyebrow>
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-5xl">{job.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-700">
              {biz && (
                <Link href={`/b/${biz.id}`} className="inline-flex items-center gap-1 font-semibold underline decoration-stone-300 decoration-2 underline-offset-4 hover:decoration-orange-600">
                  <Store className="size-4" aria-hidden /> {biz.name}
                </Link>
              )}
              <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{job.city}, {job.state}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {biz && <VerificationBadge level={biz.verification_level} />}
              {summary.count > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <Stars value={summary.average} size={14} />
                  <span className="font-mono text-xs text-stone-600">{summary.average.toFixed(1)} · {tr("count", { count: summary.count })}</span>
                </span>
              )}
              <span className="font-mono text-xs text-stone-600">
                <Freshness days={days} label={days === 0 ? t("activeToday") : t("activeDaysAgo", { days })} />
              </span>
              {!isOpen && <JobStatusBadge status={job.status} expiresAt={job.expires_at} />}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <TermsBlock job={job} />

          {(cuisines.length > 0 || skills.length > 0) && (
            <Card className="space-y-4">
              {cuisines.length > 0 && (
                <div>
                  <h2 className="eyebrow mb-2">{t("cuisines")}</h2>
                  <div className="flex flex-wrap gap-1.5">{cuisines.map((c) => <Badge key={c} tone="orange">{c}</Badge>)}</div>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <h2 className="eyebrow mb-2">{t("skills")}</h2>
                  <div className="flex flex-wrap gap-1.5">{skills.map((s) => <Badge key={s}>{s}</Badge>)}</div>
                </div>
              )}
            </Card>
          )}

          {job.description && (
            <Card>
              <h2 className="font-display text-xl font-semibold">{t("aboutJob")}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-800">{job.description}</p>
            </Card>
          )}

          {biz && (
            <Card className="space-y-3">
              <h2 className="font-display text-xl font-semibold">{t("aboutEmployer")}</h2>
              <p className="text-sm text-stone-700">
                {te(`business_category.${biz.category}`)} · {biz.address}, {biz.city}
              </p>
              {biz.description && <p className="whitespace-pre-line text-sm leading-relaxed text-stone-800">{biz.description}</p>}
              <LinkButton href={`/b/${biz.id}`} variant="ghost" className="-ml-3">
                {t("seeEmployer")} <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
            </Card>
          )}
        </div>

        {/* ------------------------------------------------ apply panel */}
        <aside className="order-first space-y-4 lg:order-none">
          <div className="ticket overflow-hidden lg:sticky lg:top-24">
            <div className="bg-haldi px-5 py-4">
              <p className="eyebrow text-ink/70">{t("salaryLabel")}</p>
              <p className="font-display text-3xl font-bold leading-tight">{formatSalaryRange(job.salary_min, job.salary_max, locale)}</p>
              <p className="font-mono text-xs uppercase">{te(`payPer.${job.pay_frequency}`)}</p>
            </div>
            <div className="ticket-tear" aria-hidden />
            <div className="space-y-3 p-5">
              {invite && !application && (
                <div className="rounded-xl border-2 border-kokum/30 bg-kokum-soft p-3 text-sm text-kokum">
                  <p className="font-semibold">{t("invitedBanner", { business: biz?.name ?? "" })}</p>
                  {invite.message && <p className="mt-1">“{invite.message}”</p>}
                </div>
              )}
              {application ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{t("youApplied")}</p>
                  <ApplicationStatusBadge status={application.status} />
                  <LinkButton href="/w/applications" variant="secondary" className="w-full">{t("viewApplications")}</LinkButton>
                </div>
              ) : !isOpen ? (
                <p className="text-sm text-stone-700">{t("notAccepting")}</p>
              ) : !user ? (
                <LinkButton href={`/login?next=${encodeURIComponent(`/${locale}/jobs/${job.id}`)}`} className="w-full">
                  {t("loginToApply")}
                </LinkButton>
              ) : isWorker && !hasProfile ? (
                <LinkButton href="/onboarding" className="w-full">{t("completeProfileToApply")}</LinkButton>
              ) : isWorker ? (
                <ApplyForm jobId={job.id} />
              ) : (
                <p className="text-sm text-stone-700">{t("employersCannotApply")}</p>
              )}
              {isWorker && <SaveJobButton jobId={job.id} saved={saved} />}
              {isOpen && <WhatsAppShare text={shareText} url={shareUrl} className="w-full" />}
              <p className="text-center font-mono text-[11px] text-stone-500">{t("phoneHidden")}</p>
            </div>
          </div>
          {user && <ReportForm targetType="job" targetId={job.id} />}
        </aside>
      </div>
    </div>
  );
}
