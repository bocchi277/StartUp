"use server";

import { headers } from "next/headers";
import { redirect as nextRedirect } from "next/navigation";
import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorKey } from "@/lib/errors";
import { z } from "zod";
import { formToObject, invalid, signInSchema, signUpSchema, type ActionState } from "@/lib/validation";

async function callbackUrl(locale: string, next = "/dashboard") {
  const origin = (await headers()).get("origin") ?? undefined;
  return `${siteUrl(origin)}/api/auth/callback?next=${encodeURIComponent(`/${locale}${next}`)}`;
}

// Only allow same-site relative paths after login (no open redirects).
function safeNext(value: FormDataEntryValue | null, locale: string) {
  const v = typeof value === "string" ? value : "";
  if (v.startsWith(`/${locale}/`) && !v.startsWith("//")) return v.slice(locale.length + 1);
  return "/dashboard";
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale();
  const parsed = signUpSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { email, password, full_name, role } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role, preferred_language: locale },
      emailRedirectTo: await callbackUrl(locale),
    },
  });
  if (error) {
    if (error.code === "weak_password") return { error: "weakPassword" };
    if (error.code === "over_email_send_rate_limit") return { error: "rateLimited" };
    console.error("[auth] signUp", error.code, error.message);
    return { error: "generic" };
  }
  // Email confirmation turned off in Supabase -> already signed in.
  if (data.session) redirect({ href: "/dashboard", locale });
  return { ok: true, message: "checkEmail" };
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale();
  const parsed = signInSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "emailNotConfirmed" };
    return { error: "badCredentials" };
  }
  redirect({ href: safeNext(formData.get("next"), locale), locale });
  return {};
}

export async function signInWithGoogle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(locale, safeNext(formData.get("next"), locale)) },
  });
  if (error || !data.url) {
    console.error("[auth] google", error?.message);
    return { error: "generic" };
  }
  nextRedirect(data.url);
}

export async function signOut() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/", locale });
}

// For Google sign-ups, which don't pass through the role picker on /signup.
export async function chooseRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = formData.get("role");
  if (role !== "worker" && role !== "employer") return { error: "invalidFields" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_role", { p_role: role });
  if (error) return { error: dbErrorKey(error) };
  refresh();
  return { ok: true };
}

export async function savePreferredLanguage(lang: string) {
  if (lang !== "en" && lang !== "hi") return;
  const user = await getCurrentUser();
  if (!user || user.profile.preferred_language === lang) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ preferred_language: lang }).eq("id", user.id);
}

// Always answers "check your email" so the form can't be used to find out who has an account.
export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale();
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { error: "invalidFields", fields: ["email"] };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: await callbackUrl(locale, "/reset-password"),
  });
  if (error?.code === "over_email_send_rate_limit") return { error: "rateLimited" };
  if (error) console.error("[auth] reset", error.code, error.message);
  return { ok: true, message: "resetSent" };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale();
  const password = z.string().min(8).max(72).safeParse(formData.get("password"));
  if (!password.success) return { error: "weakPassword", fields: ["password"] };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { error: "not_authenticated" };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    if (error.code === "same_password") return { error: "samePassword" };
    if (error.code === "weak_password") return { error: "weakPassword" };
    console.error("[auth] update password", error.code, error.message);
    return { error: "generic" };
  }
  redirect({ href: "/dashboard", locale });
  return {};
}
