"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AppShell from "@/components/layout/AppShell";

type Status = { configured: boolean; enabled: boolean; confirmedAt: string | null; required: boolean };

export default function SecuritySettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [enrollment, setEnrollment] = useState<{ qrDataUrl: string; manualKey: string } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const response = await fetch("/api/security/mfa", { cache: "no-store" });
    if (response.ok) setStatus(await response.json());
  };
  useEffect(() => {
    let active = true;
    void fetch("/api/security/mfa", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && data) setStatus(data);
      });
    return () => { active = false; };
  }, []);

  const begin = async () => {
    setBusy(true); setMessage("");
    const response = await fetch("/api/security/mfa", { method: "POST" });
    const data = await response.json();
    if (response.ok) setEnrollment(data); else setMessage(data.message ?? "No se pudo iniciar MFA.");
    setBusy(false);
  };

  const confirm = async () => {
    setBusy(true); setMessage("");
    const response = await fetch("/api/security/mfa", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await response.json();
    if (response.ok) {
      setRecoveryCodes(data.recoveryCodes ?? []);
      setEnrollment(null);
      setMessage("MFA quedó habilitado. Guarda los códigos de recuperación ahora.");
      await refresh();
    } else setMessage(data.message ?? "No se pudo confirmar MFA.");
    setBusy(false);
  };

  return (
    <AppShell pageTitle="Seguridad de la cuenta" pageSubtitle="Segundo factor, sesiones y recuperación">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-2xl border border-[var(--border)] bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h2 className="font-heading text-lg">Autenticación multifactor TOTP</h2><p className="mt-1 text-sm text-muted-foreground">Compatible con Google Authenticator, Microsoft Authenticator y aplicaciones TOTP.</p></div>
            <span className={`rounded-full px-3 py-1 text-xs ${status?.enabled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{status?.enabled ? "Habilitado" : "Pendiente"}</span>
          </div>
          {status?.required && !status.enabled && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">MFA es obligatorio para administradores de plataforma. El resto del sistema permanecerá restringido hasta completar esta configuración.</p>}
          {!status?.enabled && !enrollment && <button onClick={begin} disabled={busy} className="mt-5 h-11 rounded-lg bg-[var(--primary)] px-5 text-sm text-white disabled:opacity-60">Configurar MFA</button>}
          {enrollment && (
            <div className="mt-5 grid gap-6 md:grid-cols-[280px_1fr]">
              <Image src={enrollment.qrDataUrl} alt="Código QR para configurar MFA" width={280} height={280} unoptimized className="h-[280px] w-[280px] rounded-xl border bg-white" />
              <div className="space-y-4"><p className="text-sm">Escanea el QR. Si no puedes, usa esta clave manual:</p><code className="block break-all rounded-lg bg-secondary p-3 text-xs">{enrollment.manualKey}</code><label className="block text-sm">Código de seis dígitos<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" className="mt-1 h-11 w-full rounded-lg border px-3" /></label><button onClick={confirm} disabled={busy || code.length !== 6} className="h-11 rounded-lg bg-[var(--primary)] px-5 text-sm text-white disabled:opacity-60">Confirmar y activar</button></div>
            </div>
          )}
          {message && <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{message}</p>}
        </section>
        {recoveryCodes.length > 0 && <section className="rounded-2xl border border-red-200 bg-red-50 p-5"><h2 className="font-heading text-lg text-red-800">Códigos de recuperación</h2><p className="mt-1 text-sm text-red-700">Se muestran una sola vez. Guarda cada código fuera del sistema.</p><div className="mt-4 grid grid-cols-1 gap-2 font-mono text-sm sm:grid-cols-2">{recoveryCodes.map((item) => <code key={item} className="rounded bg-white px-3 py-2">{item}</code>)}</div></section>}
      </div>
    </AppShell>
  );
}
