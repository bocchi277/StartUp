import { getLocale, getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { page as getPage } from "@/lib/search-params";
import { Pagination } from "@/components/pagination";
import { EmptyState, PageHeader } from "@/components/ui";

const SIZE = 50;

export default async function AdminAudit({ searchParams }: PageProps<"/[locale]/admin/audit">) {
  await requireAdmin();
  const sp = await searchParams;
  const pg = getPage(sp);
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const supabase = await createClient();

  const from = (pg - 1) * SIZE;
  const { data } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .range(from, from + SIZE);
  const rows = data ?? [];

  return (
    <div>
      <PageHeader title={t("audit")} subtitle={t("auditHint")} />
      {!rows.length ? (
        <EmptyState title={t("nothingHere")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-3 py-2">{t("time")}</th>
                <th className="px-3 py-2">{t("actor")}</th>
                <th className="px-3 py-2">{t("action")}</th>
                <th className="px-3 py-2">{t("details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {rows.slice(0, SIZE).map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2">{formatDateTime(r.created_at, locale)}</td>
                  <td className="px-3 py-2">{r.profiles?.full_name || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-3 py-2 font-mono text-xs text-stone-600">{JSON.stringify(r.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination basePath="/admin/audit" searchParams={sp} page={pg} hasMore={rows.length > SIZE} />
    </div>
  );
}
