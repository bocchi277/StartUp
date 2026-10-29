import { Constants, type Enums } from "@/types/database";

export const E = Constants.public.Enums;

export const PAY_FREQUENCIES = E.pay_frequency;
export const SHIFT_PREFERENCES = E.shift_preference;
export const EMPLOYMENT_TYPES = E.employment_type;
export const BUSINESS_CATEGORIES = E.business_category;
export const MEALS = E.meals_provided;
export const APPLICATION_STATUSES = E.application_status;
export const REPORT_REASONS = E.report_reason;
export const REPORT_STATUSES = E.report_status;
export const VERIFICATION_LEVELS = E.verification_level;
export const JOB_STATUSES = E.job_status;
export const WEEKLY_OFFS = ["0", "0.5", "1", "1.5", "2"] as const;

export const SPOKEN_LANGUAGES = [
  "hindi", "english", "bengali", "marathi", "telugu", "tamil", "gujarati",
  "kannada", "malayalam", "punjabi", "odia", "urdu", "nepali",
] as const;

export type ApplicationStatus = Enums<"application_status">;

// Pipeline moves an employer can make from each status (hiring is a separate form).
export const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["shortlisted", "rejected"],
  shortlisted: ["interview", "offered", "rejected"],
  interview: ["interview", "offered", "rejected"], // "interview" again = reschedule
  offered: ["rejected"],
  hired: [],
  rejected: ["shortlisted"],
  withdrawn: [],
};

export const PAGE_SIZE = 20;
