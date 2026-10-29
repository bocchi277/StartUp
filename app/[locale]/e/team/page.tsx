import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { daysAgo, formatDate, formatRupees } from "@/lib/format";
import { EndPlacementForm } from "@/components/forms/end-placement-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("myTeam") };
}

export default async function TeamPage() {
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("team");
  const te = await getTranslations("enums");
  const supabase = await createClient();

  const { data: placements } = await supabase
    .from("placements")
    .select("*, profiles(full_name), jobs(title)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const order = { pending: 0, active: 1, ended: 2, cancelled: 3 } as const;
  const rows = (placements ?? []).sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {!rows.length ? (
        <EmptyState title={t("empty")}>{t("emptyHint")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/e/applications/${p.application_id}`} className="font-medium text-stone-900 hover:underline">
                    {p.profiles?.full_name || t("unnamed")}
                  </Link>
                  <p className="text-sm text-stone-600">{p.jobs?.title} · {formatRupees(p.agreed_salary, locale)} {te(`payPer.${p.agreed_pay_frequency}`)}</p>
                  <p className="text-xs text-stone-500">
                    {formatDate(p.start_date, locale)} – {p.end_date ? formatDate(p.end_date, locale) : t("present")}
                    {p.status === "active" && ` · ${t("daysWorked", { days: daysAgo(p.start_date) })}`}
                  </p>
                </div>
                <Badge tone={p.status === "active" ? "green" : p.status === "pending" ? "yellow" : "neutral"}>
                  {te(`placement_status.${p.status}`)}
                </Badge>
              </div>
              {p.status === "pending" && <p className="mt-2 text-sm text-stone-600">{t("waitingForWorker")}</p>}
              {p.exit_reason && <p className="mt-2 text-sm text-stone-700">{t("exitReason")}: {p.exit_reason}</p>}
              {(p.status === "pending" || p.status === "active") && (
                <EndPlacementForm placementId={p.id} active={p.status === "active"} minDate={p.start_date} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
