"use server";

import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWorker } from "@/lib/auth";
import { dbErrorKey } from "@/lib/errors";
import {
  formToObject, historySchema, invalid, workerProfileSchema,
  WORKER_ARRAY_FIELDS, type ActionState,
} from "@/lib/validation";

export async function saveWorkerProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireWorker();
  const parsed = workerProfileSchema.safeParse(formToObject(formData, WORKER_ARRAY_FIELDS));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const supabase = await createClient();

  const { error: profileError } = await supabase.from("worker_profiles").upsert({
    user_id: user.id,
    headline: v.headline,
    about: v.about,
    state: v.state,
    city: v.city,
    pincode: v.pincode,
    primary_role_id: v.primary_role_id,
    secondary_role_ids: v.secondary_role_ids.filter((id) => id !== v.primary_role_id),
    cuisine_ids: v.cuisine_ids,
    skill_ids: v.skill_ids,
    total_experience_months: v.experience_years * 12 + v.experience_months,
    expected_salary_min: v.expected_salary_min,
    expected_salary_max: v.expected_salary_max,
    pay_frequency: v.pay_frequency,
    preferred_shift: v.preferred_shift,
    employment_types: v.employment_types,
    languages_spoken: v.languages_spoken,
    open_to_work: v.open_to_work,
    needs_accommodation: v.needs_accommodation,
    willing_to_relocate: v.willing_to_relocate,
    available_from: v.available_from,
  });
  if (profileError) return { error: dbErrorKey(profileError) };

  const { error: contactError } = await supabase.from("worker_contacts").upsert({
    user_id: user.id,
    phone: v.phone,
    email: user.email,
    whatsapp_opt_in: v.whatsapp_opt_in,
  });
  if (contactError) return { error: dbErrorKey(contactError) };

  await supabase
    .from("profiles")
    .update({ full_name: v.full_name, onboarding_complete: true })
    .eq("id", user.id);

  if (formData.get("after") === "onboarding") {
    redirect({ href: "/w", locale: await getLocale() });
  }
  refresh();
  return { ok: true, message: "saved" };
}

export async function addHistory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireWorker();
  const parsed = historySchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("employment_history").insert({ worker_id: user.id, ...parsed.data });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "saved" };
}

export async function deleteHistory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireWorker();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  // RLS only allows deleting your own self-reported rows.
  const { error } = await supabase.from("employment_history").delete().eq("id", id);
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}
