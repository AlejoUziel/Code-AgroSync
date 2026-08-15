"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

type BillingState = {
  configured: boolean;
  subscription: null | {
    plan_id: string; estado: string; proveedor: string | null; cancelar_fin_periodo: boolean;
    periodo_finaliza_en: string | null; trial_finaliza_en: string | null;
  };
};

const plans = [
  { id: "starter", name: "Starter", description: "Operación agrícola inicial", features: ["Hasta 5 usuarios", "Hasta 10 parcelas", "10 reportes PDF"] },
  { id: "pro", name: "Pro", description: "Equipos agrícolas en crecimiento", features: ["Hasta 25 usuarios", "Hasta 100 parcelas", "100 reportes PDF"] },
  { id: "enterprise", name: "Enterprise", description: "Operación sin límites predefinidos", features: ["Usuarios ampliables", "Parcelas ampliables", "Soporte empresarial"] },
];

export default function BillingPage() {
  const [state, setState] = useState<BillingState | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    let active = true;
    void fetch("/api/billing", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok) setState(data);
        else setMessage(data.message ?? "No se pudo consultar billing.");
      })
      .catch(() => {
        if (active) setMessage("No se pudo consultar billing.");
      });
    return () => { active = false; };
  }, []);

  const checkout = async (plan: string) => {
    setBusy(plan); setMessage("");
    const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
    const data = await response.json();
    if (response.ok && data.url) window.location.assign(data.url); else setMessage(data.message ?? "No se pudo abrir Checkout.");
    setBusy("");
  };
  const portal = async () => {
    setBusy("portal");
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = await response.json();
    if (response.ok && data.url) window.location.assign(data.url); else setMessage(data.message ?? "No se pudo abrir el portal.");
    setBusy("");
  };

  return (
    <AppShell pageTitle="Facturación SaaS" pageSubtitle="Stripe Checkout, suscripción y portal de cliente">
      <div className="space-y-5">
        {!state?.configured && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">La integración está implementada, pero Stripe aún requiere sus claves y Price IDs en Vercel.</div>}
        {state?.subscription && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-card p-5"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Suscripción actual</p><h2 className="mt-1 font-heading text-2xl capitalize">{state.subscription.plan_id}</h2><p className="text-sm text-muted-foreground">Estado: {state.subscription.estado}{state.subscription.cancelar_fin_periodo ? " · cancela al finalizar el periodo" : ""}</p></div>{state.subscription.proveedor === "stripe" && <button onClick={portal} disabled={busy === "portal"} className="h-11 rounded-lg border px-5 text-sm">Administrar pagos y facturas</button>}</section>}
        <div className="grid gap-4 lg:grid-cols-3">{plans.map((plan) => <article key={plan.id} className={`rounded-2xl border bg-card p-5 shadow-sm ${state?.subscription?.plan_id === plan.id ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10" : "border-[var(--border)]"}`}><h2 className="font-heading text-xl">{plan.name}</h2><p className="mt-1 text-sm text-muted-foreground">{plan.description}</p><ul className="my-5 space-y-2 text-sm">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><button onClick={() => void checkout(plan.id)} disabled={!state?.configured || Boolean(busy)} className="h-11 w-full rounded-lg bg-[var(--primary)] text-sm text-white disabled:opacity-50">{busy === plan.id ? "Abriendo Stripe…" : state?.subscription?.plan_id === plan.id ? "Gestionar este plan" : `Elegir ${plan.name}`}</button></article>)}</div>
        {message && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{message}</p>}
      </div>
    </AppShell>
  );
}
