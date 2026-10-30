import { getLocale, getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { Stars, cn } from "@/components/ui";
import { ResponseForm } from "@/components/forms/review-forms";
import { ReportForm } from "@/components/report-form";
import { formatDate } from "@/lib/format";
import type { ReviewRow, ReviewSummary } from "@/lib/reviews";

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-stone-700">{label}</span>
        <span className="font-mono font-semibold text-ink">{value}%</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-cream">
        <div className={cn("h-full", value >= 70 ? "bg-green-500" : value >= 40 ? "bg-haldi" : "bg-red-500")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export async function RatingSummary({ summary, kind }: { summary: ReviewSummary; kind: "business" | "worker" }) {
  const t = await getTranslations("reviews");
  if (!summary.count) return <p className="text-sm text-stone-600">{kind === "business" ? t("noneBusiness") : t("noneWorker")}</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="font-display text-5xl font-bold leading-none">{summary.average.toFixed(1)}</p>
        <div>
          <Stars value={summary.average} size={18} />
          <p className="mt-1 font-mono text-xs text-stone-600">{t("count", { count: summary.count })}</p>
        </div>
      </div>
      <div className="grid gap-3">
        {kind === "business" && summary.termsMatchedPct !== null && <Meter label={t("termsMatched")} value={summary.termsMatchedPct} />}
        {kind === "business" && summary.paidOnTimePct !== null && <Meter label={t("paidOnTime")} value={summary.paidOnTimePct} />}
        {summary.wouldReturnPct !== null && (
          <Meter label={kind === "business" ? t("wouldWorkAgainPct") : t("wouldRehirePct")} value={summary.wouldReturnPct} />
        )}
      </div>
    </div>
  );
}

export async function ReviewList({
  reviews, canRespond, authorFallback,
}: {
  reviews: ReviewRow[];
  canRespond?: boolean;
  authorFallback: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations("reviews");
  if (!reviews.length) return null;
  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-2xl border border-line bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Stars value={r.rating} />
            <span className="font-mono text-[11px] text-stone-500">{formatDate(r.created_at, locale)}</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-600">{r.author || authorFallback}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.terms_matched != null && (
              <span className={cn("chip", r.terms_matched ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700")}>
                {r.terms_matched ? t("tagTermsMatched") : t("tagTermsDifferent")}
              </span>
            )}
            {r.paid_on_time != null && (
              <span className={cn("chip", r.paid_on_time ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700")}>
                {r.paid_on_time ? t("tagPaidOnTime") : t("tagPaidLate")}
              </span>
            )}
            <span className="chip">{r.would_return ? t("tagWouldReturn") : t("tagWouldNotReturn")}</span>
          </div>
          {r.comment && <p className="mt-3 whitespace-pre-line text-sm text-stone-800">“{r.comment}”</p>}
          {r.response ? (
            <div className="mt-3 border-l-4 border-haldi bg-cream px-3 py-2 text-sm">
              <p className="flex items-center gap-1 text-xs font-semibold text-stone-600">
                <MessageCircle className="size-3.5" aria-hidden /> {t("replyLabel")}
              </p>
              <p className="mt-1 whitespace-pre-line">{r.response}</p>
            </div>
          ) : (
            canRespond && <div className="mt-3"><ResponseForm reviewId={r.id} /></div>
          )}
          {canRespond && <div className="mt-2"><ReportForm targetType="review" targetId={r.id} /></div>}
        </li>
      ))}
    </ul>
  );
}
