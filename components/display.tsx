import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge, Card, type BadgeTone } from "@/components/ui";
import { daysAgo, experienceLabel, formatDate, formatSalaryRange, formatTime } from "@/lib/format";
import { localName } from "@/lib/taxonomy";
import type { JobCardData } from "@/lib/queries";
import type { Enums, Tables } from "@/types/database";

// ---------------------------------------------------------------- badges
const VERIFICATION_TONE: Record<Enums<"verification_level">, BadgeTone> = {
  unverified: "neutral",
  email_verified: "blue",
  business_verified: "green",
};

export async function VerificationBadge({ level }: { level: Enums<"verification_level"> }) {
  const t = await getTranslations("enums.verification_level");
  return (
    <Badge tone={VERIFICATION_TONE[level]}>
      {level === "business_verified" && <span aria-hidden>✓</span>}
      {t(level)}
    </Badge>
  );
}

const STATUS_TONE: Record<Enums<"application_status">, BadgeTone> = {
  applied: "blue",
  shortlisted: "orange",
  interview: "yellow",
  offered: "orange",
  hired: "green",
  rejected: "red",
  withdrawn: "neutral",
};

export async function ApplicationStatusBadge({ status }: { status: Enums<"application_status"> }) {
  const t = await getTranslations("enums.application_status");
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

// ---------------------------------------------------------------- job card
export async function JobCard({ job, href }: { job: JobCardData; href?: string }) {
  const locale = await getLocale();
  const t = await getTranslations("jobs");
  const te = await getTranslations("enums");
  const days = daysAgo(job.last_confirmed_at);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <Link href={href ?? `/jobs/${job.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-stone-900">{job.title}</h3>
            <p className="truncate text-sm text-stone-600">
              {job.businesses?.name} · {job.city}
            </p>
          </div>
          {job.businesses && <VerificationBadge level={job.businesses.verification_level} />}
        </div>

        <p className="mt-3 text-lg font-bold text-stone-900">
          {formatSalaryRange(job.salary_min, job.salary_max, locale)}
          <span className="text-sm font-normal text-stone-500"> {te(`payPer.${job.pay_frequency}`)}</span>
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          <Badge>{localName(job.job_roles, locale)}</Badge>
          <Badge>
            🕒 {formatTime(job.shift_start, locale)} – {formatTime(job.shift_end, locale)}
          </Badge>
          <Badge>{t("weeklyOffsShort", { count: job.weekly_offs })}</Badge>
          {job.meals !== "none" && <Badge tone="green">🍽 {te(`meals.${job.meals}`)}</Badge>}
          {job.accommodation && <Badge tone="green">🏠 {t("accommodation")}</Badge>}
          <Badge>{te(`employment_type.${job.employment_type}`)}</Badge>
        </div>

        <p className="mt-3 text-xs text-stone-500">
          {days === 0 ? t("activeToday") : t("activeDaysAgo", { days })}
        </p>
      </Link>
    </Card>
  );
}

// ---------------------------------------------------------------- full terms
export async function TermsBlock({
  job,
}: {
  job: Pick<
    Tables<"jobs">,
    | "salary_min" | "salary_max" | "pay_frequency" | "shift_start" | "shift_end" | "weekly_offs"
    | "meals" | "accommodation" | "tips_info" | "deductions" | "employment_type" | "joining_date"
    | "openings" | "min_experience_months"
  >;
}) {
  const locale = await getLocale();
  const t = await getTranslations("terms");
  const te = await getTranslations("enums");
  const exp = experienceLabel(job.min_experience_months);

  const rows: [string, string][] = [
    [t("salary"), `${formatSalaryRange(job.salary_min, job.salary_max, locale)} ${te(`payPer.${job.pay_frequency}`)}`],
    [t("shift"), `${formatTime(job.shift_start, locale)} – ${formatTime(job.shift_end, locale)}`],
    [t("weeklyOffs"), t("weeklyOffsValue", { count: job.weekly_offs })],
    [t("meals"), te(`meals.${job.meals}`)],
    [t("accommodation"), job.accommodation ? t("provided") : t("notProvided")],
    [t("deductions"), job.deductions],
    [t("tips"), job.tips_info || t("notMentioned")],
    [t("employmentType"), te(`employment_type.${job.employment_type}`)],
    [t("openings"), String(job.openings)],
    [t("minExperience"), job.min_experience_months ? t("experienceValue", exp) : t("freshersWelcome")],
    [t("joining"), job.joining_date ? formatDate(job.joining_date, locale) : t("asSoonAsPossible")],
  ];

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <h2 className="mb-3 text-base font-semibold text-stone-900">{t("title")}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wide text-stone-500">{label}</dt>
            <dd className="text-sm font-medium text-stone-900">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
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
  if (!rows.length) return <p className="text-sm text-stone-500">{t("empty")}</p>;
  const roleById = new Map(roles.map((r) => [r.id, r]));

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="rounded-lg border border-stone-200 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-stone-900">{row.employer_name}</p>
              <p className="text-sm text-stone-600">
                {[row.job_title, localName(roleById.get(row.role_id ?? -1), locale)].filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs text-stone-500">
                {formatDate(row.start_date, locale)} – {row.end_date ? formatDate(row.end_date, locale) : t("present")}
              </p>
            </div>
            {row.source === "platform_verified" ? (
              <Badge tone="green" title={t("verifiedHint")}>✓ {t("verified")}</Badge>
            ) : (
              <Badge tone="neutral" title={t("selfReportedHint")}>{t("selfReported")}</Badge>
            )}
          </div>
          {row.reason_for_leaving && (
            <p className="mt-2 text-sm text-stone-700">
              <span className="text-stone-500">{t("reasonForLeaving")}:</span> {row.reason_for_leaving}
            </p>
          )}
          {renderActions?.(row)}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- WhatsApp share
export async function WhatsAppShare({ text, url }: { text: string; url: string }) {
  const t = await getTranslations("jobs");
  const href = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
    >
      {t("shareWhatsApp")}
    </a>
  );
}
