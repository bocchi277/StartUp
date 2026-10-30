import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireWorker } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import { deleteHistory } from "@/lib/actions/worker";
import { photoUrl } from "@/lib/storage";
import { summarize, type ReviewRow } from "@/lib/reviews";
import { HistoryList } from "@/components/display";
import { ActionButton } from "@/components/action-button";
import { HistoryForm } from "@/components/forms/history-form";
import { WorkerProfileForm } from "@/components/forms/worker-profile-form";
import { PhotoUpload } from "@/components/photo-upload";
import { RatingSummary, ReviewList } from "@/components/reviews";
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
  const tr = await getTranslations("reviews");
  const supabase = await createClient();

  const [{ data: profile }, { data: contacts }, { data: history }, { data: reviewRows }, taxonomy] = await Promise.all([
    supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("worker_contacts").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("employment_history").select("*").eq("worker_id", user.id).order("start_date", { ascending: false }),
    supabase.from("reviews").select("*, businesses(name)").eq("worker_id", user.id).eq("reviewer_side", "employer").order("created_at", { ascending: false }),
    getTaxonomy(),
  ]);
  if (!profile) return redirect({ href: "/onboarding", locale });

  const reviews: ReviewRow[] = (reviewRows ?? []).map((r) => ({ ...r, author: r.businesses?.name }));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <PhotoUpload kind="worker" userId={user.id} currentUrl={photoUrl("avatars", profile.photo_url)} name={user.profile.full_name} />
      </Card>

      <section>
        <SectionTitle>{th("title")}</SectionTitle>
        <p className="mb-4 text-sm text-stone-700">{th("explainer")}</p>
        <Card className="space-y-6">
          <HistoryList
            rows={history ?? []}
            roles={taxonomy.roles}
            renderActions={(row) =>
              row.source === "self_reported" ? (
                <ActionButton action={deleteHistory} fields={{ id: row.id }} variant="ghost" confirm={th("confirmDelete")} className="mt-1">
                  {th("delete")}
                </ActionButton>
              ) : null
            }
          />
          <details className="rounded-2xl border-2 border-dashed border-stone-300 p-4 open:border-solid open:border-ink">
            <summary className="cursor-pointer font-semibold text-orange-700">{th("addPrevious")}</summary>
            <div className="mt-4">
              <HistoryForm roles={taxonomy.roles} />
            </div>
          </details>
        </Card>
      </section>

      <section>
        <SectionTitle>{tr("aboutYou")}</SectionTitle>
        <Card className="space-y-5">
          <RatingSummary summary={summarize(reviews)} kind="worker" />
          <ReviewList reviews={reviews} canRespond authorFallback={tr("employer")} />
        </Card>
      </section>

      <section>
        <SectionTitle>{t("details")}</SectionTitle>
        <WorkerProfileForm taxonomy={taxonomy} profile={profile} contacts={contacts} fullName={user.profile.full_name} />
      </section>
    </div>
  );
}
