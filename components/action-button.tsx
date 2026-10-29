"use client";

import type { ComponentProps } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import type { ActionState } from "@/lib/validation";

/** A one-button form: hidden fields + submit, with inline error/success message. */
export function ActionButton({
  action, fields, children, variant = "secondary", confirm, className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  children: React.ReactNode;
  variant?: ComponentProps<typeof SubmitButton>["variant"];
  confirm?: string;
  className?: string;
}) {
  return (
    <ActionForm action={action} confirm={confirm} className={className}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton variant={variant}>{children}</SubmitButton>
    </ActionForm>
  );
}
