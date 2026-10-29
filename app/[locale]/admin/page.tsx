import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";

export default async function AdminOverview() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;

  const [openReports, unverified, openJobs, applications, activePlacements, workers] = await Promise.all([
    supabase.from("reports").select("id", head).in("status", ["open", "reviewing"]),
    supabase.from("businesses").select("id", head).neq("verification_level", "business_verified"),
    supabase.from("jobs").select("id", head).eq("status", "open").gt("expires_at", new Date().toISOString()),
    supabase.from("applications").select("id", head),
    supabase.from("placements").select("id", head).eq("status", "active"),
    supabase.from("worker_profiles").select("user_id", head),
  ]);

  const stats = [
    { label: t("openReports"), value: openReports.count, href: "/admin/reports" },
    { label: t("unverifiedBusinesses"), value: unverified.count, href: "/admin/businesses" },
    { label: t("openJobs"), value: openJobs.count, href: "/admin/jobs" },
    { label: t("workers"), value: workers.count },
    { label: t("applications"), value: applications.count },
    { label: t("activePlacements"), value: activePlacements.count },
  ];

  return (
    <div>
      <PageHeader title={t("title")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const body = (
            <Card className="text-center">
              <p className="text-2xl font-bold">{s.value ?? 0}</p>
              <p className="text-xs text-stone-600">{s.label}</p>
            </Card>
          );
          return s.href ? <Link key={s.label} href={s.href}>{body}</Link> : <div key={s.label}>{body}</div>;
        })}
      </div>
    </div>
  );
}
