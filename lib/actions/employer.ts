"use server";

import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyBusiness, requireBusiness, requireEmployer } from "@/lib/auth";
import { dbErrorKey } from "@/lib/errors";
import {
  businessSchema, formToObject, invalid, jobSchema,
  JOB_ARRAY_FIELDS, type ActionState,
} from "@/lib/validation";

// ---------------------------------------------------------------- business
export async function saveBusiness(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireEmployer();
  const parsed = businessSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const existing = await getMyBusiness();

  const { error } = existing
    ? await supabase.from("businesses").update(parsed.data).eq("id", existing.id)
    : await supabase.from("businesses").insert({ ...parsed.data, owner_id: user.id });
  if (error) return { error: dbErrorKey(error) };

  if (!existing) {
    await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
    redirect({ href: "/e", locale: await getLocale() });
  }
  refresh();
  return { ok: true, message: "saved" };
}

// ---------------------------------------------------------------- jobs
export async function createJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { business } = await requireBusiness();
  const parsed = jobSchema.safeParse(formToObject(formData, JOB_ARRAY_FIELDS));
  if (!parsed.success) return invalid(parsed.error);
  const { intent, ...job } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...job, business_id: business.id, status: intent === "publish" ? "open" : "draft" })
    .select("id")
    .single();
  if (error) return { error: dbErrorKey(error) };

  redirect({ href: `/e/jobs/${data.id}`, locale: await getLocale() });
  return {};
}

export async function updateJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const jobId = String(formData.get("job_id") ?? "");
  const parsed = jobSchema.safeParse(formToObject(formData, JOB_ARRAY_FIELDS));
  if (!parsed.success) return invalid(parsed.error);
  const { intent, ...job } = parsed.data;

  const supabase = await createClient();
  const { data: current } = await supabase.from("jobs").select("status").eq("id", jobId).maybeSingle();
  if (!current) return { error: "not_found" };

  const status = intent === "publish" && current.status === "draft" ? "open" : current.status;
  const { error } = await supabase.from("jobs").update({ ...job, status }).eq("id", jobId);
  if (error) return { error: dbErrorKey(error) };

  redirect({ href: `/e/jobs/${jobId}`, locale: await getLocale() });
  return {};
}

const OWNER_STATUSES = ["open", "paused", "closed"] as const;

export async function setJobStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const jobId = String(formData.get("job_id") ?? "");
  const status = formData.get("status");
  if (!OWNER_STATUSES.includes(status as (typeof OWNER_STATUSES)[number])) return { error: "invalidFields" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ status: status as (typeof OWNER_STATUSES)[number] })
    .eq("id", jobId)
    .select("id");
  if (error) return { error: dbErrorKey(error) };
  if (!data?.length) return { error: "not_found" };
  refresh();
  return { ok: true };
}

// "Still hiring?" — keeps the listing fresh for another 30 days.
export async function confirmStillHiring(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const jobId = String(formData.get("job_id") ?? "");
  const now = new Date();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      last_confirmed_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
    })
    .eq("id", jobId)
    .select("id");
  if (error) return { error: dbErrorKey(error) };
  if (!data?.length) return { error: "not_found" };
  refresh();
  return { ok: true, message: "refreshed" };
}

export async function duplicateJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { business } = await requireBusiness();
  const jobId = String(formData.get("job_id") ?? "");
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job || job.business_id !== business.id) return { error: "not_found" };

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      business_id: business.id,
      role_id: job.role_id,
      title: job.title,
      description: job.description,
      openings: job.openings,
      min_experience_months: job.min_experience_months,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      pay_frequency: job.pay_frequency,
      shift_start: job.shift_start,
      shift_end: job.shift_end,
      weekly_offs: job.weekly_offs,
      meals: job.meals,
      accommodation: job.accommodation,
      tips_info: job.tips_info,
      deductions: job.deductions,
      employment_type: job.employment_type,
      state: job.state,
      city: job.city,
      cuisine_ids: job.cuisine_ids,
      skill_ids: job.skill_ids,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) return { error: dbErrorKey(error) };
  redirect({ href: `/e/jobs/${data.id}/edit`, locale: await getLocale() });
  return {};
}
