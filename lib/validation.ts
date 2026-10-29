import { z } from "zod";
import {
  BUSINESS_CATEGORIES, EMPLOYMENT_TYPES, MEALS, PAY_FREQUENCIES,
  REPORT_REASONS, SHIFT_PREFERENCES, SPOKEN_LANGUAGES, WEEKLY_OFFS,
} from "@/lib/constants";
import { INDIAN_STATES } from "@/lib/india";

// ---------------------------------------------------------------------------
// Action result shared by every form. `error` and field values are i18n keys
// under the "errors" namespace, translated by the client form.
// ---------------------------------------------------------------------------
export type ActionState = {
  ok?: boolean;
  error?: string;
  fields?: string[];
  message?: string;
};

export function invalid(error: z.ZodError): ActionState {
  const fields = Array.from(new Set(error.issues.map((i) => String(i.path[0] ?? ""))));
  return { error: "invalidFields", fields };
}

// FormData -> plain object. Repeated keys (checkbox groups) become arrays.
export function formToObject(formData: FormData, arrayKeys: string[] = []) {
  const obj: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    obj[key] = arrayKeys.includes(key) ? formData.getAll(key) : formData.get(key);
  }
  for (const key of arrayKeys) if (!(key in obj)) obj[key] = [];
  return obj;
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional()).transform((v) => v || null);
const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const optionalInt = (min: number, max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max).optional()).transform((v) => v ?? null);
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const idArray = z.array(z.coerce.number().int().positive()).max(30);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalDate = z.preprocess(emptyToUndefined, date.optional()).transform((v) => v ?? null);
const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const uuid = z.uuid();

export const phoneSchema = z.string().trim().transform((v) => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{10,13}$/));
const optionalPhone = z.preprocess(emptyToUndefined, phoneSchema.optional()).transform((v) => v ?? null);
const pincode = z.preprocess(emptyToUndefined, z.string().trim().regex(/^[1-9][0-9]{5}$/).optional()).transform((v) => v ?? null);
const state = z.enum(INDIAN_STATES as [string, ...string[]]);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const signUpSchema = z.object({
  full_name: text(2, 120),
  email: z.email().max(254),
  password: z.string().min(8).max(72),
  role: z.enum(["worker", "employer"]),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Worker profile
// ---------------------------------------------------------------------------
export const workerProfileSchema = z
  .object({
    full_name: text(2, 120),
    headline: optionalText(120),
    about: optionalText(1000),
    state,
    city: text(2, 80),
    pincode,
    primary_role_id: z.coerce.number().int().positive(),
    secondary_role_ids: idArray,
    cuisine_ids: idArray,
    skill_ids: idArray,
    experience_years: int(0, 50),
    experience_months: int(0, 11),
    expected_salary_min: optionalInt(0, 1_000_000),
    expected_salary_max: optionalInt(0, 1_000_000),
    pay_frequency: z.enum(PAY_FREQUENCIES),
    preferred_shift: z.enum(SHIFT_PREFERENCES),
    employment_types: z.array(z.enum(EMPLOYMENT_TYPES)).min(1),
    languages_spoken: z.array(z.enum(SPOKEN_LANGUAGES)).max(13),
    open_to_work: checkbox,
    needs_accommodation: checkbox,
    willing_to_relocate: checkbox,
    available_from: optionalDate,
    phone: optionalPhone,
    whatsapp_opt_in: checkbox,
  })
  .refine(
    (v) => v.expected_salary_min == null || v.expected_salary_max == null || v.expected_salary_max >= v.expected_salary_min,
    { path: ["expected_salary_max"] },
  );

export const WORKER_ARRAY_FIELDS = ["secondary_role_ids", "cuisine_ids", "skill_ids", "employment_types", "languages_spoken"];

export const historySchema = z
  .object({
    employer_name: text(2, 120),
    role_id: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()).transform((v) => v ?? null),
    job_title: optionalText(120),
    start_date: date,
    end_date: optionalDate,
    reason_for_leaving: optionalText(500),
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, { path: ["end_date"] });

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------
export const businessSchema = z.object({
  name: text(2, 120),
  category: z.enum(BUSINESS_CATEGORIES),
  description: optionalText(1500),
  address: text(5, 300),
  state,
  city: text(2, 80),
  pincode,
  phone: phoneSchema,
});

// ---------------------------------------------------------------------------
// Jobs: every term is mandatory except tips, description and joining date.
// ---------------------------------------------------------------------------
export const jobSchema = z
  .object({
    role_id: z.coerce.number().int().positive(),
    title: text(3, 120),
    description: optionalText(3000),
    openings: int(1, 100),
    min_experience_months: int(0, 600),
    salary_min: int(1, 1_000_000),
    salary_max: int(1, 1_000_000),
    pay_frequency: z.enum(PAY_FREQUENCIES),
    shift_start: time,
    shift_end: time,
    weekly_offs: z.enum(WEEKLY_OFFS).transform(Number),
    meals: z.enum(MEALS),
    accommodation: z.enum(["yes", "no"]).transform((v) => v === "yes"),
    tips_info: optionalText(300),
    deductions: text(1, 500),
    employment_type: z.enum(EMPLOYMENT_TYPES),
    joining_date: optionalDate,
    state,
    city: text(2, 80),
    cuisine_ids: idArray,
    skill_ids: idArray,
    intent: z.enum(["draft", "publish"]),
  })
  .refine((v) => v.salary_max >= v.salary_min, { path: ["salary_max"] });

export const JOB_ARRAY_FIELDS = ["cuisine_ids", "skill_ids"];

// ---------------------------------------------------------------------------
// Hiring
// ---------------------------------------------------------------------------
export const applySchema = z.object({
  job_id: uuid,
  cover_note: optionalText(500),
});

export const statusSchema = z.object({
  application_id: uuid,
  status: z.enum(["shortlisted", "interview", "offered", "rejected"]),
  interview_at: z.preprocess(emptyToUndefined, z.string().optional()),
  interview_note: optionalText(500),
});

export const hireSchema = z.object({
  application_id: uuid,
  agreed_salary: int(1, 1_000_000),
  pay_frequency: z.enum(PAY_FREQUENCIES),
  start_date: date,
});

export const noteSchema = z.object({
  application_id: uuid,
  body: text(1, 1000),
});

export const endPlacementSchema = z.object({
  placement_id: uuid,
  end_date: optionalDate,
  reason: optionalText(500),
});

export const reportSchema = z.object({
  target_type: z.enum(["job", "business", "worker"]),
  target_id: uuid,
  reason: z.enum(REPORT_REASONS),
  details: optionalText(1000),
});
