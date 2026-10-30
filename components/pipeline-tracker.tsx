import { getTranslations } from "next-intl/server";
import { cn } from "@/components/ui";
import type { Enums } from "@/types/database";

const STEPS = ["applied", "shortlisted", "interview", "offered", "hired"] as const;

/** Applied → Shortlisted → Interview → Offer → Hired, with the current step lit. */
export async function PipelineTracker({ status }: { status: Enums<"application_status"> }) {
  const t = await getTranslations("enums.application_status");
  if (status === "rejected" || status === "withdrawn") return null;
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className="mt-4 grid grid-cols-5 gap-1" aria-label={t(status)}>
      {STEPS.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined}>
          <div className={cn("h-1.5 rounded-full", i <= current ? (s === "hired" ? "bg-green-500" : "bg-orange-600") : "bg-stone-200")} />
          <p className={cn("mt-1 truncate text-[10px] font-semibold uppercase tracking-wide", i === current ? "text-ink" : "text-stone-500")}>
            {t(s)}
          </p>
        </li>
      ))}
    </ol>
  );
}
