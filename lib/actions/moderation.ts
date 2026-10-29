"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import { dbErrorKey } from "@/lib/errors";
import { JOB_STATUSES, REPORT_STATUSES, VERIFICATION_LEVELS } from "@/lib/constants";
import { formToObject, invalid, reportSchema, type ActionState } from "@/lib/validation";
import type { Enums } from "@/types/database";

export async function createReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = reportSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert(parsed.data);
  if (error) return { error: dbErrorKey(error) };
  return { ok: true, message: "reportSent" };
}

function oneOf<T extends readonly string[]>(values: T, v: FormDataEntryValue | null): T[number] | null {
  return typeof v === "string" && (values as readonly string[]).includes(v) ? (v as T[number]) : null;
}

export async function adminSetVerification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const level = oneOf(VERIFICATION_LEVELS, formData.get("level"));
  if (!level) return { error: "invalidFields" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_business_verification", {
    p_business_id: String(formData.get("business_id") ?? ""),
    p_level: level as Enums<"verification_level">,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "saved" };
}

export async function adminUpdateReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const status = oneOf(REPORT_STATUSES, formData.get("status"));
  if (!status) return { error: "invalidFields" };
  const note = String(formData.get("note") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_report", {
    p_report_id: String(formData.get("report_id") ?? ""),
    p_status: status as Enums<"report_status">,
    p_note: note || undefined,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "saved" };
}

export async function adminSetJobStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const status = oneOf(JOB_STATUSES, formData.get("status"));
  if (!status) return { error: "invalidFields" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_job_status", {
    p_job_id: String(formData.get("job_id") ?? ""),
    p_status: status as Enums<"job_status">,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "saved" };
}
