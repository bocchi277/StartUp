"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { savePreferredLanguage } from "@/lib/actions/auth";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === "en" ? "hi" : "en";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await savePreferredLanguage(next);
          const qs = searchParams.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next });
        })
      }
      className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
      aria-label={next === "hi" ? "हिन्दी में देखें" : "View in English"}
    >
      {next === "hi" ? "हिन्दी" : "English"}
    </button>
  );
}
