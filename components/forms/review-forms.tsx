"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Textarea, cn } from "@/components/ui";
import { respondToReview, submitReview } from "@/lib/actions/engagement";

function YesNo({ name, label, required }: { name: string; label: string; required?: boolean }) {
  const t = useTranslations("reviews");
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-stone-800">{label}</legend>
      <div className="flex gap-2">
        {(["yes", "no"] as const).map((v) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name={name} value={v} required={required} className="peer sr-only" />
            <span className="inline-block rounded-full border-2 border-stone-300 px-4 py-1.5 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:ring-4 peer-focus-visible:ring-haldi/50">
              {t(v)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ReviewForm({ placementId, side }: { placementId: string; side: "worker" | "employer" }) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 underline decoration-2 underline-offset-4">
        <Star className="size-4" aria-hidden /> {side === "worker" ? t("rateEmployer") : t("rateWorker")}
      </button>
    );
  }

  return (
    <ActionForm action={submitReview} className="mt-3 space-y-4 rounded-2xl border-2 border-ink bg-paper p-4">
      <input type="hidden" name="placement_id" value={placementId} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-stone-800">{t("overall")}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} required className="peer sr-only" onChange={() => setRating(n)} />
              <Star
                aria-label={t("stars", { count: n })}
                className={cn(
                  "size-8 text-orange-600 transition-transform peer-focus-visible:scale-110",
                  (hover || rating) >= n ? "fill-current" : "fill-transparent",
                )}
                strokeWidth={1.8}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <YesNo name="would_return" label={side === "worker" ? t("wouldWorkAgain") : t("wouldRehire")} required />
      {side === "worker" && (
        <>
          <YesNo name="terms_matched" label={t("termsMatchedQ")} required />
          <YesNo name="paid_on_time" label={t("paidOnTimeQ")} required />
        </>
      )}
      <Field label={t("comment")} htmlFor={`comment-${placementId}`} hint={t("commentHint")}>
        <Textarea id={`comment-${placementId}`} name="comment" maxLength={1000} className="min-h-20" />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton>{t("submit")}</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-600">{t("cancel")}</button>
      </div>
    </ActionForm>
  );
}

export function ResponseForm({ reviewId }: { reviewId: string }) {
  const t = useTranslations("reviews");
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-orange-700 underline underline-offset-4">
        {t("reply")}
      </button>
    );
  }
  return (
    <ActionForm action={respondToReview} className="mt-2 space-y-2">
      <input type="hidden" name="review_id" value={reviewId} />
      <Textarea name="response" required maxLength={1000} className="min-h-16" aria-label={t("reply")} placeholder={t("replyPlaceholder")} />
      <p className="text-xs text-stone-600">{t("replyOnce")}</p>
      <SubmitButton variant="secondary">{t("postReply")}</SubmitButton>
    </ActionForm>
  );
}
