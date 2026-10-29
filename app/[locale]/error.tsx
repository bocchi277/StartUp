"use client";

import { useTranslations } from "next-intl";
import { Button, EmptyState } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  return (
    <EmptyState title={t("errorTitle")}>
      <p>{t("errorHint")}</p>
      <Button onClick={reset} className="mt-3">{t("tryAgain")}</Button>
    </EmptyState>
  );
}
