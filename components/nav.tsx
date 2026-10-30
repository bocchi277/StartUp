"use client";

import {
  Bookmark, Briefcase, Building2, ClipboardList, LayoutDashboard, PlusCircle, Search, Shield,
  UserRound, UsersRound, type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/components/ui";

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

const ICONS = {
  home: LayoutDashboard,
  search: Search,
  applications: ClipboardList,
  saved: Bookmark,
  profile: UserRound,
  post: PlusCircle,
  staff: UsersRound,
  team: Briefcase,
  business: Building2,
  admin: Shield,
} satisfies Record<string, LucideIcon>;

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DesktopNav({ items, label }: { items: NavItem[]; label: string }) {
  const isActive = useIsActive();
  return (
    <nav aria-label={label} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  active ? "bg-ink text-cream" : "text-stone-700 hover:bg-stone-200/70 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Thumb-reachable tab bar for signed-in users on phones. */
export function MobileTabBar({ items, label }: { items: NavItem[]; label: string }) {
  const isActive = useIsActive();
  return (
    <nav aria-label={label} className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-ink pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10.5px] font-semibold leading-tight",
                  active ? "text-haldi" : "text-stone-300",
                )}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-haldi text-ink")}>
                  <Icon className="size-[18px]" aria-hidden strokeWidth={2.3} />
                </span>
                <span className="w-full truncate text-center">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
