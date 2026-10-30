import { getTranslations } from "next-intl/server";
import { BadgeCheck, ChevronDown, EyeOff, Flag, Mail, MessageCircle, Phone, ScrollText, Star } from "lucide-react";
import { Badge, Card, Eyebrow, LinkButton, SectionTitle, Stamp } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("how");
  return { title: t("title") };
}

export default async function HowItWorksPage() {
  const t = await getTranslations("how");
  const te = await getTranslations("enums.verification_level");
  const th = await getTranslations("history");

  const workerSteps = ["w1", "w2", "w3", "w4"] as const;
  const ownerSteps = ["o1", "o2", "o3", "o4"] as const;
  const safety = [
    { icon: ScrollText, key: "s1" },
    { icon: EyeOff, key: "s2" },
    { icon: Flag, key: "s3" },
    { icon: Star, key: "s4" },
    { icon: MessageCircle, key: "s5" },
  ] as const;
  const faqs = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

  return (
    <div className="space-y-16">
      <header className="max-w-3xl">
        <Eyebrow className="text-orange-700">{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-6xl">
          {t("titleA")} <span className="font-display-wonky haldi-underline text-orange-600">{t("titleB")}</span>
        </h1>
        <p className="mt-4 text-lg text-stone-700">{t("intro")}</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          { id: "workers", title: t("forWorkers"), steps: workerSteps, cls: "bg-cream" },
          { id: "owners", title: t("forOwners"), steps: ownerSteps, cls: "bg-haldi" },
        ].map((col) => (
          <div key={col.id} id={col.id} className={`rounded-3xl border-2 border-ink p-6 shadow-hard-lg sm:p-8 ${col.cls}`}>
            <h2 className="font-display-wonky text-3xl">{col.title}</h2>
            <ol className="mt-6 space-y-5">
              {col.steps.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-ink font-mono text-sm font-bold text-cream">{i + 1}</span>
                  <div>
                    <p className="font-semibold">{t(`${s}Title`)}</p>
                    <p className="text-sm text-stone-800">{t(`${s}Text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section id="stamps">
        <SectionTitle index="A">{t("stampsTitle")}</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-4">
            <p className="eyebrow">{t("businessLevels")}</p>
            {([
              ["unverified", <Badge key="u">{te("unverified")}</Badge>],
              ["email_verified", <Badge key="e" tone="blue">{te("email_verified")}</Badge>],
              ["business_verified", <Stamp key="b"><BadgeCheck className="size-3.5" /> {te("business_verified")}</Stamp>],
            ] as const).map(([level, badge]) => (
              <div key={level} className="flex items-start gap-4">
                <div className="w-40 shrink-0">{badge}</div>
                <p className="text-sm text-stone-700">{t(`level.${level}`)}</p>
              </div>
            ))}
          </Card>
          <Card className="space-y-4">
            <p className="eyebrow">{t("historyLevels")}</p>
            <div className="flex items-start gap-4">
              <div className="w-40 shrink-0"><Badge className="border-dashed">{th("selfReported")}</Badge></div>
              <p className="text-sm text-stone-700">{t("selfReportedText")}</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-40 shrink-0"><Stamp>✓ {th("verified")}</Stamp></div>
              <p className="text-sm text-stone-700">{t("verifiedText")}</p>
            </div>
          </Card>
        </div>
      </section>

      <section id="safety">
        <SectionTitle index="B">{t("safetyTitle")}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {safety.map(({ icon: Icon, key }) => (
            <Card key={key}>
              <Icon className="size-6 text-orange-600" aria-hidden />
              <p className="mt-3 font-semibold">{t(`${key}Title`)}</p>
              <p className="mt-1 text-sm text-stone-700">{t(`${key}Text`)}</p>
            </Card>
          ))}
          <Card className="border-2 border-ink bg-ink text-cream">
            <Phone className="size-6 text-haldi" aria-hidden />
            <p className="mt-3 font-semibold">{t("neverPayTitle")}</p>
            <p className="mt-1 text-sm text-stone-200">{t("neverPayText")}</p>
          </Card>
        </div>
      </section>

      <section id="faq">
        <SectionTitle index="C">{t("faqTitle")}</SectionTitle>
        <div className="divide-y-2 divide-dashed divide-stone-300 overflow-hidden rounded-2xl border-2 border-ink bg-cream">
          {faqs.map((q) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {t(`${q}Q`)}
                <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{t(`${q}A`)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start gap-4 rounded-3xl border-2 border-ink bg-orange-600 p-8 text-cream shadow-hard-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-3xl font-semibold">{t("ctaTitle")}</p>
        <div className="flex gap-3">
          <LinkButton href="/jobs" variant="secondary">{t("ctaJobs")}</LinkButton>
          <LinkButton href="/signup?role=employer" variant="haldi">{t("ctaHire")}</LinkButton>
        </div>
      </section>
      <p className="flex items-center gap-2 text-sm text-stone-600"><Mail className="size-4" aria-hidden /> {t("contact")}</p>
    </div>
  );
}
