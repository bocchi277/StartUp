import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { withPage } from "@/lib/search-params";

export async function Pagination({
  basePath, searchParams, page, hasMore,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  hasMore: boolean;
}) {
  if (page <= 1 && !hasMore) return null;
  const t = await getTranslations("common");
  return (
    <nav className="mt-6 flex items-center justify-between text-sm" aria-label={t("pagination")}>
      {page > 1 ? (
        <Link href={`${basePath}${withPage(searchParams, page - 1)}`} className="rounded-lg border border-stone-300 bg-white px-3 py-2">
          ← {t("previous")}
        </Link>
      ) : <span />}
      <span className="text-stone-500">{t("page", { page })}</span>
      {hasMore ? (
        <Link href={`${basePath}${withPage(searchParams, page + 1)}`} className="rounded-lg border border-stone-300 bg-white px-3 py-2">
          {t("next")} →
        </Link>
      ) : <span />}
    </nav>
  );
}
