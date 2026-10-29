import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireWorker } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import { deleteHistory } from "@/lib/actions/worker";
import { HistoryList } from "@/components/display";
import { ActionButton } from "@/components/action-button";
import { HistoryForm } from "@/components/forms/history-form";
import { WorkerProfileForm } from "@/components/forms/worker-profile-form";
import { Card, PageHeader, SectionTitle } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("myProfile") };
}

export default async function WorkerProfilePage() {
  const user = await requireWorker();
  const locale = await getLocale();
  const t = await getTranslations("workerProfile");
  const th = await getTranslations("history");
  const supabase = await createClient();

  const [{ data: profile }, { data: contacts }, { data: history }, taxonomy] = await Promise.all([
    supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("worker_contacts").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("employment_history").select("*").eq("worker_id", user.id).order("start_date", { ascending: false }),
    getTaxonomy(),
  ]);
  if (!profile) return redirect({ href: "/onboarding", locale });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section>
        <SectionTitle>{th("title")}</SectionTitle>
        <p className="mb-3 text-sm text-stone-600">{th("explainer")}</p>
        <Card className="space-y-5">
          <HistoryList
            rows={history ?? []}
            roles={taxonomy.roles}
            renderActions={(row) =>
              row.source === "self_reported" ? (
                <ActionButton action={deleteHistory} fields={{ id: row.id }} variant="ghost" confirm={th("confirmDelete")} className="mt-2">
                  {th("delete")}
                </ActionButton>
              ) : null
            }
          />
          <details className="rounded-lg border border-stone-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-orange-700">{th("addPrevious")}</summary>
            <div className="mt-4">
              <HistoryForm roles={taxonomy.roles} />
            </div>
          </details>
        </Card>
      </section>

      <section>
        <SectionTitle>{t("details")}</SectionTitle>
        <WorkerProfileForm taxonomy={taxonomy} profile={profile} contacts={contacts} fullName={user.profile.full_name} />
      </section>
    </div>
  );
}
