"use client";

import { Plus, MapPin, Sprout, Package, Users, FileBarChart2 } from "lucide-react";

const actions = [
  {
    label: "Nueva Parcela",
    icon: <MapPin size={16} className="text-[var(--primary)]" />,
    href: "/ops/parcelas",
  },
  {
    label: "Registrar Cultivo",
    icon: <Sprout size={16} className="text-[var(--primary)]" />,
    href: "/ops/cultivos",
  },
  {
    label: "Registrar Cosecha",
    icon: <Package size={16} className="text-[var(--primary)]" />,
    href: "/ops/produccion",
  },
  {
    label: "Nuevo Empleado",
    icon: <Users size={16} className="text-[var(--primary)]" />,
    href: "/admin/empleados",
  },
  {
    label: "Generar Reporte",
    icon: <FileBarChart2 size={16} className="text-[var(--primary)]" />,
    href: "/tech/reportes",
  },
];

export default function QuickActions() {
  return (
    <div className="bg-card rounded-xl border border-[var(--border)] p-4">
      <h2 className="font-heading text-sm text-[#1E1E1E] mb-3">Acciones Rápidas</h2>
      <div className="space-y-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)] transition-all duration-150 group text-left"
          >
            <div className="w-7 h-7 rounded-md bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
              {action.icon}
            </div>
            <span className="font-body text-xs text-[#1E1E1E]">{action.label}</span>
            <Plus
              size={12}
              className="ml-auto text-[#C4C4C4] group-hover:text-[var(--primary)] transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
