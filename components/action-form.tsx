"use client";

import { createContext, startTransition, use, useActionState, type ComponentProps, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ActionState } from "@/lib/validation";
import { Button, cn } from "@/components/ui";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const FormContext = createContext<{ pending: boolean; state: ActionState }>({ pending: false, state: {} });

/**
 * Wraps a Server Action that returns ActionState.
 * - Submits inside a transition so React does not clear the fields when validation fails.
 * - Shows the translated error/success message under the form.
 * - <SubmitButton> inside reads the pending state.
 */
export function ActionForm({
  action, children, className, confirm, hideMessages, ...rest
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  confirm?: string;
  hideMessages?: boolean;
} & Omit<ComponentProps<"form">, "action" | "onSubmit">) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <FormContext value={{ pending, state }}>
      <form
        {...rest}
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const formData = new FormData(event.currentTarget);
          const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          if (submitter?.name) formData.set(submitter.name, submitter.value);
          startTransition(() => formAction(formData));
        }}
      >
        {children}
        {!hideMessages && <FormMessage />}
      </form>
    </FormContext>
  );
}

export function useFormState() {
  return use(FormContext);
}

export function FormMessage({ className }: { className?: string }) {
  const { state } = useFormState();
  const t = useTranslations("errors");
  const tm = useTranslations("messages");
  // Keys come from server actions at runtime, so check them with .has() first.
  type ErrorKey = Parameters<typeof t>[0];
  type MessageKey = Parameters<typeof tm>[0];
  if (state.error) {
    return (
      <p role="alert" className={cn("mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700", className)}>
        {t.has(state.error as ErrorKey) ? t(state.error as ErrorKey) : t("generic")}
        {state.fields?.length ? <span className="block text-xs">{t("checkFields")}: {state.fields.join(", ")}</span> : null}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className={cn("mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800", className)}>
        {tm.has(state.message as MessageKey) ? tm(state.message as MessageKey) : state.message}
      </p>
    );
  }
  return null;
}

export function SubmitButton({ children, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormState();
  const t = useTranslations("common");
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? t("saving") : children}
    </Button>
  );
}

/** True if the last submission flagged this field. */
export function useFieldError(name: string) {
  const { state } = useFormState();
  return Boolean(state.fields?.includes(name));
}
