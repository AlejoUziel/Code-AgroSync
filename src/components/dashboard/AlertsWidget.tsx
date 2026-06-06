"use client";

import { AlertTriangle, Info, XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const alerts = [
  {
    id: 1,
    type: "danger",
    title: "Plaga detectada",
    desc: "Parcela Norte-12 — Áfidos en maíz",
    time: "hace 2h",
  },
  {
    id: 2,
    type: "warning",
    title: "Riego programado",
    desc: "Zona B — Inicia en 3 horas",
    time: "hace 4h",
  },
  {
    id: 3,
    type: "info",
    title: "Cosecha completada",
    desc: "Lote 7 — 48.3 t recolectadas",
    time: "hace 6h",
  },
  {
    id: 4,
    type: "success",
    title: "Inventario actualizado",
    desc: "Fertilizante NPK — Stock OK",
    time: "hace 8h",
  },
];

const alertConfig = {
  danger: {
    icon: <XCircle size={13} />,
    color: "text-red-500",
    bg: "bg-red-50",
    dot: "bg-red-500",
  },
  warning: {
    icon: <AlertTriangle size={13} />,
    color: "text-amber-500",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  info: {
    icon: <Info size={13} />,
    color: "text-blue-500",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  success: {
    icon: <CheckCircle2 size={13} />,
    color: "text-[var(--primary)]",
    bg: "bg-[var(--secondary)]",
    dot: "bg-[var(--primary)]",
  },
};

export default function AlertsWidget() {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-sm text-[#1E1E1E]">Alertas Recientes</h2>
        <Badge className="bg-red-100 text-red-500 border-0 text-[10px] px-1.5 py-0 h-4">
          1 crítica
        </Badge>
      </div>

      <div className="space-y-2 flex-1">
        {alerts.map((alert) => {
          const cfg = alertConfig[alert.type as keyof typeof alertConfig];
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity",
                cfg.bg
              )}
            >
              <span className={cn("mt-0.5 shrink-0", cfg.color)}>{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium-body text-xs text-[#1E1E1E] truncate">
                  {alert.title}
                </p>
                <p className="font-body text-[11px] text-[#6B7280] truncate">
                  {alert.desc}
                </p>
              </div>
              <span className="font-body text-[10px] text-[#9CA3AF] shrink-0 whitespace-nowrap">
                {alert.time}
              </span>
            </div>
          );
        })}
      </div>

      <button className="mt-3 flex items-center gap-1 text-xs font-body text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
        Ver todas las alertas <ArrowRight size={12} />
      </button>
    </div>
  );
}
