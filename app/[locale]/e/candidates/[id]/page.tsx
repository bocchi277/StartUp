import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import { HistoryList } from "@/components/display";
import { WorkerSummary } from "@/components/worker-summary";
import { ReportForm } from "@/components/report-form";
import { Card, SectionTitle } from "@/components/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CandidatePage({ params }: PageProps<"/[locale]/e/candidates/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { business } = await requireBusiness();
  const t = await getTranslations("candidates");
  const supabase = await createClient();

  const [{ data: profile }, { data: person }, { data: history }, { data: myApps }, taxonomy] = await Promise.all([
    supabase.from("worker_profiles").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", id).maybeSingle(),
    supabase.from("employment_history").select("*").eq("worker_id", id).order("start_date", { ascending: false }),
    supabase.from("applications").select("id, jobs!inner(title, business_id)").eq("worker_id", id).eq("jobs.business_id", business.id),
    getTaxonomy(),
  ]);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/e/candidates" className="text-sm text-orange-700 hover:underline">← {t("back")}</Link>
      <WorkerSummary name={person?.full_name ?? ""} profile={profile} taxonomy={taxonomy} />

      {myApps?.length ? (
        <Card className="space-y-1 text-sm">
          <p className="font-medium">{t("appliedToYou")}</p>
          {myApps.map((a) => (
            <p key={a.id}><Link href={`/e/applications/${a.id}`} className="text-orange-700 underline">{a.jobs.title}</Link></p>
          ))}
        </Card>
      ) : (
        <Card className="text-sm text-stone-600">{t("contactAfterApply")}</Card>
      )}

      <section>
        <SectionTitle>{t("workHistory")}</SectionTitle>
        <Card>
          <HistoryList rows={history ?? []} roles={taxonomy.roles} />
        </Card>
      </section>
      <ReportForm targetType="worker" targetId={id} />
    </div>
  );
}
