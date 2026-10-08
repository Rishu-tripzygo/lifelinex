"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { loginAction } from "@/app/admin/actions";
import { Icon } from "@/components/icons";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  // onSubmit (not `action`) so a failed sign-in keeps the email that was typed.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }
  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 16, width: "100%" }}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <div className="field__control">
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="field__control">
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
      </div>
      {state?.error && (
        <p className="alert" role="alert">
          <Icon name="alert" size={18} style={{ flex: "none" }} />
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn--dark btn--block" disabled={pending}>
        {pending ? <><span className="spinner" aria-hidden="true" /> Signing in…</> : "Sign in"}
      </button>
    </form>
  );
}
