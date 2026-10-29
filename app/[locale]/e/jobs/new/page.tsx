import { getTranslations } from "next-intl/server";
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
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("newTitle")} subtitle={t("newSubtitle")} />
      <JobForm taxonomy={taxonomy} job={null} business={business} />
    </div>
  );
}
