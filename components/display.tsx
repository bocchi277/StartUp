import { getLocale, getTranslations } from "next-intl/server";
import { BadgeCheck, CalendarOff, Clock, House, MapPin, Store, Users, Utensils } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge, Stamp, cn, type BadgeTone } from "@/components/ui";
import { RoleIcon } from "@/components/role-icon";
import { daysAgo, experienceLabel, formatDate, formatSalaryRange, formatTime } from "@/lib/format";
import { localName } from "@/lib/taxonomy";
import type { JobCardData } from "@/lib/queries";
import type { Enums, Tables } from "@/types/database";

// ---------------------------------------------------------------- verification
export async function VerificationBadge({ level, size = "sm" }: { level: Enums<"verification_level">; size?: "sm" | "lg" }) {
  const t = await getTranslations("enums.verification_level");
  if (level === "business_verified") {
    return (
      <Stamp tone="green" className={size === "lg" ? "text-xs" : undefined}>
        <BadgeCheck className="size-3.5" aria-hidden /> {t(level)}
      </Stamp>
    );
  }
  return <Badge tone={level === "email_verified" ? "blue" : "neutral"}>{t(level)}</Badge>;
}

// ---------------------------------------------------------------- statuses
const STATUS_TONE: Record<Enums<"application_status">, BadgeTone> = {
  applied: "blue",
  shortlisted: "orange",
  interview: "yellow",
  offered: "kokum",
  hired: "green",
  rejected: "red",
  withdrawn: "neutral",
};

export async function ApplicationStatusBadge({ status }: { status: Enums<"application_status"> }) {
  const t = await getTranslations("enums.application_status");
  if (status === "hired") return <Stamp tone="green">{t(status)}</Stamp>;
  return <Badge tone={STATUS_TONE[status]}>{t(status)}</Badge>;
}

const JOB_STATUS_TONE: Record<Enums<"job_status">, BadgeTone> = {
  draft: "neutral",
  open: "green",
  paused: "yellow",
  closed: "neutral",
  filled: "blue",
  removed: "red",
};

export async function JobStatusBadge({ status, expiresAt }: { status: Enums<"job_status">; expiresAt?: string }) {
  const t = await getTranslations("enums.job_status");
  const tj = await getTranslations("jobs");
  if (status === "open" && expiresAt && new Date(expiresAt) < new Date()) {
    return <Badge tone="red">{tj("expired")}</Badge>;
  }
  return <Badge tone={JOB_STATUS_TONE[status]}>{t(status)}</Badge>;
}

