import {
  Bike, Briefcase, CakeSlice, Carrot, ChefHat, ClipboardList, Coffee, ConciergeBell, CookingPot,
  Flame, Receipt, Soup, Sparkles, Users, Utensils, UtensilsCrossed, Wine, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  indian_chef: CookingPot,
  tandoor_chef: Flame,
  chinese_chef: Soup,
  continental_chef: UtensilsCrossed,
  south_indian_chef: Utensils,
  baker_pastry_chef: CakeSlice,
  head_chef: ChefHat,
  commis_cook: Carrot,
  kitchen_helper: Carrot,
  dishwasher_cleaner: Sparkles,
  barista: Coffee,
  waiter_steward: ConciergeBell,
  captain_supervisor: Users,
  cashier: Receipt,
  bartender: Wine,
  delivery_staff: Bike,
  restaurant_manager: ClipboardList,
};

export function RoleIcon({ slug, className }: { slug?: string | null; className?: string }) {
  const Icon = (slug && ICONS[slug]) || Briefcase;
  return <Icon className={className ?? "size-4"} aria-hidden strokeWidth={2.2} />;
}
