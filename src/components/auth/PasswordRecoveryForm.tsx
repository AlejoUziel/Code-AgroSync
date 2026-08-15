"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type PasswordRecoveryState } from "@/app/actions/auth";

export default function PasswordRecoveryForm() {
  const [state, action, pending] = useActionState<PasswordRecoveryState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium-body">
        Correo electronico
        <input name="email" type="email" required autoComplete="email" className="mt-2 h-11 w-full rounded-lg border border-[var(--border)] px-3 outline-none focus:border-[var(--primary)]" />
      </label>
      {state.message && <p className={`rounded-lg border px-3 py-2 text-sm ${state.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>{state.message}</p>}
      <button disabled={pending} className="h-11 w-full rounded-lg bg-[var(--primary)] font-medium-body text-white disabled:opacity-60">
        {pending ? "Enviando..." : "Enviar enlace seguro"}
      </button>
      <Link href="/login" className="block text-center text-sm text-[var(--primary)] hover:underline">Volver al inicio de sesion</Link>
    </form>
  );
}
