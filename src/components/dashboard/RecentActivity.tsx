"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, FileText, PackageCheck, Sprout, UserSquare2, Wallet } from "lucide-react";

type Activity = {
  id: number;
  user: string;
  action: string;
  resource: string;
  target: string;
  recordId: string;
  createdAt: string;
};

const resourceConfig = {
  cosechas: { icon: ClipboardCheck, label: "cosecha", color: "bg-[var(--primary)]/15 text-[var(--primary)]" },
  cultivos: { icon: Sprout, label: "cultivo", color: "bg-[var(--accent)]/20 text-[var(--primary-dark)]" },
  inventario: { icon: PackageCheck, label: "inventario", color: "bg-blue-100 text-blue-600" },
  empleados: { icon: UserSquare2, label: "empleado", color: "bg-violet-100 text-violet-600" },
  finanzas: { icon: Wallet, label: "transacción", color: "bg-amber-100 text-amber-600" },
  reportes: { icon: FileText, label: "reporte", color: "bg-slate-100 text-slate-600" },
};

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "short" }).format(new Date(value));
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetch("/api/activity", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { items: [] }))
        .then((data) => {
          if (active) setActivities(data.items ?? []);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    load();
    const interval = window.setInterval(load, 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-sm text-[#1E1E1E]">Actividad auditada</h2>
          <p className="text-[10px] text-muted-foreground">Datos reales guardados por el backend</p>
        </div>
        <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] text-[var(--primary)]">{activities.length} eventos</span>
      </div>

      {loading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Cargando actividad...</p>
      ) : activities.length === 0 ? (
        <p className="rounded-lg bg-[var(--background)] p-4 text-center text-xs text-muted-foreground">
          Todavía no hay cambios auditados para los módulos habilitados.
        </p>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => {
            const cfg = resourceConfig[activity.resource as keyof typeof resourceConfig] ?? {
              icon: FileText,
              label: activity.resource,
              color: "bg-slate-100 text-slate-600",
            };
            return (
              <div key={activity.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-[var(--secondary)]/70">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                  <cfg.icon size={14} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-relaxed text-[#1E1E1E]">
                    <span className="font-medium-body">{activity.user}</span> {activity.action} {cfg.label}{" "}
                    <span className="font-medium-body text-[var(--primary)]">{activity.target}</span>
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">{activity.recordId}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[10px] text-[#9CA3AF]">{relativeTime(activity.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
