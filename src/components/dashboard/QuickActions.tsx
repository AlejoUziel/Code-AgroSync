"use client";

import Link from "next/link";
import { ChevronRight, FileBarChart2, MapPin, PackagePlus, Sprout, UserPlus } from "lucide-react";
import { useSessionUser } from "@/hooks/useSessionUser";

const actions = [
  { label: "Nueva parcela", desc: "Mapa Honduras", icon: MapPin, href: "/ops/parcelas", departments: ["Operativo"] },
  { label: "Registrar cultivo", desc: "Ciclo agricola", icon: Sprout, href: "/ops/cultivos", departments: ["Operativo"] },
  { label: "Registrar cosecha", desc: "Produccion", icon: PackagePlus, href: "/ops/produccion", departments: ["Operativo"] },
  { label: "Nuevo empleado", desc: "Cuadrilla", icon: UserPlus, href: "/admin/empleados", departments: ["Administrativo"] },
  { label: "Generar reporte", desc: "PDF tecnico", icon: FileBarChart2, href: "/tech/reportes", departments: ["Tecnologico"] },
];

export default function QuickActions() {
  const user = useSessionUser();
  const visibleActions = actions.filter((action) => user?.departamento === "AdministradorIT" || action.departments.includes(user?.departamento ?? ""));
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-sm text-[#1E1E1E]">Acciones rapidas</h2>
        <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] text-[var(--primary)]">{visibleActions.length} activas</span>
      </div>
      <div className="space-y-2">
        {visibleActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 transition-all hover:border-[var(--primary)]/50 hover:bg-[var(--secondary)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)]/20">
              <action.icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium-body text-[#1E1E1E]">{action.label}</p>
              <p className="text-[10px] font-body text-[#9CA3AF]">{action.desc}</p>
            </div>
            <ChevronRight size={14} className="text-[#C4C4C4] transition-colors group-hover:text-[var(--primary)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
