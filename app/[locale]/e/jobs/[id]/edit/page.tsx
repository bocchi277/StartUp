import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import { JobForm } from "@/components/forms/job-form";
import { PageHeader } from "@/components/ui";

export default async function EditJobPage({ params }: PageProps<"/[locale]/e/jobs/[id]/edit">) {
  const { id } = await params;
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!job || job.status === "removed") notFound();

  const taxonomy = await getTaxonomy();
  const t = await getTranslations("jobForm");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("editTitle")} subtitle={job.title} />
      <JobForm taxonomy={taxonomy} job={job} business={business} />
    </div>
  );
}
