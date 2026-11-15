import { getLocale, getTranslations } from "next-intl/server";
import { Languages } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { getTaxonomy } from "@/lib/taxonomy";
import { JobForm } from "@/components/forms/job-form";
import { PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("jobForm");
  return { title: t("newTitle") };
}

export default async function NewJobPage() {
  const { business } = await requireBusiness();
  const taxonomy = await getTaxonomy();
  const t = await getTranslations("jobForm");
  const locale = await getLocale();
  return (
    <div>
      <PageHeader title={t("newTitle")} subtitle={t("newSubtitle")} />
      {locale !== "hi" && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-ink bg-yellow-100 p-4 text-sm">
          <Languages className="size-5 shrink-0" aria-hidden />
          <p className="flex-1"><b>{t("hindiTipTitle")}</b> {t("hindiTipText")}</p>
          <Link href="/e/jobs/new" locale="hi" className="rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-semibold">{t("hindiTipLink")} →</Link>
        </div>
      )}
      <JobForm taxonomy={taxonomy} job={null} business={business} />
    </div>
  );
}
