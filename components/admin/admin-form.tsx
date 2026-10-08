"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/admin/actions";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

// A form bound to a server action, showing its pending state and the result inline.
// Submits through onSubmit rather than `action` so React doesn't reset the fields
// afterwards: a failed save keeps what was typed. `resetOnSuccess` clears "add" forms.
export function AdminForm({
  action,
  children,
  submitLabel,
  submitVariant = "dark",
  className,
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  submitLabel: string;
  submitVariant?: "dark" | "primary" | "ghost";
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className={`aform ${className ?? ""}`}>
      {children}
      <div className="aform__foot">
        <button type="submit" className={`btn btn--${submitVariant} btn--sm`} disabled={pending}>
          {pending ? <><span className="spinner" aria-hidden="true" /> Saving…</> : submitLabel}
        </button>
        <span aria-live="polite" className="aform__msg">
          {state?.error && <span className="aform__err">{state.error}</span>}
          {state?.ok && <span className="aform__ok">{state.ok}</span>}
        </span>
      </div>
      {state?.secret && <Secret value={state.secret} />}
    </form>
  );
}

function Secret({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="secret">
      <code>{value}</code>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => setCopied(true));
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// A one-click action (toggle, remove) that asks first.
export function ConfirmButton({
  action,
  name,
  value,
  label,
  confirm,
  variant = "ghost",
}: {
  action: (formData: FormData) => Promise<void>;
  name: string;
  value: string;
  label: string;
  confirm: string;
  variant?: "ghost" | "dark" | "danger";
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name={name} value={value} />
      <PendingButton label={label} variant={variant} />
    </form>
  );
}

function PendingButton({ label, variant }: { label: string; variant: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn--${variant} btn--xs`} disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}
