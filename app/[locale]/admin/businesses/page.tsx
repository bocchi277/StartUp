import { getLocale, getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { page as getPage, str } from "@/lib/search-params";
import { PAGE_SIZE } from "@/lib/constants";
import { VerificationBadge } from "@/components/display";
import { VerificationForm } from "@/components/forms/admin-forms";
import { Pagination } from "@/components/pagination";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function AdminBusinesses({ searchParams }: PageProps<"/[locale]/admin/businesses">) {
  await requireAdmin();
  const sp = await searchParams;
  const pg = getPage(sp);
  const show = str(sp, "show") === "all" ? "all" : "pending";
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const te = await getTranslations("enums.business_category");
  const supabase = await createClient();

  let query = supabase.from("businesses").select("*");
  if (show === "pending") query = query.neq("verification_level", "business_verified");
  const from = (pg - 1) * PAGE_SIZE;
  const { data } = await query.order("created_at", { ascending: true }).range(from, from + PAGE_SIZE);
  const rows = data ?? [];

  return (
    <div>
      <PageHeader
        title={t("businesses")}
        subtitle={t("businessesHint")}
        actions={
          <LinkButton href={show === "all" ? "/admin/businesses" : "/admin/businesses?show=all"} variant="secondary">
            {show === "all" ? t("showPending") : t("showAll")}
          </LinkButton>
        }
      />
      {!rows.length ? (
        <EmptyState title={t("nothingHere")} />
      ) : (
        <div className="space-y-3">
          {rows.slice(0, PAGE_SIZE).map((b) => (
            <Card key={b.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-sm text-stone-600">{te(b.category)} · {b.address}, {b.city}, {b.state} {b.pincode ?? ""}</p>
                  <p className="text-sm">
                    <a href={`tel:${b.phone}`} className="text-orange-700 underline">{b.phone}</a>
                    <span className="text-stone-500"> · {t("joined", { date: formatDate(b.created_at, locale) })}</span>
                  </p>
                </div>
                <VerificationBadge level={b.verification_level} />
              </div>
              <VerificationForm businessId={b.id} level={b.verification_level} />
            </Card>
          ))}
        </div>
      )}
      <Pagination basePath="/admin/businesses" searchParams={sp} page={pg} hasMore={rows.length > PAGE_SIZE} />
    </div>
  );
}
