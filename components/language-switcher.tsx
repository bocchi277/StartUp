"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { savePreferredLanguage } from "@/lib/actions/auth";

export function LanguageSwitcher({ inverted }: { inverted?: boolean }) {
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
      lang={next}
      onClick={() =>
        startTransition(async () => {
          await savePreferredLanguage(next);
          const qs = searchParams.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next });
        })
      }
      className={
        inverted
          ? "inline-flex items-center gap-1.5 rounded-full border-2 border-cream/40 px-3 py-1 text-sm font-semibold text-cream hover:border-haldi hover:text-haldi"
          : "inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1 text-sm font-semibold text-ink hover:bg-haldi"
      }
      aria-label={next === "hi" ? "हिन्दी में देखें" : "View in English"}
    >
      <Languages className="size-4" aria-hidden />
      {next === "hi" ? "हिन्दी" : "English"}
    </button>
  );
}
