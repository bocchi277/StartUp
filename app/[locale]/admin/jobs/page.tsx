import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatSalaryRange } from "@/lib/format";
import { page as getPage } from "@/lib/search-params";
import { PAGE_SIZE } from "@/lib/constants";
import { JobStatusBadge } from "@/components/display";
import { JobStatusForm } from "@/components/forms/admin-forms";
import { Pagination } from "@/components/pagination";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function AdminJobs({ searchParams }: PageProps<"/[locale]/admin/jobs">) {
  await requireAdmin();
  const sp = await searchParams;
  const pg = getPage(sp);
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const supabase = await createClient();

  const from = (pg - 1) * PAGE_SIZE;
  const { data } = await supabase
    .from("jobs")
    .select("id, title, status, city, salary_min, salary_max, created_at, expires_at, businesses(name)")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE);
  const rows = data ?? [];

  return (
    <div>
      <PageHeader title={t("jobs")} subtitle={t("jobsHint")} />
      {!rows.length ? (
        <EmptyState title={t("nothingHere")} />
      ) : (
        <div className="space-y-3">
          {rows.slice(0, PAGE_SIZE).map((j) => (
            <Card key={j.id} className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/jobs/${j.id}`} className="font-semibold hover:underline">{j.title}</Link>
                  <p className="text-sm text-stone-600">
                    {j.businesses?.name} · {j.city} · {formatSalaryRange(j.salary_min, j.salary_max, locale)} · {formatDate(j.created_at, locale)}
                  </p>
                </div>
                <JobStatusBadge status={j.status} expiresAt={j.expires_at} />
              </div>
              <JobStatusForm jobId={j.id} status={j.status} />
            </Card>
          ))}
        </div>
      )}
      <Pagination basePath="/admin/jobs" searchParams={sp} page={pg} hasMore={rows.length > PAGE_SIZE} />
    </div>
  );
}
