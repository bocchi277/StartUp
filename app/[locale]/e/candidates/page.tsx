import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy, localName, namesFor } from "@/lib/taxonomy";
import { PAGE_SIZE } from "@/lib/constants";
import { experienceLabel, formatSalaryRange } from "@/lib/format";
import { likeEscape, page as getPage, parseJobFilters, str } from "@/lib/search-params";
import { JobFilters } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("candidates");
  return { title: t("title") };
}

export default async function CandidatesPage({ searchParams }: PageProps<"/[locale]/e/candidates">) {
  await requireBusiness();
  const sp = await searchParams;
  const f = parseJobFilters(sp);
  const page = getPage(sp);
  const locale = await getLocale();
  const t = await getTranslations("candidates");
  const te = await getTranslations("enums");
  const taxonomy = await getTaxonomy();
  const supabase = await createClient();

  // Only open-to-work workers. Contact details are never part of this query.
  let query = supabase
    .from("worker_profiles")
    .select("user_id, city, state, primary_role_id, secondary_role_ids, cuisine_ids, total_experience_months, expected_salary_min, expected_salary_max, pay_frequency, needs_accommodation, updated_at, profiles(full_name)")
    .eq("open_to_work", true);
  if (f.state) query = query.eq("state", f.state);
  if (f.city) query = query.ilike("city", `%${likeEscape(f.city)}%`);
  if (f.role) query = query.or(`primary_role_id.eq.${f.role},secondary_role_ids.cs.{${f.role}}`);
  if (f.cuisine) query = query.contains("cuisine_ids", [f.cuisine]);
  if (f.type) query = query.contains("employment_types", [f.type]);
  if (f.salary) query = query.or(`expected_salary_min.is.null,expected_salary_min.lte.${f.salary}`);

  const from = (page - 1) * PAGE_SIZE;
  const { data, error } = await query.order("updated_at", { ascending: false }).range(from, from + PAGE_SIZE);
  if (error) console.error("[candidates]", error.message);
  const rows = data ?? [];
  const roleById = new Map(taxonomy.roles.map((r) => [r.id, r]));

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <JobFilters
        action={`/${locale}/e/candidates`}
        roles={taxonomy.roles}
        cuisines={taxonomy.cuisines}
        values={{ state: f.state, city: f.city, role: str(sp, "role"), cuisine: str(sp, "cuisine"), salary: str(sp, "salary"), type: f.type }}
      />
      <p className="mt-2 text-xs text-stone-500">{t("salaryFilterHint")}</p>
      <div className="mt-6">
        {rows.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.slice(0, PAGE_SIZE).map((w) => {
              const exp = experienceLabel(w.total_experience_months);
              return (
                <Card key={w.user_id} className="hover:shadow-md">
                  <Link href={`/e/candidates/${w.user_id}`} className="block space-y-2">
                    <div>
                      <p className="font-semibold text-stone-900">{w.profiles?.full_name || t("unnamed")}</p>
                      <p className="text-sm text-stone-600">{localName(roleById.get(w.primary_role_id), locale)} · {w.city}</p>
                    </div>
                    <p className="text-sm">
                      {t("experience", exp)}
                      {(w.expected_salary_min || w.expected_salary_max) &&
                        ` · ${formatSalaryRange(w.expected_salary_min, w.expected_salary_max, locale)} ${te(`payPer.${w.pay_frequency}`)}`}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {namesFor(w.cuisine_ids, taxonomy.cuisines, locale).slice(0, 4).map((c) => <Badge key={c}>{c}</Badge>)}
                      {w.needs_accommodation && <Badge tone="yellow">{t("needsAccommodation")}</Badge>}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t("noResults")}>{t("noResultsHint")}</EmptyState>
        )}
        <Pagination basePath="/e/candidates" searchParams={sp} page={page} hasMore={rows.length > PAGE_SIZE} />
      </div>
    </div>
  );
}
