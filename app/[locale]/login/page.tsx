import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthShell, OrDivider } from "@/components/auth-shell";
import { GoogleButton, LoginForm } from "@/components/forms/auth-forms";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const linkError = sp.error === "link";
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      <div className="space-y-5">
        {linkError && <p className="rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{t("linkError")}</p>}
        <GoogleButton next={next} />
        <OrDivider label={t("or")} />
        <LoginForm next={next} />
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <Link href="/forgot-password" className="font-semibold text-stone-700 underline underline-offset-4">{t("forgotPassword")}</Link>
          <span className="text-stone-600">
            {t("noAccount")}{" "}
            <Link href="/signup" className="font-semibold text-orange-700 underline underline-offset-4">{t("signup")}</Link>
          </span>
        </div>
      </div>
    </AuthShell>
  );
}
