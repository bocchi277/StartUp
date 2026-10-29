import type { Enums } from "@/types/database";

// Columns needed to render a job card. Keep the string literal so supabase-js can infer types.
export const JOB_CARD_SELECT =
  "id, title, salary_min, salary_max, pay_frequency, shift_start, shift_end, weekly_offs, meals, accommodation, employment_type, city, state, status, last_confirmed_at, expires_at, created_at, role_id, cuisine_ids, openings, businesses(id, name, verification_level), job_roles(name_en, name_hi)" as const;

export type JobCardData = {
  id: string;
  title: string;
  salary_min: number;
  salary_max: number;
  pay_frequency: Enums<"pay_frequency">;
  shift_start: string;
  shift_end: string;
  weekly_offs: number;
  meals: Enums<"meals_provided">;
  accommodation: boolean;
  employment_type: Enums<"employment_type">;
  city: string;
  state: string;
  status: Enums<"job_status">;
  last_confirmed_at: string;
  expires_at: string;
  openings: number;
  cuisine_ids: number[];
  businesses: { id: string; name: string; verification_level: Enums<"verification_level"> } | null;
  job_roles: { name_en: string; name_hi: string } | null;
};
