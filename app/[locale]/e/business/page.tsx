import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/storage";
import { summarize, type ReviewRow } from "@/lib/reviews";
import { getTaxonomy, localName } from "@/lib/taxonomy";
import { BusinessForm } from "@/components/forms/business-form";
import { VerificationBadge } from "@/components/display";
import { PhotoUpload } from "@/components/photo-upload";
import { RatingSummary, ReviewList } from "@/components/reviews";
import { Card, LinkButton, PageHeader, SectionTitle } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("business") };
}

export default async function BusinessPage() {
  const { user, business } = await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("businessPage");
  const tr = await getTranslations("reviews");
  const supabase = await createClient();
  const [{ data: reviewRows }, taxonomy] = await Promise.all([
    supabase.from("business_reviews_public").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
    getTaxonomy(),
  ]);
  const roleById = new Map(taxonomy.roles.map((r) => [r.id, r]));
  const reviews: ReviewRow[] = (reviewRows ?? []).map((r) => ({
    id: r.id!, rating: r.rating!, would_return: Boolean(r.would_return), terms_matched: r.terms_matched, paid_on_time: r.paid_on_time,
    comment: r.comment, response: r.response, response_at: r.response_at, created_at: r.created_at!,
    author: tr("authorWorker", { role: localName(roleById.get(r.role_id ?? -1), locale) || tr("staff") }),
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        title={t("title")}
        actions={<LinkButton href={`/b/${business.id}`} variant="secondary">{t("viewPublic")} <ArrowUpRight className="size-4" aria-hidden /></LinkButton>}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="space-y-3">
          <p className="eyebrow">{t("verification")}</p>
          <VerificationBadge level={business.verification_level} size="lg" />
          <p className="text-sm text-stone-700">{t(`levelHint.${business.verification_level}`)}</p>
        </Card>
        <Card className="space-y-3">
          <p className="eyebrow">{t("photo")}</p>
          <PhotoUpload kind="business" userId={user.id} currentUrl={photoUrl("business-photos", business.photo_url)} name={business.name} shape="wide" />
        </Card>
      </div>

      <section>
        <SectionTitle>{t("reviewsTitle")}</SectionTitle>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <Card><RatingSummary summary={summarize(reviews)} kind="business" /></Card>
          <div>
            <ReviewList reviews={reviews} canRespond authorFallback={tr("staff")} />
            {!reviews.length && <p className="text-sm text-stone-600">{t("reviewsHint")}</p>}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>{t("details")}</SectionTitle>
        <BusinessForm business={business} />
      </section>
    </div>
  );
}
