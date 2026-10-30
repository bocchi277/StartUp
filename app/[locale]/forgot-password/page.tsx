import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("forgotTitle") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("forgotTitle")} subtitle={t("forgotSubtitle")}>
      <div className="space-y-5">
        <ForgotPasswordForm />
        <Link href="/login" className="inline-block text-sm font-semibold text-orange-700 underline underline-offset-4">← {t("backToLogin")}</Link>
      </div>
    </AuthShell>
  );
}
