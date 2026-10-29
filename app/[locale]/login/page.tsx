import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui";
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
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">{t("loginTitle")}</h1>
      <Card className="space-y-5">
        {linkError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t("linkError")}</p>}
        <GoogleButton next={next} />
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          {t("or")}
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <LoginForm next={next} />
      </Card>
      <p className="mt-4 text-center text-sm text-stone-600">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-orange-700 underline">{t("signup")}</Link>
      </p>
    </div>
  );
}
