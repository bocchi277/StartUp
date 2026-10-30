import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getMyBusiness, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import { Card, PageHeader } from "@/components/ui";
import { RoleChooser } from "@/components/forms/auth-forms";
import { WorkerProfileForm } from "@/components/forms/worker-profile-form";
import { BusinessForm } from "@/components/forms/business-form";

export async function generateMetadata() {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

export default async function OnboardingPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = await getTranslations("onboarding");
  const role = user.profile.role;

  if (!role) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={t("chooseRoleTitle")} subtitle={t("chooseRoleSubtitle")} />
        <Card>
          <RoleChooser />
        </Card>
      </div>
    );
  }

  if (role === "employer") {
    if (await getMyBusiness()) return redirect({ href: "/e", locale });
    return (
      <div>
        <PageHeader title={t("businessTitle")} subtitle={t("businessSubtitle")} />
        <BusinessForm business={null} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("worker_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (existing) return redirect({ href: "/w", locale });

  const taxonomy = await getTaxonomy();
  return (
    <div>
      <PageHeader title={t("workerTitle")} subtitle={t("workerSubtitle")} />
      <WorkerProfileForm taxonomy={taxonomy} profile={null} contacts={null} fullName={user.profile.full_name} after="onboarding" />
    </div>
  );
}
