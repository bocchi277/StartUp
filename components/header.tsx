import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/brand";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function Header() {
  const user = await getCurrentUser();
  const t = await getTranslations("nav");
  const role = user?.profile.role;

  const links: { href: string; label: string }[] = [];
  if (!user) {
    links.push({ href: "/jobs", label: t("findJobs") }, { href: "/signup?role=employer", label: t("hireStaff") });
  } else if (role === "worker") {
    links.push(
      { href: "/w", label: t("home") },
      { href: "/jobs", label: t("findJobs") },
      { href: "/w/applications", label: t("myApplications") },
      { href: "/w/profile", label: t("myProfile") },
    );
  } else if (role === "employer") {
    links.push(
      { href: "/e", label: t("dashboard") },
      { href: "/e/jobs/new", label: t("postJob") },
      { href: "/e/candidates", label: t("findStaff") },
      { href: "/e/team", label: t("myTeam") },
      { href: "/e/business", label: t("business") },
    );
  }
  if (user?.profile.is_admin) links.push({ href: "/admin", label: t("admin") });

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="text-lg font-bold text-orange-700">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          {user ? (
            <form action={signOut}>
              <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm text-stone-600 hover:bg-stone-100">
                {t("logout")}
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100">
                {t("login")}
              </Link>
              <Link href="/signup" className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700">
                {t("signup")}
              </Link>
            </>
          )}
        </div>
      </div>
      {links.length > 0 && (
        <nav className="mx-auto max-w-6xl overflow-x-auto px-2 pb-2" aria-label={t("main")}>
          <ul className="flex gap-1 whitespace-nowrap">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-lg px-3 py-1.5 text-sm text-stone-700 hover:bg-orange-50 hover:text-orange-800">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
