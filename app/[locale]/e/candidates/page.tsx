import { getLocale, getTranslations } from "next-intl/server";
import { UsersRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxonomy, localName, namesFor } from "@/lib/taxonomy";
import { PAGE_SIZE } from "@/lib/constants";
import { experienceLabel, formatSalaryRange } from "@/lib/format";
import { likeEscape, page as getPage, parseJobFilters, str } from "@/lib/search-params";
import { JobFilters } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { RoleIcon } from "@/components/role-icon";
import { photoUrl } from "@/lib/storage";

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
    .select("user_id, photo_url, headline, city, state, primary_role_id, secondary_role_ids, cuisine_ids, total_experience_months, expected_salary_min, expected_salary_max, pay_frequency, needs_accommodation, updated_at, profiles(full_name)")
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
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <JobFilters
        action={`/${locale}/e/candidates`}
        roles={taxonomy.roles}
        cuisines={taxonomy.cuisines}
        showPerks={false}
        values={{ state: f.state, city: f.city, role: str(sp, "role"), cuisine: str(sp, "cuisine"), salary: str(sp, "salary"), type: f.type }}
      />
      <p className="mt-2 text-xs text-stone-500">{t("salaryFilterHint")}</p>
      <div className="mt-6">
        {rows.length ? (
          <div className="card-grid">
            {rows.slice(0, PAGE_SIZE).map((w) => {
              const exp = experienceLabel(w.total_experience_months);
              const role = roleById.get(w.primary_role_id);
              return (
                <article key={w.user_id} className="ticket ticket-hover">
                  <Link href={`/e/candidates/${w.user_id}`} className="block rounded-[12px]">
                    <div className="flex items-center gap-3 p-4">
                      <Avatar src={photoUrl("avatars", w.photo_url)} name={w.profiles?.full_name || "?"} size={52} />
                      <div className="min-w-0">
                        <p className="eyebrow flex items-center gap-1 text-orange-700"><RoleIcon slug={role?.slug} className="size-3" /> {localName(role, locale)}</p>
                        <p className="truncate font-display text-lg font-semibold">{w.profiles?.full_name || t("unnamed")}</p>
                        <p className="truncate text-xs text-stone-600">{w.headline || w.city}</p>
                      </div>
                    </div>
                    <div className="ticket-tear" aria-hidden />
                    <div className="space-y-2 p-4">
                      <p className="font-mono text-xs text-stone-700">
                        {t("experience", exp)} · {w.city}
                      </p>
                      {(w.expected_salary_min || w.expected_salary_max) && (
                        <p className="font-display text-lg font-bold">
                          {formatSalaryRange(w.expected_salary_min, w.expected_salary_max, locale)}
                          <span className="ml-1 font-mono text-[11px] font-normal uppercase text-stone-500">{te(`payPer.${w.pay_frequency}`)}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {namesFor(w.cuisine_ids, taxonomy.cuisines, locale).slice(0, 4).map((c) => <Badge key={c} tone="orange">{c}</Badge>)}
                        {w.needs_accommodation && <Badge tone="yellow">{t("needsAccommodation")}</Badge>}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<UsersRound className="size-5" />} title={t("noResults")}>{t("noResultsHint")}</EmptyState>
        )}
        <Pagination basePath="/e/candidates" searchParams={sp} page={page} hasMore={rows.length > PAGE_SIZE} />
      </div>
    </div>
  );
}
