import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { APP_NAME } from "@/lib/brand";
import { Wordmark } from "@/components/logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const columns = [
    { title: t("workers"), links: [{ href: "/jobs", label: t("findJobs") }, { href: "/signup", label: t("createProfile") }] },
    { title: t("owners"), links: [{ href: "/signup?role=employer", label: t("postJob") }, { href: "/how-it-works#owners", label: t("howHiringWorks") }] },
    { title: t("trust"), links: [{ href: "/how-it-works#stamps", label: t("verification") }, { href: "/how-it-works#safety", label: t("safety") }, { href: "/how-it-works#faq", label: t("faq") }] },
  ];

  return (
    <footer className="relative mt-16 border-t-2 border-ink bg-ink text-cream">
      <div className="site-x grid gap-10 py-12 md:grid-cols-[1.3fr_2fr]">
        <div>
          <Wordmark inverted />
          <p className="font-display-wonky mt-5 text-3xl leading-tight text-cream sm:text-4xl">{t("line")}</p>
          <p className="mt-3 max-w-sm text-sm text-stone-300">{t("note")}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title}>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-haldi">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-stone-200 underline-offset-4 hover:text-haldi hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="site-x flex flex-wrap items-center justify-between gap-2 py-4 font-mono text-[11px] text-stone-400">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <span>{t("madeFor")}</span>
        </div>
      </div>
    </footer>
  );
}
