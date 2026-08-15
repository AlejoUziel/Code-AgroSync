"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

type Invitation = {
  id: string; email_destino: string; rol: string; departamento: string;
  expira_en: string; aceptada_en: string | null; revocada_en: string | null; creada_en: string;
};

export default function TeamInvitationsPage() {
  const [items, setItems] = useState<Invitation[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/invitations", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setItems(data.items ?? []); else setMessage(data.message ?? "No se pudo cargar.");
  }, []);
  useEffect(() => {
    let active = true;
    void fetch("/api/invitations", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok) setItems(data.items ?? []);
        else setMessage(data.message ?? "No se pudo cargar.");
      })
      .catch(() => {
        if (active) setMessage("No se pudo cargar.");
      });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const data = await response.json();
    setMessage(response.ok ? "Invitación enviada y registrada." : data.message ?? "No se pudo enviar.");
    if (response.ok) { event.currentTarget.reset(); await load(); }
    setBusy(false);
  };

  const revoke = async (id: string) => {
    const response = await fetch(`/api/invitations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    setMessage(response.ok ? "Invitación revocada." : data.message ?? "No se pudo revocar.");
    if (response.ok) await load();
  };

  return (
    <AppShell pageTitle="Equipo e invitaciones" pageSubtitle="Altas verificadas y membresías multiempresa">
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-5 shadow-sm">
          <div><h2 className="font-heading text-lg">Invitar colaborador</h2><p className="mt-1 text-sm text-muted-foreground">El enlace expira en 72 horas y sólo puede utilizarse una vez.</p></div>
          <label className="block text-sm">Correo<input name="email" type="email" required className="mt-1 h-11 w-full rounded-lg border px-3" /></label>
          <label className="block text-sm">Rol<select name="rol" required className="mt-1 h-11 w-full rounded-lg border bg-card px-3"><option>Administrador</option><option>Gerente de Campo</option><option>Supervisor</option><option>Operador</option><option>Analista</option><option>Jornalero</option></select></label>
          <label className="block text-sm">Departamento<select name="departamento" required className="mt-1 h-11 w-full rounded-lg border bg-card px-3"><option value="Administrativo">Administrativo</option><option value="Operativo">Operativo</option><option value="Tecnologico">Tecnológico</option></select></label>
          <button disabled={busy} className="h-11 w-full rounded-lg bg-[var(--primary)] text-sm text-white disabled:opacity-60">{busy ? "Enviando…" : "Enviar invitación"}</button>
          {message && <p className="rounded-lg border bg-secondary p-3 text-sm">{message}</p>}
        </form>
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
          <div className="border-b p-5"><h2 className="font-heading text-lg">Historial de invitaciones</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-secondary"><tr><th className="p-3">Correo</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Vence</th><th className="p-3"></th></tr></thead><tbody>{items.map((item) => { const state = item.aceptada_en ? "Aceptada" : item.revocada_en ? "Revocada" : new Date(item.expira_en) < new Date() ? "Vencida" : "Pendiente"; return <tr key={item.id} className="border-t"><td className="p-3">{item.email_destino}</td><td className="p-3">{item.rol}</td><td className="p-3">{state}</td><td className="p-3">{new Date(item.expira_en).toLocaleString("es-HN")}</td><td className="p-3">{state === "Pendiente" && <button onClick={() => void revoke(item.id)} className="text-red-600 hover:underline">Revocar</button>}</td></tr>; })}</tbody></table></div>
        </section>
      </div>
    </AppShell>
  );
}
