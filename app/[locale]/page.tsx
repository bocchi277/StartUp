import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { JOB_CARD_SELECT } from "@/lib/queries";
import { JobCard } from "@/components/display";
import { LinkButton, SectionTitle } from "@/components/ui";

export default async function HomePage() {
  const t = await getTranslations("home");
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select(JOB_CARD_SELECT)
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("last_confirmed_at", { ascending: false })
    .limit(6);

  const points = ["point1", "point2", "point3"] as const;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 px-6 py-10 text-white sm:px-10 sm:py-14">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-3 max-w-xl text-orange-50">{t("heroSubtitle")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/jobs" variant="secondary" className="text-base">{t("findJob")}</LinkButton>
          <LinkButton href="/signup?role=employer" variant="secondary" className="border-white/40 bg-orange-700 text-base text-white hover:bg-orange-800">
            {t("hireStaff")}
          </LinkButton>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {points.map((p) => (
          <div key={p} className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold text-stone-900">{t(`${p}Title`)}</h2>
            <p className="mt-1 text-sm text-stone-600">{t(`${p}Text`)}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between">
          <SectionTitle>{t("latestJobs")}</SectionTitle>
          <LinkButton href="/jobs" variant="ghost">{t("seeAll")}</LinkButton>
        </div>
        {jobs?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500">{t("noJobsYet")}</p>
        )}
      </section>
    </div>
  );
}
