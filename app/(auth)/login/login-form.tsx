"use client";

import { useActionState } from "react";
import type { LoginState } from "@/actions/auth";

type Action = (state: LoginState, formData: FormData) => Promise<LoginState>;

export default function LoginForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mot de passe</span>
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
        />
      </label>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
