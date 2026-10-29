import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import type { Database } from "@/types/database";

const handleI18n = createIntlMiddleware(routing);

// Paths (after the locale prefix) that need a signed-in user.
const PROTECTED = /^\/(w|e|admin|onboarding|dashboard)(\/|$)/;
const AUTH_PAGES = /^\/(login|signup)(\/|$)/;

export async function proxy(request: NextRequest) {
  // 1. Refresh the Supabase session. Updated cookies are written onto the
  //    request (so Server Components see them) and collected for the response.
  const cookiesToSet: { name: string; value: string; options: object }[] = [];
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies, headers) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            cookiesToSet.push({ name, value, options });
          });
          cacheHeaders = { ...cacheHeaders, ...headers };
        },
      },
    },
  );

  // Do not put code between client creation and getClaims().
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);

  // 2. Locale routing. Runs on the request that now carries fresh cookies.
  let response: NextResponse = handleI18n(request);

  // 3. Optimistic redirects. Real authorization happens in layouts and the database.
  const segments = request.nextUrl.pathname.split("/");
  const locale = routing.locales.includes(segments[1] as never) ? segments[1] : null;
  if (locale) {
    const rest = "/" + segments.slice(2).join("/");
    if (!isSignedIn && PROTECTED.test(rest)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
      response = NextResponse.redirect(url);
    } else if (isSignedIn && AUTH_PAGES.test(rest)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      url.search = "";
      response = NextResponse.redirect(url);
    }
  }

  // 4. Copy refreshed auth cookies and no-cache headers onto whatever response we return.
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  Object.entries(cacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
