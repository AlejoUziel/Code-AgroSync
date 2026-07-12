"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, PackageCheck, Sprout, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    user: "Carlos R.",
    action: "registro cosecha en",
    target: "Parcela Norte-08",
    detail: "320 toneladas de maiz",
    time: "10:42",
    type: "harvest",
    href: "/ops/produccion",
  },
  {
    id: 2,
    user: "Maria L.",
    action: "aplico tratamiento en",
    target: "Lote B-12",
    detail: "Fungicida preventivo",
    time: "09:18",
    type: "treatment",
    href: "/tech/alertas",
  },
  {
    id: 3,
    user: "Admin",
    action: "actualizo inventario",
    target: "Fertilizante NPK",
    detail: "2,400 kg ingresados",
    time: "08:55",
    type: "inventory",
    href: "/ops/inventario",
  },
  {
    id: 4,
    user: "Juan P.",
    action: "creo nuevo cultivo en",
    target: "Parcela Sur-03",
    detail: "Sorgo - Ciclo primavera",
    time: "08:22",
    type: "crop",
    href: "/ops/cultivos",
  },
  {
    id: 5,
    user: "Sistema",
    action: "genero reporte automatico",
    target: "Produccion mensual",
    detail: "Mayo 2026 completado",
    time: "Ayer",
    type: "report",
    href: "/tech/reportes",
  },
];

const typeConfig = {
  harvest: { icon: ClipboardCheck, color: "bg-[var(--primary)]/15 text-[var(--primary)]" },
  treatment: { icon: Wrench, color: "bg-amber-100 text-amber-600" },
  inventory: { icon: PackageCheck, color: "bg-blue-100 text-blue-600" },
  crop: { icon: Sprout, color: "bg-[var(--accent)]/20 text-[var(--primary-dark)]" },
  report: { icon: FileText, color: "bg-slate-100 text-slate-600" },
};

export default function RecentActivity() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-sm text-[#1E1E1E]">Actividad reciente</h2>
        <Link href="/tech/reportes" className="flex items-center gap-1 text-xs font-body text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)]">
          Ver registro completo <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => {
          const cfg = typeConfig[activity.type as keyof typeof typeConfig];
          return (
            <Link
              key={activity.id}
              href={activity.href}
              className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--secondary)]/70"
            >
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", cfg.color)}>
                <cfg.icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-body leading-relaxed text-[#1E1E1E]">
                  <span className="font-medium-body">{activity.user}</span> {activity.action}{" "}
                  <span className="font-medium-body text-[var(--primary)]">{activity.target}</span>
                </p>
                <p className="text-[11px] font-body text-[#9CA3AF]">{activity.detail}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[10px] font-body text-[#C4C4C4]">{activity.time}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
