import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, Check, EyeOff, ScrollText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JOB_CARD_SELECT } from "@/lib/queries";
import { getTaxonomy, localName } from "@/lib/taxonomy";
import { JobCard } from "@/components/display";
import { HeroArt } from "@/components/hero-art";
import { Marquee } from "@/components/marquee";
import { Eyebrow, LinkButton, SectionTitle, Stamp, Badge } from "@/components/ui";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const th = await getTranslations("history");
  const supabase = await createClient();
  const [{ data: jobs }, taxonomy] = await Promise.all([
    supabase
      .from("jobs")
      .select(JOB_CARD_SELECT)
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString())
      .order("last_confirmed_at", { ascending: false })
      .limit(6),
    getTaxonomy(),
  ]);

  const promises = [
    { icon: ScrollText, key: "point1" },
    { icon: BadgeCheck, key: "point2" },
    { icon: EyeOff, key: "point3" },
  ] as const;
  const workerSteps = ["w1", "w2", "w3"] as const;
  const ownerSteps = ["o1", "o2", "o3"] as const;

  return (
    <div className="space-y-20">
      {/* ------------------------------------------------ hero */}
      <section className="grid items-center gap-10 pt-2 md:grid-cols-[1.15fr_1fr] md:pt-6">
        <div className="animate-rise">
          <Eyebrow className="mb-4 text-orange-700">{t("eyebrow")}</Eyebrow>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
            {t("heroLine1")}{" "}
            <span className="font-display-wonky haldi-underline text-orange-600">{t("heroLine2")}</span>{" "}
            {t("heroLine3")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-stone-700 sm:text-lg">{t("heroSubtitle")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/jobs" className="min-h-12 px-6 text-base">
              {t("findJob")} <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
            <LinkButton href="/signup?role=employer" variant="haldi" className="min-h-12 px-6 text-base">
              {t("hireStaff")}
            </LinkButton>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-stone-700">
            {(["trust1", "trust2", "trust3"] as const).map((k) => (
              <li key={k} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-green-600" aria-hidden strokeWidth={3} /> {t(k)}
              </li>
            ))}
          </ul>
        </div>
        <HeroArt />
      </section>

      <Marquee items={taxonomy.roles.map((r) => localName(r, locale))} label={t("rolesLabel")} className="!mt-14" />

      {/* ------------------------------------------------ promises */}
      <section>
        <SectionTitle index="01">{t("promisesTitle")}</SectionTitle>
        <div className="grid gap-5 md:grid-cols-3">
          {promises.map(({ icon: Icon, key }, i) => (
            <div key={key} className="ticket p-6" style={{ transform: `rotate(${[-0.6, 0.4, -0.3][i]}deg)` }}>
              <div className="flex size-11 items-center justify-center rounded-xl border-2 border-ink bg-haldi">
                <Icon className="size-5" aria-hidden strokeWidth={2.2} />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{t(`${key}Title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{t(`${key}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ verified vs self-reported */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-green-700 py-14 text-cream">
        <div className="site-x grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-haldi">02 · {t("trustEyebrow")}</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">{t("trustTitle")}</h2>
            <p className="mt-4 max-w-lg text-green-50">{t("trustText")}</p>
          </div>
          <div className="ticket space-y-4 p-5 text-ink">
            {[
              { name: "Sharma Dhaba", role: t("sample.role"), dates: "2022 → 2024", verified: false, reason: t("sampleReason") },
              { name: "Flavora Cafe", role: t("sample.role"), dates: "2024 → " + th("present"), verified: true },
            ].map((row) => (
              <div key={row.name} className="flex items-start justify-between gap-3 border-b-2 border-dashed border-stone-200 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-sm text-stone-600">{row.role}</p>
                  <p className="font-mono text-xs text-stone-500">{row.dates}</p>
                  {row.reason && <p className="mt-1.5 text-xs text-stone-600">{th("reasonForLeaving")}: {row.reason}</p>}
                </div>
                {row.verified ? <Stamp tone="green">✓ {th("verified")}</Stamp> : <Badge className="border-dashed">{th("selfReported")}</Badge>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ how it works */}
      <section id="how">
        <SectionTitle index="03">{t("howTitle")}</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { title: t("forWorkers"), steps: workerSteps, cls: "bg-ink text-cream", num: "text-haldi", cta: { href: "/signup", label: t("ctaWorker") } },
            { title: t("forOwners"), steps: ownerSteps, cls: "bg-haldi text-ink", num: "text-orange-700", cta: { href: "/signup?role=employer", label: t("ctaOwner") } },
          ].map((col) => (
            <div key={col.title} className={`rounded-3xl border-2 border-ink p-6 shadow-hard-lg sm:p-8 ${col.cls}`}>
              <h3 className="font-display-wonky text-3xl">{col.title}</h3>
              <ol className="mt-6 space-y-5">
                {col.steps.map((s, i) => (
                  <li key={s} className="flex gap-4">
                    <span className={`font-display text-4xl font-bold leading-none ${col.num}`}>{i + 1}</span>
                    <div>
                      <p className="font-semibold">{t(`${s}Title`)}</p>
                      <p className="text-sm opacity-80">{t(`${s}Text`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <LinkButton href={col.cta.href} variant="secondary" className="mt-7">
                {col.cta.label} <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ latest jobs */}
      <section>
        <SectionTitle index="04" action={<LinkButton href="/jobs" variant="ghost">{t("seeAll")}</LinkButton>}>
          {t("latestJobs")}
        </SectionTitle>
        {jobs?.length ? (
          <div className="card-grid">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          <p className="text-sm text-stone-600">{t("noJobsYet")}</p>
        )}
      </section>

      {/* ------------------------------------------------ CTA band */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-ink bg-orange-600 px-6 py-12 text-cream shadow-hard-lg sm:px-12">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full border-[18px] border-haldi/40" />
        <h2 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">{t("ctaTitle")}</h2>
        <p className="mt-3 max-w-xl text-orange-50">{t("ctaText")}</p>
        <LinkButton href="/signup?role=employer" variant="haldi" className="mt-6 min-h-12 px-6 text-base">
          {t("ctaButton")} <ArrowRight className="size-4" aria-hidden />
        </LinkButton>
      </section>
    </div>
  );
}
