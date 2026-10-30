import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Bell, LogOut, Shield } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Wordmark } from "@/components/logo";
import { DesktopNav, MobileTabBar, type NavItem } from "@/components/nav";
import { buttonClass } from "@/components/ui";

export async function Header() {
  const user = await getCurrentUser();
  const t = await getTranslations("nav");
  const role = user?.profile.role;

  let items: NavItem[] = [];
  if (!user) {
    items = [
      { href: "/jobs", label: t("findJobs"), icon: "search" },
      { href: "/how-it-works", label: t("howItWorks"), icon: "home" },
    ];
  } else if (role === "worker") {
    items = [
      { href: "/w", label: t("home"), icon: "home", exact: true },
      { href: "/jobs", label: t("findJobs"), icon: "search" },
      { href: "/w/applications", label: t("myApplications"), icon: "applications" },
      { href: "/w/saved", label: t("saved"), icon: "saved" },
      { href: "/w/profile", label: t("myProfile"), icon: "profile" },
    ];
  } else if (role === "employer") {
    items = [
      { href: "/e", label: t("dashboard"), icon: "home", exact: true },
      { href: "/e/jobs/new", label: t("postJob"), icon: "post" },
      { href: "/e/candidates", label: t("findStaff"), icon: "staff" },
      { href: "/e/team", label: t("myTeam"), icon: "team" },
      { href: "/e/business", label: t("business"), icon: "business" },
    ];
  }

  let unread = 0;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unread = count ?? 0;
  }

  const desktopItems = user?.profile.is_admin ? [...items, { href: "/admin", label: t("admin"), icon: "admin" as const }] : items;

  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper">
        <div className="site-x flex items-center justify-between gap-3 py-2.5">
          <Link href={user ? "/dashboard" : "/"} aria-label={t("home")} className="shrink-0 rounded-lg">
            <Wordmark />
          </Link>

          <DesktopNav items={desktopItems} label={t("main")} />

          <div className="flex items-center gap-1.5">
            <Suspense>
              <LanguageSwitcher />
            </Suspense>
            {user ? (
              <>
                {user.profile.is_admin && (
                  <Link href="/admin" aria-label={t("admin")} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-stone-200/70 md:hidden">
                    <Shield className="size-5" aria-hidden />
                  </Link>
                )}
                <Link
                  href="/notifications"
                  aria-label={unread ? t("notificationsUnread", { count: unread }) : t("notifications")}
                  className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-stone-200/70"
                >
                  <Bell className="size-5" aria-hidden strokeWidth={2.2} />
                  {unread > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex min-w-5 items-center justify-center rounded-full border-2 border-paper bg-orange-600 px-1 font-mono text-[10px] font-bold leading-4 text-cream">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                <form action={signOut}>
                  <button type="submit" aria-label={t("logout")} title={t("logout")} className="inline-flex size-10 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200/70 hover:text-ink">
                    <LogOut className="size-5" aria-hidden />
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-200/70 sm:inline-flex">
                  {t("login")}
                </Link>
                <Link href="/signup" className={buttonClass("primary", "min-h-10 px-3.5 py-1.5")}>
                  {t("signup")}
                </Link>
              </>
            )}
          </div>
        </div>
        {!user && (
          <nav aria-label={t("main")} className="site-x flex gap-1 pb-2 md:hidden">
            {[...items, { href: "/login", label: t("login"), icon: "profile" as const }].map((i) => (
              <Link key={i.href} href={i.href} className="rounded-full px-3 py-1 text-sm font-semibold text-stone-700 hover:bg-stone-200/70">
                {i.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {user && items.length > 0 && <MobileTabBar items={items} label={t("main")} />}
    </>
  );
}
