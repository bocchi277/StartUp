import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { page as getPage, str } from "@/lib/search-params";
import { PAGE_SIZE } from "@/lib/constants";
import { ReportStatusForm } from "@/components/forms/admin-forms";
import { Pagination } from "@/components/pagination";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function AdminReports({ searchParams }: PageProps<"/[locale]/admin/reports">) {
  await requireAdmin();
  const sp = await searchParams;
  const pg = getPage(sp);
  const show = str(sp, "show") === "all" ? "all" : "open";
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const te = await getTranslations("enums");
  const supabase = await createClient();

  let query = supabase.from("reports").select("*, profiles(full_name)");
  if (show === "open") query = query.in("status", ["open", "reviewing"]);
  const from = (pg - 1) * PAGE_SIZE;
  const { data } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE);
  const rows = data ?? [];
  const reviewIds = rows.filter((r) => r.target_type === "review").map((r) => r.target_id);
  const { data: reviewed } = reviewIds.length
    ? await supabase.from("reviews").select("id, rating, comment").in("id", reviewIds)
    : { data: [] };
  const reviewById = new Map((reviewed ?? []).map((r) => [r.id, r]));

  return (
    <div>
      <PageHeader
        title={t("reports")}
        actions={
          <LinkButton href={show === "all" ? "/admin/reports" : "/admin/reports?show=all"} variant="secondary">
            {show === "all" ? t("showOpen") : t("showAll")}
          </LinkButton>
        }
      />
      {!rows.length ? (
        <EmptyState title={t("nothingHere")} />
      ) : (
        <div className="space-y-3">
          {rows.slice(0, PAGE_SIZE).map((r) => (
            <Card key={r.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{te(`report_reason.${r.reason}`)}</p>
                  <p className="text-sm text-stone-600">
                    {te(`report_target.${r.target_type}`)} ·{" "}
                    {r.target_type === "job" ? (
                      <Link href={`/jobs/${r.target_id}`} className="text-orange-700 underline">{t("openTarget")}</Link>
                    ) : (
                      <code className="text-xs">{r.target_id}</code>
                    )}
                  </p>
                  <p className="text-xs text-stone-500">
                    {t("reportedBy", { name: r.profiles?.full_name || "—", time: formatDateTime(r.created_at, locale) })}
                  </p>
                </div>
                <Badge tone={r.status === "open" ? "red" : r.status === "reviewing" ? "yellow" : "neutral"}>
                  {te(`report_status.${r.status}`)}
                </Badge>
              </div>
              {r.target_type === "review" && reviewById.get(r.target_id) && (
                <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm">
                  ★ {reviewById.get(r.target_id)!.rating} · “{reviewById.get(r.target_id)!.comment ?? "—"}”
                </p>
              )}
              {r.details && <p className="whitespace-pre-line text-sm">{r.details}</p>}
              {r.admin_note && <p className="text-sm text-stone-600">{t("adminNote")}: {r.admin_note}</p>}
              <ReportStatusForm reportId={r.id} status={r.status} />
            </Card>
          ))}
        </div>
      )}
      <Pagination basePath="/admin/reports" searchParams={sp} page={pg} hasMore={rows.length > PAGE_SIZE} />
    </div>
  );
}
