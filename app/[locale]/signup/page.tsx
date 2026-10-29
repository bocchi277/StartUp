import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui";
import { GoogleButton, SignupForm } from "@/components/forms/auth-forms";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signupTitle") };
}

export default async function SignupPage({ searchParams }: PageProps<"/[locale]/signup">) {
  const sp = await searchParams;
  const role = sp.role === "employer" ? "employer" : "worker";
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">{t("signupTitle")}</h1>
      <p className="mb-6 text-sm text-stone-600">{t("signupSubtitle")}</p>
      <Card className="space-y-5">
        <GoogleButton />
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          {t("or")}
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <SignupForm defaultRole={role} />
      </Card>
      <p className="mt-4 text-center text-sm text-stone-600">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-orange-700 underline">{t("login")}</Link>
      </p>
    </div>
  );
}
