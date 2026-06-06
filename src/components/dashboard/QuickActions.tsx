"use client";

import { Plus, MapPin, Sprout, Package, Users, FileBarChart2 } from "lucide-react";

const actions = [
  {
    label: "Nueva Parcela",
    icon: <MapPin size={16} className="text-[#8EBF24]" />,
    href: "/ops/parcelas",
  },
  {
    label: "Registrar Cultivo",
    icon: <Sprout size={16} className="text-[#8EBF24]" />,
    href: "/ops/cultivos",
  },
  {
    label: "Registrar Cosecha",
    icon: <Package size={16} className="text-[#8EBF24]" />,
    href: "/ops/produccion",
  },
  {
    label: "Nuevo Empleado",
    icon: <Users size={16} className="text-[#8EBF24]" />,
    href: "/admin/empleados",
  },
  {
    label: "Generar Reporte",
    icon: <FileBarChart2 size={16} className="text-[#8EBF24]" />,
    href: "/tech/reportes",
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl border border-[#E2EDD6] p-4">
      <h2 className="font-heading text-sm text-[#1E1E1E] mb-3">Acciones Rápidas</h2>
      <div className="space-y-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#F9FBF6] border border-[#E2EDD6] hover:border-[#8EBF24]/40 hover:bg-[#F0F5EA] transition-all duration-150 group text-left"
          >
            <div className="w-7 h-7 rounded-md bg-[#8EBF24]/10 flex items-center justify-center group-hover:bg-[#8EBF24]/20 transition-colors">
              {action.icon}
            </div>
            <span className="font-body text-xs text-[#1E1E1E]">{action.label}</span>
            <Plus
              size={12}
              className="ml-auto text-[#C4C4C4] group-hover:text-[#8EBF24] transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
