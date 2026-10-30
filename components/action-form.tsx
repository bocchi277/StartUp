"use client";

import {
  createContext, startTransition, use, useActionState, useEffect, useRef,
  type ComponentProps, type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/lib/validation";
import { Button, cn } from "@/components/ui";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const FormContext = createContext<{ pending: boolean; state: ActionState }>({ pending: false, state: {} });

/**
 * Wraps a Server Action that returns ActionState.
 * - Submits inside a transition so React does not clear the fields when validation fails.
 * - Marks fields the server rejected with aria-invalid and scrolls to the first one.
 * - Shows the translated error/success message under the form.
 */
export function ActionForm({
  action, children, className, confirm, hideMessages, onSuccess, ...rest
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  confirm?: string;
  hideMessages?: boolean;
  onSuccess?: () => void;
} & Omit<ComponentProps<"form">, "action" | "onSubmit">) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    form.querySelectorAll("[aria-invalid='true']").forEach((el) => el.removeAttribute("aria-invalid"));
    const bad = (state.fields ?? [])
      .map((name) => form.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`))
      .filter((el): el is HTMLElement => Boolean(el));
    bad.forEach((el) => el.setAttribute("aria-invalid", "true"));
    if (bad[0]) {
      bad[0].scrollIntoView({ block: "center", behavior: "smooth" });
      bad[0].focus({ preventScroll: true });
    }
    if (state.ok) onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <FormContext value={{ pending, state }}>
      <form
        {...rest}
        ref={formRef}
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
      <p role="alert" className={cn("mt-3 flex items-start gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700", className)}>
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.has(state.error as ErrorKey) ? t(state.error as ErrorKey) : t("generic")}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className={cn("mt-3 flex items-start gap-2 rounded-xl border-2 border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800", className)}>
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
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
