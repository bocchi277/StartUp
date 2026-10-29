const IST = "Asia/Kolkata";

export function formatRupees(amount: number | null | undefined, locale: string) {
  if (amount == null) return "";
  return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSalaryRange(min: number | null, max: number | null, locale: string) {
  if (min == null && max == null) return "";
  if (min != null && max != null && min !== max) return `${formatRupees(min, locale)} – ${formatRupees(max, locale)}`;
  return formatRupees(min ?? max, locale);
}

// "13:30:00" -> "1:30 PM"
export function formatTime(time: string | null | undefined, locale: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "";
  // Plain dates ("2026-11-01") are calendar dates, so don't shift them by timezone.
  const isPlainDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: isPlainDate ? "UTC" : IST,
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: IST,
  }).format(new Date(value));
}

export function daysAgo(value: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
}

// <input type="datetime-local"> has no timezone; all users are in India, so read it as IST.
export function istLocalToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function todayIst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());
}

export function experienceLabel(months: number) {
  return { years: Math.floor(months / 12), months: months % 12 };
}
