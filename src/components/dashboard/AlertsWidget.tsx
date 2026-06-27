"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CloudRain, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const alerts = [
  { id: 1, type: "danger", title: "Riesgo de plaga", desc: "Maiz · Olancho · revisar 12 ha", time: "hace 20m", href: "/tech/alertas" },
  { id: 2, type: "warning", title: "Riego recomendado", desc: "Choluteca · humedad bajo 42%", time: "hace 1h", href: "/ops/parcelas" },
  { id: 3, type: "rain", title: "Lluvia probable", desc: "Comayagua · ajustar fertilizacion", time: "hace 3h", href: "/tech/mapa" },
  { id: 4, type: "success", title: "Inventario listo", desc: "NPK y urea con stock suficiente", time: "hace 5h", href: "/ops/inventario" },
];

const alertConfig = {
  danger: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
  rain: { icon: CloudRain, color: "text-blue-500", bg: "bg-blue-50" },
  success: { icon: CheckCircle2, color: "text-[var(--primary)]", bg: "bg-[var(--secondary)]" },
};

export default function AlertsWidget() {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-sm text-[#1E1E1E]">Alertas operativas</h2>
        <Badge className="h-5 border-0 bg-red-100 px-2 text-[10px] text-red-500">1 critica</Badge>
      </div>

      <div className="flex-1 space-y-2">
        {alerts.map((alert) => {
          const cfg = alertConfig[alert.type as keyof typeof alertConfig];
          return (
            <Link
              key={alert.id}
              href={alert.href}
              className={cn("group flex items-start gap-2.5 rounded-lg p-2.5 transition-opacity hover:opacity-85", cfg.bg)}
            >
              <cfg.icon size={14} className={cn("mt-0.5 shrink-0", cfg.color)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium-body text-[#1E1E1E]">{alert.title}</p>
                <p className="truncate text-[11px] font-body text-[#6B7280]">{alert.desc}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[10px] font-body text-[#9CA3AF]">{alert.time}</span>
            </Link>
          );
        })}
      </div>

      <Link href="/tech/alertas" className="mt-3 flex items-center gap-1 text-xs font-body text-[var(--primary)] hover:text-[var(--primary-dark)]">
        Ver todas las alertas <ArrowRight size={12} />
      </Link>
    </div>
  );
}
