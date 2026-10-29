import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getMyBusiness, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Sends each user to the right place based on role and onboarding state.
export default async function DashboardRouter() {
  const user = await requireUser();
  const locale = await getLocale();
  const role = user.profile.role;

  if (role === "employer") {
    const business = await getMyBusiness();
    return redirect({ href: business ? "/e" : "/onboarding", locale });
  }
  if (role === "worker") {
    const supabase = await createClient();
    const { data } = await supabase.from("worker_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
    return redirect({ href: data ? "/w" : "/onboarding", locale });
  }
  return redirect({ href: "/onboarding", locale });
}
