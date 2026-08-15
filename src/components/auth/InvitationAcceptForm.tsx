"use client";

import Link from "next/link";
import { useActionState } from "react";
import { acceptInvitation, type InvitationAcceptState } from "@/app/actions/invitations";

export default function InvitationAcceptForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<InvitationAcceptState, FormData>(acceptInvitation, {});
  if (state.ok) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{state.message}</p>
        <Link href="/login" className="inline-flex h-11 items-center rounded-lg bg-[var(--primary)] px-5 text-sm text-white">
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Nombre<input name="nombre" required className="mt-1 h-11 w-full rounded-lg border px-3" /></label>
        <label className="text-sm">Apellido<input name="apellido" required className="mt-1 h-11 w-full rounded-lg border px-3" /></label>
      </div>
      <label className="block text-sm">Teléfono<input name="telefono" required className="mt-1 h-11 w-full rounded-lg border px-3" /></label>
      <label className="block text-sm">Contraseña<input name="password" type="password" minLength={8} required className="mt-1 h-11 w-full rounded-lg border px-3" /></label>
      <label className="block text-sm">Confirmar contraseña<input name="confirmPassword" type="password" minLength={8} required className="mt-1 h-11 w-full rounded-lg border px-3" /></label>
      {state.message && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{state.message}</p>}
      <button disabled={pending} className="h-11 w-full rounded-lg bg-[var(--primary)] text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Validando…" : "Aceptar invitación"}
      </button>
    </form>
  );
}

