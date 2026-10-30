"use client";

import { useTranslations } from "next-intl";
import { Briefcase, ChefHat } from "lucide-react";
import { ActionForm, SubmitButton, useFormState } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { chooseRole, requestPasswordReset, signIn, signInWithGoogle, signUp, updatePassword } from "@/lib/actions/auth";

export function GoogleButton({ next }: { next?: string }) {
  const t = useTranslations("auth");
  return (
    <ActionForm action={signInWithGoogle}>
      {next && <input type="hidden" name="next" value={next} />}
      <SubmitButton variant="secondary" className="w-full">
        <svg aria-hidden viewBox="0 0 24 24" className="size-4">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        {t("continueWithGoogle")}
      </SubmitButton>
    </ActionForm>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  return (
    <ActionForm action={signIn} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label={t("email")} htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t("password")} htmlFor="password" required>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      <SubmitButton className="w-full">{t("login")}</SubmitButton>
    </ActionForm>
  );
}

function RoleCards({ defaultRole }: { defaultRole: "worker" | "employer" }) {
  const t = useTranslations("auth");
  const roles = [
    { value: "worker" as const, icon: ChefHat, label: t("roleWorker"), hint: t("roleWorkerHint") },
    { value: "employer" as const, icon: Briefcase, label: t("roleEmployer"), hint: t("roleEmployerHint") },
  ];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-stone-800">{t("iAm")}</legend>
      <div className="grid grid-cols-2 gap-3">
        {roles.map(({ value, icon: Icon, label, hint }) => (
          <label key={value} className="cursor-pointer">
            <input type="radio" name="role" value={value} defaultChecked={value === defaultRole} className="peer sr-only" required />
            <span className="flex h-full flex-col gap-2 rounded-2xl border-2 border-stone-300 bg-cream p-3.5 transition-all peer-checked:border-ink peer-checked:bg-haldi peer-checked:shadow-hard peer-focus-visible:ring-4 peer-focus-visible:ring-haldi/50">
              <Icon className="size-6" aria-hidden />
              <span className="text-sm font-bold leading-tight">{label}</span>
              <span className="text-xs text-stone-700">{hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SignupFields({ defaultRole }: { defaultRole: "worker" | "employer" }) {
  const t = useTranslations("auth");
  const { state } = useFormState();
  if (state.ok && state.message === "checkEmail") return null;

  return (
    <>
      <RoleCards defaultRole={defaultRole} />
      <Field label={t("fullName")} htmlFor="full_name" required>
        <Input id="full_name" name="full_name" required minLength={2} maxLength={120} autoComplete="name" />
      </Field>
      <Field label={t("email")} htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t("password")} htmlFor="password" required hint={t("passwordHint")}>
        <Input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
      </Field>
      <SubmitButton className="w-full">{t("createAccount")}</SubmitButton>
    </>
  );
}

export function SignupForm({ defaultRole }: { defaultRole: "worker" | "employer" }) {
  return (
    <ActionForm action={signUp} className="space-y-4">
      <SignupFields defaultRole={defaultRole} />
    </ActionForm>
  );
}

export function RoleChooser() {
  const t = useTranslations("auth");
  return (
    <ActionForm action={chooseRole} className="grid gap-4 sm:grid-cols-2">
      {[
        { value: "worker", icon: ChefHat, label: t("roleWorker"), hint: t("roleWorkerHint") },
        { value: "employer", icon: Briefcase, label: t("roleEmployer"), hint: t("roleEmployerHint") },
      ].map(({ value, icon: Icon, label, hint }) => (
        <SubmitButton key={value} name="role" value={value} variant="secondary" className="h-auto flex-col items-start gap-2 p-5 text-left">
          <Icon className="size-7" aria-hidden />
          <span className="font-display text-xl">{label}</span>
          <span className="text-xs font-normal text-stone-600">{hint}</span>
        </SubmitButton>
      ))}
    </ActionForm>
  );
}

function ForgotFields() {
  const t = useTranslations("auth");
  const { state } = useFormState();
  if (state.ok) return null;
  return (
    <>
      <Field label={t("email")} htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <SubmitButton className="w-full">{t("sendResetLink")}</SubmitButton>
    </>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={requestPasswordReset} className="space-y-4">
      <ForgotFields />
    </ActionForm>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  return (
    <ActionForm action={updatePassword} className="space-y-4">
      <Field label={t("newPassword")} htmlFor="password" required hint={t("passwordHint")}>
        <Input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
      </Field>
      <SubmitButton className="w-full">{t("savePassword")}</SubmitButton>
    </ActionForm>
  );
}
