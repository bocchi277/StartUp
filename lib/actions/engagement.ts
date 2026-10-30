"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyBusiness, requireBusiness, requireUser, requireWorker } from "@/lib/auth";
import { dbErrorKey } from "@/lib/errors";
import { PHOTO_PATH, type PhotoBucket } from "@/lib/storage";
import { formToObject, invalid, type ActionState } from "@/lib/validation";

// ---------------------------------------------------------------- photos
// The browser uploads the resized file straight to Storage (RLS limits it to the
// user's own folder); this action only records the path and removes the old file.
export async function savePhoto(kind: "worker" | "business", path: string): Promise<ActionState> {
  const user = await requireUser();
  if (!PHOTO_PATH.test(path) || !path.startsWith(`${user.id}/`)) return { error: "invalidFields" };
  const supabase = await createClient();
  const bucket: PhotoBucket = kind === "worker" ? "avatars" : "business-photos";

  let old: string | null = null;
  if (kind === "worker") {
    if (user.profile.role !== "worker") return { error: "not_allowed" };
    const { data } = await supabase.from("worker_profiles").select("photo_url").eq("user_id", user.id).maybeSingle();
    if (!data) return { error: "completeProfileFirst" };
    old = data.photo_url;
    const { error } = await supabase.from("worker_profiles").update({ photo_url: path }).eq("user_id", user.id);
    if (error) return { error: dbErrorKey(error) };
  } else {
    const business = await getMyBusiness();
    if (!business) return { error: "not_allowed" };
    old = business.photo_url;
    const { error } = await supabase.from("businesses").update({ photo_url: path }).eq("id", business.id);
    if (error) return { error: dbErrorKey(error) };
  }
  if (old && old !== path) await supabase.storage.from(bucket).remove([old]);
  refresh();
  return { ok: true, message: "photoSaved" };
}

// ---------------------------------------------------------------- saved jobs
export async function toggleSavedJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireWorker();
  const jobId = z.uuid().safeParse(formData.get("job_id"));
  if (!jobId.success) return { error: "invalidFields" };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("saved_jobs").select("job_id").eq("worker_id", user.id).eq("job_id", jobId.data).maybeSingle();
  const { error } = existing
    ? await supabase.from("saved_jobs").delete().eq("worker_id", user.id).eq("job_id", jobId.data)
    : await supabase.from("saved_jobs").insert({ worker_id: user.id, job_id: jobId.data });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- invites
const inviteSchema = z.object({
  job_id: z.uuid(),
  worker_id: z.uuid(),
  message: z.string().trim().max(300).optional(),
});

export async function inviteWorker(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireBusiness();
  const parsed = inviteSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("invite_worker", {
    p_job_id: parsed.data.job_id,
    p_worker_id: parsed.data.worker_id,
    p_message: parsed.data.message || undefined,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "inviteSent" };
}

// ---------------------------------------------------------------- reviews
const yesNo = z.preprocess((v) => (v === "yes" ? true : v === "no" ? false : undefined), z.boolean().optional());
const reviewSchema = z.object({
  placement_id: z.uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  would_return: yesNo.pipe(z.boolean()),
  terms_matched: yesNo,
  paid_on_time: yesNo,
  comment: z.string().trim().max(1000).optional(),
});

export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = reviewSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_placement_id: v.placement_id,
    p_rating: v.rating,
    p_would_return: v.would_return,
    p_terms_matched: v.terms_matched,
    p_paid_on_time: v.paid_on_time,
    p_comment: v.comment || undefined,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "reviewSent" };
}

export async function respondToReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = z.object({ review_id: z.uuid(), response: z.string().trim().min(1).max(1000) }).safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_review", {
    p_review_id: parsed.data.review_id,
    p_response: parsed.data.response,
  });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true, message: "saved" };
}

// ---------------------------------------------------------------- notifications
export async function markAllNotificationsRead(): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  refresh();
  return { ok: true };
}

// Marks one notification read and follows its link (links are app paths without locale).
export async function openNotification(formData: FormData) {
  const user = await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  const locale = await getLocale();
  if (!id.success) return redirect({ href: "/notifications", locale });
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("link")
    .maybeSingle();
  const link = data?.link && /^\/[A-Za-z0-9/_?=&.-]*$/.test(data.link) && !data.link.startsWith("//") ? data.link : "/notifications";
  return redirect({ href: link, locale });
}
