import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { JOB_CARD_SELECT } from "@/lib/queries";
import { photoUrl } from "@/lib/storage";
import { summarize, type ReviewRow } from "@/lib/reviews";
import { getTaxonomy, localName } from "@/lib/taxonomy";
import { getLocale } from "next-intl/server";
import { JobCard, VerificationBadge } from "@/components/display";
import { RatingSummary, ReviewList } from "@/components/reviews";
import { ReportForm } from "@/components/report-form";
import { Avatar, Card, EmptyState, Eyebrow, SectionTitle } from "@/components/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadBusiness(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/b/[id]">) {
  const { id } = await params;
  const b = await loadBusiness(id);
  return b ? { title: b.name, description: `${b.city}, ${b.state}` } : {};
}

export default async function BusinessPublicPage({ params }: PageProps<"/[locale]/b/[id]">) {
  const { id } = await params;
  const business = await loadBusiness(id);
  if (!business) notFound();

  const [locale, t, te, user, taxonomy] = await Promise.all([
    getLocale(), getTranslations("businessPublic"), getTranslations("enums"), getCurrentUser(), getTaxonomy(),
  ]);
  const tr = await getTranslations("reviews");
  const supabase = await createClient();
  const [{ data: jobs }, { data: reviewRows }] = await Promise.all([
    supabase.from("jobs").select(JOB_CARD_SELECT).eq("business_id", business.id).eq("status", "open")
      .gt("expires_at", new Date().toISOString()).order("last_confirmed_at", { ascending: false }),
    supabase.from("business_reviews_public").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
  ]);

  const roleById = new Map(taxonomy.roles.map((r) => [r.id, r]));
  const reviews: ReviewRow[] = (reviewRows ?? []).map((r) => ({
    id: r.id!, rating: r.rating!, would_return: Boolean(r.would_return), terms_matched: r.terms_matched, paid_on_time: r.paid_on_time,
    comment: r.comment, response: r.response, response_at: r.response_at, created_at: r.created_at!,
    author: tr("authorWorker", { role: localName(roleById.get(r.role_id ?? -1), locale) || tr("staff") }),
  }));
  const isOwner = user?.id === business.owner_id;
  const cover = photoUrl("business-photos", business.photo_url);

  return (
    <div className="space-y-10">
      <section className="ticket overflow-hidden">
        <div className="relative h-36 bg-ink sm:h-48">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="size-full object-cover opacity-90" />
          ) : (
            <div aria-hidden className="size-full bg-[repeating-linear-gradient(135deg,#1e1915_0_18px,#2e2721_18px_36px)]" />
          )}
        </div>
        <div className="ticket-tear" aria-hidden />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="flex items-end gap-4">
            <Avatar src={cover} name={business.name} size={72} className="-mt-16 rounded-2xl bg-cream" />
            <div>
              <Eyebrow>{te(`business_category.${business.category}`)}</Eyebrow>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{business.name}</h1>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-stone-700">
                <MapPin className="size-4" aria-hidden /> {business.address}, {business.city}, {business.state}
              </p>
            </div>
          </div>
          <VerificationBadge level={business.verification_level} size="lg" />
        </div>
        {business.description && (
          <p className="whitespace-pre-line border-t-2 border-dashed border-stone-200 px-5 py-4 text-sm leading-relaxed text-stone-800 sm:px-7">
            {business.description}
          </p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
        <section>
          <SectionTitle>{t("ratings")}</SectionTitle>
          <Card className="space-y-5">
            <RatingSummary summary={summarize(reviews)} kind="business" />
            <p className="text-xs text-stone-600">{t("ratingsNote")}</p>
          </Card>
        </section>
        <section>
          <SectionTitle>{t("reviews")}</SectionTitle>
          {reviews.length ? (
            <ReviewList reviews={reviews} canRespond={isOwner} authorFallback={tr("staff")} />
          ) : (
            <EmptyState title={tr("noneBusiness")} />
          )}
        </section>
      </div>

      <section>
        <SectionTitle>{t("openJobs", { count: jobs?.length ?? 0 })}</SectionTitle>
        {jobs?.length ? (
          <div className="card-grid">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          <EmptyState title={t("noJobs")} />
        )}
      </section>

      {user && !isOwner && <ReportForm targetType="business" targetId={business.id} />}
    </div>
  );
}
