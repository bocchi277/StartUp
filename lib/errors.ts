import type { PostgrestError } from "@supabase/supabase-js";

// RPC functions raise short codes (see the migration). Map them to message keys
// in the "errors" namespace. Unknown errors are logged server-side only.
const KNOWN = new Set([
  "not_allowed", "not_authenticated", "role_already_set", "invalid_status",
  "application_closed", "interview_time_required", "invalid_terms",
  "placement_not_pending", "placement_closed", "invalid_end_date",
  "job_removed_by_admin", "only_admin_can_remove", "not_found",
]);

export function dbErrorKey(error: PostgrestError | null | undefined): string {
  if (!error) return "generic";
  if (KNOWN.has(error.message)) return error.message;
  if (error.code === "23505") return "duplicate";
  if (error.code === "42501") return "not_allowed";
  if (error.code === "23514" || error.code === "23502" || error.code === "22P02") return "invalidFields";
  console.error("[db]", error.code, error.message, error.details);
  return "generic";
}
