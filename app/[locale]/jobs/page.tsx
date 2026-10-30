import { getLocale, getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy } from "@/lib/taxonomy";
import { JOB_CARD_SELECT } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { likeEscape, page as getPage, parseJobFilters, str } from "@/lib/search-params";
import { JobCard } from "@/components/display";
import { JobFilters } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";
import { EmptyState, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("jobs");
  return { title: t("searchTitle") };
}

export default async function JobsPage({ searchParams }: PageProps<"/[locale]/jobs">) {
  const sp = await searchParams;
  const f = parseJobFilters(sp);
  const page = getPage(sp);
  const locale = await getLocale();
  const t = await getTranslations("jobs");
  const taxonomy = await getTaxonomy();

  const supabase = await createClient();
  let query = supabase
    .from("jobs")
    .select(JOB_CARD_SELECT, { count: "exact" })
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString());
  if (f.state) query = query.eq("state", f.state);
  if (f.city) query = query.ilike("city", `%${likeEscape(f.city)}%`);
  if (f.role) query = query.eq("role_id", f.role);
  if (f.cuisine) query = query.contains("cuisine_ids", [f.cuisine]);
  if (f.salary) query = query.gte("salary_max", f.salary);
  if (f.type) query = query.eq("employment_type", f.type);
  if (f.meals) query = query.neq("meals", "none");
  if (f.stay) query = query.eq("accommodation", true);

  const from = (page - 1) * PAGE_SIZE;
  // Fetch one extra row to know whether there is a next page.
  const { data: jobs, error, count } = await query
    .order("last_confirmed_at", { ascending: false })
    .range(from, from + PAGE_SIZE);
  if (error) console.error("[jobs]", error.message);
  const rows = jobs ?? [];

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("searchTitle")} subtitle={t("searchSubtitle")} />
      <JobFilters
        action={`/${locale}/jobs`}
        roles={taxonomy.roles}
        cuisines={taxonomy.cuisines}
        values={{
          state: f.state, city: f.city, role: str(sp, "role"), cuisine: str(sp, "cuisine"),
          salary: str(sp, "salary"), type: f.type, meals: f.meals ? "1" : undefined, stay: f.stay ? "1" : undefined,
        }}
      />
      <div className="mt-8">
        {rows.length > 0 && (
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-stone-600">{t("resultCount", { count: count ?? rows.length })}</p>
        )}
        {rows.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.slice(0, PAGE_SIZE).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Search className="size-5" />} title={t("noResults")}>{t("noResultsHint")}</EmptyState>
        )}
        <Pagination basePath="/jobs" searchParams={sp} page={page} hasMore={rows.length > PAGE_SIZE} />
      </div>
    </div>
  );
}
