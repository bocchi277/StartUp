import { getTranslations } from "next-intl/server";
import { requireBusiness } from "@/lib/auth";
import { BusinessForm } from "@/components/forms/business-form";
import { VerificationBadge } from "@/components/display";
import { Card, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("business") };
}

export default async function BusinessPage() {
  const { business } = await requireBusiness();
  const t = await getTranslations("businessPage");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("title")} />
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t("verification")}</span>
          <VerificationBadge level={business.verification_level} />
        </div>
        <p className="text-sm text-stone-600">{t(`levelHint.${business.verification_level}`)}</p>
      </Card>
      <BusinessForm business={business} />
    </div>
  );
}
