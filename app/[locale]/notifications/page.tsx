import { getLocale, getTranslations } from "next-intl/server";
import {
  BadgeCheck, Bell, Briefcase, CircleCheck, LogOut, Mail, Star, UserPlus, Undo2, type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, openNotification } from "@/lib/actions/engagement";
import { formatDateTime } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { EmptyState, PageHeader, cn } from "@/components/ui";
import type { Enums } from "@/types/database";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("notifications") };
}

const ICON: Record<Enums<"notification_type">, LucideIcon> = {
  new_applicant: UserPlus,
  application_status: Briefcase,
  application_withdrawn: Undo2,
  hired: CircleCheck,
  joined: BadgeCheck,
  placement_ended: LogOut,
  invited: Mail,
  review_received: Star,
  business_verified: BadgeCheck,
};

const STATUSES = ["shortlisted", "interview", "offered", "rejected"] as const;

export default async function NotificationsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = await getTranslations("notifications");
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  const unread = rows.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={unread ? t("unread", { count: unread }) : t("allRead")}
        actions={unread > 0 ? <ActionButton action={markAllNotificationsRead} fields={{}} variant="secondary">{t("markAll")}</ActionButton> : null}
      />
      {!rows.length ? (
        <EmptyState icon={<Bell className="size-5" />} title={t("empty")}>{t("emptyHint")}</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((n) => {
            const Icon = ICON[n.type];
            const d = (n.data ?? {}) as Record<string, string | number>;
            const status = STATUSES.includes(d.status as (typeof STATUSES)[number]) ? String(d.status) : "other";
            const values = {
              job_title: String(d.job_title ?? ""),
              business_name: String(d.business_name ?? ""),
              worker_name: String(d.worker_name ?? ""),
              rating: Number(d.rating ?? 0),
              status,
            };
            return (
              <li key={n.id}>
                <form action={openNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                      n.read_at ? "border-line bg-cream/70 hover:bg-cream" : "border-ink bg-cream shadow-hard hover:bg-yellow-50",
                    )}
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink", n.read_at ? "bg-stone-100" : "bg-haldi")}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm", !n.read_at && "font-semibold")}>{t(`types.${n.type}`, values)}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-stone-500">{formatDateTime(n.created_at, locale)}</span>
                    </span>
                    {!n.read_at && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-orange-600" aria-label={t("new")} />}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
