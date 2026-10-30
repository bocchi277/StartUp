import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Mail, Search } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { requireWorker } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_CARD_SELECT } from "@/lib/queries";
import { likeEscape } from "@/lib/search-params";
import { photoUrl } from "@/lib/storage";
import { formatDate } from "@/lib/format";
import { JobCard } from "@/components/display";
import { Avatar, EmptyState, LinkButton, SectionTitle, StatTile, cn } from "@/components/ui";

export default async function WorkerHome() {
  const user = await requireWorker();
  const locale = await getLocale();
  const t = await getTranslations("workerHome");
  const supabase = await createClient();

  const { data: profile } = await supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) return redirect({ href: "/onboarding", locale });

  const now = new Date().toISOString();
  const roleIds = [profile.primary_role_id, ...profile.secondary_role_ids];

  const [{ data: nearby }, { data: inState }, { count: pendingJoins }, { data: invites }, { count: activeApps }, { count: savedCount }, { count: historyCount }] =
    await Promise.all([
      supabase.from("jobs").select(JOB_CARD_SELECT).eq("status", "open").gt("expires_at", now)
        .ilike("city", likeEscape(profile.city)).in("role_id", roleIds).order("last_confirmed_at", { ascending: false }).limit(9),
      supabase.from("jobs").select(JOB_CARD_SELECT).eq("status", "open").gt("expires_at", now)
        .eq("state", profile.state).in("role_id", roleIds).order("last_confirmed_at", { ascending: false }).limit(9),
      supabase.from("placements").select("id", { count: "exact", head: true }).eq("worker_id", user.id).eq("status", "pending"),
      supabase.from("job_invites").select("id, message, created_at, jobs(id, title, status, city), businesses(name)")
        .eq("worker_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("worker_id", user.id)
        .in("status", ["applied", "shortlisted", "interview", "offered"]),
      supabase.from("saved_jobs").select("job_id", { count: "exact", head: true }).eq("worker_id", user.id),
      supabase.from("employment_history").select("id", { count: "exact", head: true }).eq("worker_id", user.id),
    ]);

  const seen = new Set((nearby ?? []).map((j) => j.id));
  const more = (inState ?? []).filter((j) => !seen.has(j.id));

  // Simple profile checklist: what makes owners more likely to shortlist.
  const checks = [
    { done: Boolean(profile.photo_url), label: t("checkPhoto") },
    { done: profile.cuisine_ids.length + profile.skill_ids.length > 0, label: t("checkSkills") },
    { done: (historyCount ?? 0) > 0, label: t("checkHistory") },
    { done: Boolean(profile.expected_salary_min || profile.expected_salary_max), label: t("checkSalary") },
  ];
  const strength = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const openInvites = (invites ?? []).filter((i) => i.jobs?.status === "open");

  return (
    <div className="space-y-12">
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-6 text-cream shadow-hard-lg sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full border-[16px] border-orange-600/50" />
          <div className="relative flex items-center gap-4">
            <Avatar src={photoUrl("avatars", profile.photo_url)} name={user.profile.full_name} size={64} className="border-cream" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-haldi">{profile.city}</p>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("greeting", { name: user.profile.full_name || "" })}</h1>
            </div>
          </div>
          <p className="relative mt-4 max-w-md text-sm text-stone-300">{profile.open_to_work ? t("openToWork") : t("notOpenToWork")}</p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <LinkButton href="/jobs" variant="haldi"><Search className="size-4" aria-hidden /> {t("searchAll")}</LinkButton>
            <LinkButton href="/w/profile" variant="secondary">{t("editProfile")}</LinkButton>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/w/applications"><StatTile value={activeApps ?? 0} label={t("statActive")} tone="haldi" /></Link>
          <Link href="/w/saved"><StatTile value={savedCount ?? 0} label={t("statSaved")} /></Link>
          <div className="col-span-2 rounded-2xl border-2 border-ink bg-cream p-4 shadow-hard">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest">{t("strength")}</p>
              <p className="font-display text-2xl font-bold">{strength}%</p>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-paper">
              <div className="h-full bg-green-500" style={{ width: `${strength}%` }} />
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1 text-xs">
              {checks.map((c) => (
                <li key={c.label} className={cn("flex items-center gap-1.5", c.done ? "text-green-700" : "text-stone-600")}>
                  <span aria-hidden>{c.done ? "✓" : "○"}</span> {c.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {(pendingJoins ?? 0) > 0 && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border-2 border-ink bg-green-100 p-5 shadow-hard sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-green-900">{t("pendingJoin")}</p>
          <LinkButton href="/w/applications">{t("confirmNow")} <ArrowRight className="size-4" aria-hidden /></LinkButton>
        </div>
      )}

      {openInvites.length > 0 && (
        <section>
          <SectionTitle>{t("invitesTitle")}</SectionTitle>
          <ul className="grid gap-3 md:grid-cols-2">
            {openInvites.map((inv) => (
              <li key={inv.id}>
                <Link href={`/jobs/${inv.jobs!.id}`} className="flex items-start gap-3 rounded-2xl border-2 border-kokum/40 bg-kokum-soft p-4 transition-colors hover:border-kokum">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-kokum bg-cream text-kokum">
                    <Mail className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-kokum">{t("invitedBy", { business: inv.businesses?.name ?? "" })}</span>
                    <span className="block text-sm text-stone-800">{inv.jobs!.title} · {inv.jobs!.city}</span>
                    {inv.message && <span className="mt-1 block text-sm italic text-stone-700">“{inv.message}”</span>}
                    <span className="mt-1 block font-mono text-[11px] text-stone-500">{formatDate(inv.created_at, locale)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle>{t("nearYou", { city: profile.city })}</SectionTitle>
        {nearby?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          <EmptyState icon={<Search className="size-5" />} title={t("noneNearby")}>{t("noneNearbyHint")}</EmptyState>
        )}
      </section>

      {more.length > 0 && (
        <section>
          <SectionTitle>{t("inState", { state: profile.state })}</SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </section>
      )}
    </div>
  );
}
