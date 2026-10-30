import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthShell, OrDivider } from "@/components/auth-shell";
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
    <AuthShell title={t("signupTitle")} subtitle={t("signupSubtitle")}>
      <div className="space-y-5">
        <SignupForm defaultRole={role} />
        <OrDivider label={t("or")} />
        <GoogleButton />
        <p className="text-center text-sm text-stone-600">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-orange-700 underline underline-offset-4">{t("login")}</Link>
        </p>
      </div>
    </AuthShell>
  );
}
