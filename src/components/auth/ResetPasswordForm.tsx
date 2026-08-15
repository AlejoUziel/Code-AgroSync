"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type PasswordRecoveryState } from "@/app/actions/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<PasswordRecoveryState, FormData>(resetPassword, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-medium-body">Nueva contrasena<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 h-11 w-full rounded-lg border border-[var(--border)] px-3 outline-none focus:border-[var(--primary)]" /></label>
      <label className="block text-sm font-medium-body">Confirmar contrasena<input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" className="mt-2 h-11 w-full rounded-lg border border-[var(--border)] px-3 outline-none focus:border-[var(--primary)]" /></label>
      {state.message && <p className={`rounded-lg border px-3 py-2 text-sm ${state.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>{state.message}</p>}
      <button disabled={pending || state.ok} className="h-11 w-full rounded-lg bg-[var(--primary)] font-medium-body text-white disabled:opacity-60">{pending ? "Actualizando..." : "Actualizar contrasena"}</button>
      <Link href="/login" className="block text-center text-sm text-[var(--primary)] hover:underline">Ir al inicio de sesion</Link>
    </form>
  );
}
