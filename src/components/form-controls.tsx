"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/forms";
import { Alert, btn, cn } from "./ui";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: keyof typeof btn;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(btn.base, btn[variant], className)}>
      {pending ? pendingText : children}
    </button>
  );
}

/** A form bound to a server action that returns { error } / { ok } messages. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.ok}</Alert>}
      {children}
    </form>
  );
}

export function ConfirmButton({
  children,
  message,
  className,
}: {
  children: ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