export function Freshness({ days, label }: { days: number; label: string }) {
  const dot = days <= 3 ? "bg-green-500" : days <= 14 ? "bg-haldi" : "bg-stone-400";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", dot, days <= 3 && "animate-pulse")} aria-hidden />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------- job card (kitchen ticket)
export async function JobCard({ job, href, className }: { job: JobCardData; href?: string; className?: string }) {
  const locale = await getLocale();
  const t = await getTranslations("jobs");
  const te = await getTranslations("enums");
  const days = daysAgo(job.last_confirmed_at);
  const ticketNo = job.id.slice(0, 4).toUpperCase();

  return (
    <article className={cn("ticket ticket-hover flex h-full flex-col", className)}>
      <Link href={href ?? `/jobs/${job.id}`} className="flex h-full flex-col rounded-[12px] focus-visible:outline-offset-4">
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
          <span className="eyebrow flex min-w-0 items-center gap-1.5 text-orange-700">
            <RoleIcon slug={job.job_roles?.slug} className="size-3.5 shrink-0" />
            <span className="truncate">{localName(job.job_roles, locale)}</span>
          </span>
          <span className="font-mono text-[11px] text-stone-500">KOT #{ticketNo}</span>
        </div>

        <div className="px-4 pb-3 pt-1.5">
          <h3 className="font-display text-xl font-semibold leading-snug text-ink">{job.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-stone-600">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Store className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{job.businesses?.name}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {job.city}
            </span>
          </p>
        </div>

        <div className="ticket-tear" aria-hidden />

        <div className="flex flex-wrap items-end justify-between gap-2 px-4 pb-2 pt-3">
          <div>
            <p className="whitespace-nowrap font-display text-[1.35rem] font-bold leading-none text-ink">
              {formatSalaryRange(job.salary_min, job.salary_max, locale)}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-stone-500">{te(`payPer.${job.pay_frequency}`)}</p>
          </div>
          {job.businesses?.verification_level === "business_verified" && <VerificationBadge level="business_verified" />}
        </div>

        <ul className="flex flex-wrap gap-1.5 px-4 pb-3.5">
          <li className="chip">
            <Clock className="size-3" aria-hidden /> {formatTime(job.shift_start, locale)}–{formatTime(job.shift_end, locale)}
          </li>
          <li className={cn("chip", job.weekly_offs === 0 && "border-red-200 bg-red-50 text-red-700")}>
            <CalendarOff className="size-3" aria-hidden /> {t("weeklyOffsShort", { count: job.weekly_offs })}
          </li>
          {job.meals !== "none" && (
            <li className="chip border-green-200 bg-green-50 text-green-700">
              <Utensils className="size-3" aria-hidden /> {te(`meals.${job.meals}`)}
            </li>
          )}
          {job.accommodation && (
            <li className="chip border-green-200 bg-green-50 text-green-700">
              <House className="size-3" aria-hidden /> {t("accommodation")}
            </li>
          )}
          <li className="chip">{te(`employment_type.${job.employment_type}`)}</li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 border-t-2 border-dashed border-stone-200 px-4 py-2.5 font-mono text-[11px] text-stone-600">
          <Freshness days={days} label={days === 0 ? t("activeToday") : t("activeDaysAgo", { days })} />
          {job.openings > 1 && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" aria-hidden /> {t("openingsShort", { count: job.openings })}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

// ---------------------------------------------------------------- full terms (menu card)
export async function TermsBlock({
  job, compact,
}: {
  job: Pick<
    Tables<"jobs">,
    | "salary_min" | "salary_max" | "pay_frequency" | "shift_start" | "shift_end" | "weekly_offs"
    | "meals" | "accommodation" | "tips_info" | "deductions" | "employment_type" | "joining_date"
    | "openings" | "min_experience_months"
  >;
  compact?: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations("terms");
  const te = await getTranslations("enums");
  const exp = experienceLabel(job.min_experience_months);

  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: t("salary"), value: `${formatSalaryRange(job.salary_min, job.salary_max, locale)} ${te(`payPer.${job.pay_frequency}`)}`, strong: true },
    { label: t("shift"), value: `${formatTime(job.shift_start, locale)} – ${formatTime(job.shift_end, locale)}` },
    { label: t("weeklyOffs"), value: t("weeklyOffsValue", { count: job.weekly_offs }) },
    { label: t("meals"), value: te(`meals.${job.meals}`) },
    { label: t("accommodation"), value: job.accommodation ? t("provided") : t("notProvided") },
    { label: t("deductions"), value: job.deductions },
    { label: t("tips"), value: job.tips_info || t("notMentioned") },
    { label: t("employmentType"), value: te(`employment_type.${job.employment_type}`) },
    { label: t("openings"), value: String(job.openings) },
    { label: t("minExperience"), value: job.min_experience_months ? t("experienceValue", exp) : t("freshersWelcome") },
    { label: t("joining"), value: job.joining_date ? formatDate(job.joining_date, locale) : t("asSoonAsPossible") },
  ];

  return (
    <section className="ticket overflow-hidden" aria-labelledby="terms-title">
      <div className="bg-ink px-5 py-4 text-center text-cream">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-haldi">{t("menuEyebrow")}</p>
        <h2 id="terms-title" className="font-display-wonky mt-1 text-3xl">{t("title")}</h2>
      </div>
      <div className="ticket-tear ticket-tear-on-ink" aria-hidden />
      <dl className={cn("space-y-3 px-5 py-5", compact && "space-y-2 py-4")}>
        {rows.map((row) => (
          <div key={row.label} className="menu-row">
            <dt className="shrink-0 text-sm font-semibold text-stone-700">{row.label}</dt>
            <span className="leader" aria-hidden />
            <dd className={cn("max-w-[60%] text-right text-ink", row.strong ? "font-display text-lg font-bold" : "font-mono text-sm")}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t-2 border-dashed border-stone-200 px-5 py-3 text-center font-mono text-[11px] leading-relaxed text-stone-600">
        {t("footer")}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------- work history
type HistoryRow = Pick<
  Tables<"employment_history">,
  "id" | "employer_name" | "job_title" | "role_id" | "start_date" | "end_date" | "reason_for_leaving" | "source"
>;

export async function HistoryList({
  rows, roles, renderActions,
}: {
  rows: HistoryRow[];
  roles: Tables<"job_roles">[];
  renderActions?: (row: HistoryRow) => React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations("history");
  if (!rows.length) return <p className="text-sm text-stone-600">{t("empty")}</p>;
  const roleById = new Map(roles.map((r) => [r.id, r]));

  return (
    <ol className="relative space-y-4 border-l-2 border-dashed border-stone-300 pl-5">
      {rows.map((row) => {
        const verified = row.source === "platform_verified";
        return (
          <li key={row.id} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[29px] top-1.5 size-4 rounded-full border-2 border-ink",
                verified ? "bg-green-500" : "bg-cream",
              )}
            />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{row.employer_name}</p>
                <p className="text-sm text-stone-600">
                  {[row.job_title, localName(roleById.get(row.role_id ?? -1), locale)].filter(Boolean).join(" · ")}
                </p>
                <p className="font-mono text-xs text-stone-500">
                  {formatDate(row.start_date, locale)} → {row.end_date ? formatDate(row.end_date, locale) : t("present")}
                </p>
              </div>
              {verified ? (
                <Stamp tone="green" title={t("verifiedHint")}>✓ {t("verified")}</Stamp>
              ) : (
                <Badge tone="neutral" className="border-dashed" title={t("selfReportedHint")}>{t("selfReported")}</Badge>
              )}
            </div>
            {row.reason_for_leaving && (
              <p className="mt-2 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
                <span className="font-semibold text-stone-600">{t("reasonForLeaving")}:</span> {row.reason_for_leaving}
              </p>
            )}
            {renderActions?.(row)}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- WhatsApp share
export async function WhatsAppShare({ text, url, className }: { text: string; url: string; className?: string }) {
  const t = await getTranslations("jobs");
  const href = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-[#25D366] px-4 py-2 text-sm font-semibold text-ink shadow-hard transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3 1 2.6 1.1 2.7.1.2 1.9 2.9 4.6 4.1 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
      </svg>
      {t("shareWhatsApp")}
    </a>
  );
}
