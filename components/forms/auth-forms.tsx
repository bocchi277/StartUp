"use client";

import { useTranslations } from "next-intl";
import { ActionForm, SubmitButton, useFormState } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { chooseRole, signIn, signInWithGoogle, signUp } from "@/lib/actions/auth";

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

function SignupFields({ defaultRole }: { defaultRole: "worker" | "employer" }) {
  const t = useTranslations("auth");
  const { state } = useFormState();
  if (state.ok && state.message === "checkEmail") return null;

  return (
    <>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-800">{t("iAm")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["worker", "employer"] as const).map((role) => (
            <label key={role} className="cursor-pointer">
              <input type="radio" name="role" value={role} defaultChecked={role === defaultRole} className="peer sr-only" required />
              <span className="block rounded-lg border border-stone-300 p-3 text-center text-sm peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:font-semibold peer-checked:text-orange-800">
                {role === "worker" ? t("roleWorker") : t("roleEmployer")}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
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
    <ActionForm action={chooseRole} className="grid gap-3 sm:grid-cols-2">
      <SubmitButton name="role" value="worker" variant="secondary" className="h-24 text-base">
        {t("roleWorker")}
      </SubmitButton>
      <SubmitButton name="role" value="employer" variant="secondary" className="h-24 text-base">
        {t("roleEmployer")}
      </SubmitButton>
    </ActionForm>
  );
}
