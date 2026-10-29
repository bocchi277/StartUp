import "server-only";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Tables<"profiles">;
};

// Reads the verified JWT claims, then the profile row. Cached per request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: userId,
    email: (data.claims.email as string | undefined) ?? null,
    profile,
  };
});

async function go(href: string): Promise<never> {
  const locale = await getLocale();
  return redirect({ href, locale });
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) return go("/login");
  return user;
}

export async function requireWorker(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.profile.role !== "worker") return go("/dashboard");
  return user;
}

export async function requireEmployer(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.profile.role !== "employer") return go("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.profile.is_admin) return go("/dashboard");
  return user;
}

// The signed-in employer's business, or null if onboarding isn't finished.
export const getMyBusiness = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  return data;
});

export async function requireBusiness() {
  const user = await requireEmployer();
  const business = await getMyBusiness();
  if (!business) return go("/onboarding");
  return { user, business };
}
