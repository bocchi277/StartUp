import { getTranslations } from "next-intl/server";
import { EmptyState, LinkButton } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <EmptyState title={t("notFound")}>
      <LinkButton href="/" className="mt-3">{t("goHome")}</LinkButton>
    </EmptyState>
  );
}
