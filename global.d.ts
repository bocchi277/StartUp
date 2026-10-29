import type { routing } from "@/i18n/routing";
import type messages from "@/messages/en.json";

// Makes t("some.key") a TypeScript error when the key is missing from en.json.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
