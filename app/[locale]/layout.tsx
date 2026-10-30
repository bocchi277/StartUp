import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { APP_NAME } from "@/lib/brand";
import { fontVariables } from "@/lib/fonts";
import { getCurrentUser } from "@/lib/auth";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: `${APP_NAME} – ${t("tagline")}`, template: `%s · ${APP_NAME}` },
    description: t("description"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf5ea",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const user = await getCurrentUser();
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html lang={locale} className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-haldi focus:px-3 focus:py-2 focus:font-semibold">
            {t("skipToContent")}
          </a>
          <Header />
          {/* Extra bottom padding on phones keeps content clear of the tab bar. */}
          <main id="main" className={`site-x flex-1 py-6 sm:py-8 ${user?.profile.role ? "pb-28 md:pb-8" : ""}`}>
            {children}
          </main>
          <div className={user?.profile.role ? "pb-20 md:pb-0" : undefined}>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
