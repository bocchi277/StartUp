import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/forms/auth-forms";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("resetTitle") };
}

// The reset email link signs the user in via /api/auth/callback, then lands here.
export default async function ResetPasswordPage() {
  await requireUser();
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
