import "server-only";
import { cache } from "react";
import { createAnonClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type TaxonomyItem = { id: number; slug: string; name_en: string; name_hi: string; category?: string };

export type Taxonomy = {
  roles: Tables<"job_roles">[];
  cuisines: Tables<"cuisines">[];
  skills: Tables<"skills">[];
};

export const getTaxonomy = cache(async (): Promise<Taxonomy> => {
  const supabase = createAnonClient();
  const [roles, cuisines, skills] = await Promise.all([
    supabase.from("job_roles").select("*").order("sort_order"),
    supabase.from("cuisines").select("*").order("sort_order"),
    supabase.from("skills").select("*").order("sort_order"),
  ]);
  return {
    roles: roles.data ?? [],
    cuisines: cuisines.data ?? [],
    skills: skills.data ?? [],
  };
});

export function localName(item: { name_en: string; name_hi: string } | null | undefined, locale: string) {
  if (!item) return "";
  return locale === "hi" ? item.name_hi : item.name_en;
}

export function namesFor(ids: number[] | null | undefined, items: TaxonomyItem[], locale: string) {
  if (!ids?.length) return [];
  const byId = new Map(items.map((i) => [i.id, i]));
  return ids.map((id) => localName(byId.get(id), locale)).filter(Boolean);
}
