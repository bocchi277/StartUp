"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness, requireUser, requireWorker } from "@/lib/auth";
import { dbErrorKey } from "@/lib/errors";
import { istLocalToIso } from "@/lib/format";
import {
  applySchema, endPlacementSchema, formToObject, hireSchema, invalid,
  noteSchema, statusSchema, type ActionState,
} from "@/lib/validation";

// ---------------------------------------------------------------- worker side
export async function applyToJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireWorker();
  const parsed = applySchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("worker_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!profile) return { error: "completeProfileFirst" };

  const { error } = await supabase.from("applications").insert({
    job_id: parsed.data.job_id,
    worker_id: user.id,
    cover_note: parsed.data.cover_note,
  });
  if (error) {
    if (error.code === "23505") return { error: "alreadyApplied" };
    if (error.code === "42501") return { error: "jobClosed" };
    return { error: dbErrorKey(error) };
  }
  refresh();
  return { ok: true, message: "applied" };
}

export async function withdrawApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireWorker();
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_application", {
    p_application_id: String(formData.get("application_id") ?? ""),
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}

export async function confirmJoining(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireWorker();
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_joining", {
    p_placement_id: String(formData.get("placement_id") ?? ""),
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "joined" };
}

// Either side can end a placement (pending -> cancelled, active -> ended).
export async function endPlacement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = endPlacementSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_placement", {
    p_placement_id: parsed.data.placement_id,
    p_end_date: parsed.data.end_date as string,
    p_reason: parsed.data.reason ?? undefined,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- employer side
export async function setApplicationStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const parsed = statusSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { application_id, status, interview_at, interview_note } = parsed.data;

  let interviewIso: string | undefined;
  if (status === "interview") {
    interviewIso = interview_at ? istLocalToIso(interview_at) ?? undefined : undefined;
    if (!interviewIso) return { error: "interview_time_required", fields: ["interview_at"] };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_application_status", {
    p_application_id: application_id,
    p_status: status,
    p_interview_at: interviewIso,
    p_interview_note: interview_note ?? undefined,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}

export async function hireApplicant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const parsed = hireSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("hire_applicant", {
    p_application_id: parsed.data.application_id,
    p_agreed_salary: parsed.data.agreed_salary,
    p_pay_frequency: parsed.data.pay_frequency,
    p_start_date: parsed.data.start_date,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "hired" };
}

export async function addNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const parsed = noteSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("application_notes").insert(parsed.data);
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}

export async function deleteNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const supabase = await createClient();
  const { error } = await supabase.from("application_notes").delete().eq("id", String(formData.get("note_id") ?? ""));
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}
