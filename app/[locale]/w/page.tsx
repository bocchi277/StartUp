import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireWorker } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_CARD_SELECT } from "@/lib/queries";
import { likeEscape } from "@/lib/search-params";
import { JobCard } from "@/components/display";
import { Card, EmptyState, LinkButton, PageHeader, SectionTitle } from "@/components/ui";

export default async function WorkerHome() {
  const user = await requireWorker();
  const locale = await getLocale();
  const t = await getTranslations("workerHome");
  const supabase = await createClient();

  const { data: profile } = await supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) return redirect({ href: "/onboarding", locale });

  const now = new Date().toISOString();
  const roleIds = [profile.primary_role_id, ...profile.secondary_role_ids];

  // Same city + one of my roles first; fall back to my state.
  const [{ data: nearby }, { data: inState }, { count: pendingJoins }] = await Promise.all([
    supabase.from("jobs").select(JOB_CARD_SELECT).eq("status", "open").gt("expires_at", now)
      .ilike("city", likeEscape(profile.city)).in("role_id", roleIds).order("last_confirmed_at", { ascending: false }).limit(9),
    supabase.from("jobs").select(JOB_CARD_SELECT).eq("status", "open").gt("expires_at", now)
      .eq("state", profile.state).in("role_id", roleIds).order("last_confirmed_at", { ascending: false }).limit(9),
    supabase.from("placements").select("id", { count: "exact", head: true }).eq("worker_id", user.id).eq("status", "pending"),
  ]);

  const seen = new Set((nearby ?? []).map((j) => j.id));
  const more = (inState ?? []).filter((j) => !seen.has(j.id));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("greeting", { name: user.profile.full_name || "" })}
        subtitle={profile.open_to_work ? t("openToWork") : t("notOpenToWork")}
        actions={<LinkButton href="/jobs">{t("searchAll")}</LinkButton>}
      />

      {(pendingJoins ?? 0) > 0 && (
        <Card className="border-green-300 bg-green-50">
          <p className="font-medium text-green-900">{t("pendingJoin")}</p>
          <LinkButton href="/w/applications" className="mt-3">{t("confirmNow")}</LinkButton>
        </Card>
      )}

      <section>
        <SectionTitle>{t("nearYou", { city: profile.city })}</SectionTitle>
        {nearby?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          <EmptyState title={t("noneNearby")}>{t("noneNearbyHint")}</EmptyState>
        )}
      </section>

      {more.length > 0 && (
        <section>
          <SectionTitle>{t("inState", { state: profile.state })}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </section>
      )}
    </div>
  );
}
