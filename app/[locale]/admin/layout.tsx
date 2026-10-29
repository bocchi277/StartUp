import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const links = [
    { href: "/admin", label: t("overview") },
    { href: "/admin/businesses", label: t("businesses") },
    { href: "/admin/reports", label: t("reports") },
    { href: "/admin/jobs", label: t("jobs") },
    { href: "/admin/audit", label: t("audit") },
  ];
  return (
    <div className="space-y-6">
      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1" aria-label={t("title")}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
