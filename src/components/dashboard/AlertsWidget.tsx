"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCrudResource } from "@/hooks/useCrudResource";
import { useSessionUser } from "@/hooks/useSessionUser";

const severityConfig = {
  Alta: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
  Media: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
  Baja: { icon: CheckCircle2, color: "text-[var(--primary)]", bg: "bg-[var(--secondary)]" },
};

export default function AlertsWidget() {
  const user = useSessionUser();
  const enabled = Boolean(user && (user.departamento === "Tecnologico" || user.departamento === "AdministradorIT"));
  const { records, loading, syncError } = useCrudResource("alertas", enabled);
  const pending = records.filter((record) => String(record.resuelta) !== "Resuelta");
  const critical = pending.filter((record) => String(record.severidad) === "Alta").length;

  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-sm text-[#1E1E1E]">Alertas registradas</h2>
        <Badge className="h-5 border-0 bg-red-100 px-2 text-[10px] text-red-500">{critical} críticas</Badge>
      </div>

      {!enabled ? (
        <p className="rounded-lg bg-[var(--background)] p-3 text-xs text-muted-foreground">
          Este módulo está disponible para Tecnología y Administrador IT.
        </p>
      ) : loading ? (
        <p className="p-3 text-xs text-muted-foreground">Cargando alertas...</p>
      ) : syncError ? (
        <p className="p-3 text-xs text-red-600">No se pudieron consultar las alertas.</p>
      ) : pending.length === 0 ? (
        <p className="rounded-lg bg-[var(--secondary)] p-3 text-xs text-muted-foreground">No hay alertas pendientes.</p>
      ) : (
        <div className="flex-1 space-y-2">
          {pending.slice(0, 4).map((alert) => {
            const cfg = severityConfig[String(alert.severidad) as keyof typeof severityConfig] ?? severityConfig.Media;
            return (
              <Link key={String(alert.id)} href="/tech/alertas" className={`group flex items-start gap-2.5 rounded-lg p-2.5 hover:opacity-85 ${cfg.bg}`}>
                <cfg.icon size={14} className={`mt-0.5 shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium-body text-[#1E1E1E]">{String(alert.tipo)}</p>
                  <p className="line-clamp-2 text-[11px] font-body text-[#6B7280]">{String(alert.mensaje)}</p>
                </div>
                <span className="shrink-0 text-[10px] text-[#9CA3AF]">{String(alert.severidad)}</span>
              </Link>
            );
          })}
        </div>
      )}

      {enabled && (
        <Link href="/tech/alertas" className="mt-3 flex items-center gap-1 text-xs font-body text-[var(--primary)] hover:text-[var(--primary-dark)]">
          Ver todas las alertas <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
