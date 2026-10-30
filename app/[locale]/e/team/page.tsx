import { getLocale, getTranslations } from "next-intl/server";
import { Briefcase } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { daysAgo, formatDate, formatRupees } from "@/lib/format";
import { photoUrl } from "@/lib/storage";
import { canReviewPlacement } from "@/lib/reviews";
import { EndPlacementForm } from "@/components/forms/end-placement-form";
import { ReviewForm } from "@/components/forms/review-forms";
import { Avatar, Badge, EmptyState, PageHeader, Stamp } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("myTeam") };
}

export default async function TeamPage() {
  const { user, business } = await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("team");
  const te = await getTranslations("enums");
  const tr = await getTranslations("reviews");
  const supabase = await createClient();

  const [{ data: placements }, { data: myReviews }] = await Promise.all([
    supabase
      .from("placements")
      .select("*, profiles(full_name, worker_profiles(photo_url)), jobs(title)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("placement_id").eq("reviewer_id", user.id),
  ]);
  const reviewed = new Set((myReviews ?? []).map((r) => r.placement_id));

  const order = { pending: 0, active: 1, ended: 2, cancelled: 3 } as const;
  const rows = (placements ?? []).sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      {!rows.length ? (
        <EmptyState icon={<Briefcase className="size-5" />} title={t("empty")}>{t("emptyHint")}</EmptyState>
      ) : (
        <ul className="space-y-4">
          {rows.map((p) => (
            <li key={p.id} className="ticket p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={photoUrl("avatars", p.profiles?.worker_profiles?.photo_url)} name={p.profiles?.full_name || "?"} size={48} />
                  <div>
                    <Link href={`/e/applications/${p.application_id}`} className="font-display text-lg font-semibold hover:underline">
                      {p.profiles?.full_name || t("unnamed")}
                    </Link>
                    <p className="text-sm text-stone-700">{p.jobs?.title} · {formatRupees(p.agreed_salary, locale)} {te(`payPer.${p.agreed_pay_frequency}`)}</p>
                    <p className="font-mono text-xs text-stone-500">
                      {formatDate(p.start_date, locale)} → {p.end_date ? formatDate(p.end_date, locale) : t("present")}
                      {p.status === "active" && ` · ${t("daysWorked", { days: daysAgo(p.start_date) })}`}
                    </p>
                  </div>
                </div>
                {p.status === "active" ? (
                  <Stamp tone="green">{te(`placement_status.${p.status}`)}</Stamp>
                ) : (
                  <Badge tone={p.status === "pending" ? "yellow" : "neutral"}>{te(`placement_status.${p.status}`)}</Badge>
                )}
              </div>
              {p.status === "pending" && <p className="mt-3 text-sm text-stone-700">{t("waitingForWorker")}</p>}
              {p.exit_reason && <p className="mt-3 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">{t("exitReason")}: {p.exit_reason}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {(p.status === "pending" || p.status === "active") && (
                  <EndPlacementForm placementId={p.id} active={p.status === "active"} minDate={p.start_date} />
                )}
              </div>
              {reviewed.has(p.id) ? (
                <p className="mt-3 text-sm font-semibold text-green-700">✓ {tr("youReviewed")}</p>
              ) : canReviewPlacement(p) ? (
                <div className="mt-3"><ReviewForm placementId={p.id} side="employer" /></div>
              ) : p.status === "active" ? (
                <p className="mt-3 text-xs text-stone-600">{tr("availableAfter30")}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
