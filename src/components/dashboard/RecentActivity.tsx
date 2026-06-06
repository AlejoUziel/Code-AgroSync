"use client";

import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    user: "Carlos R.",
    action: "registró cosecha en",
    target: "Parcela Norte-08",
    detail: "320 toneladas de maíz",
    time: "10:42",
    avatar: "CR",
    type: "harvest",
  },
  {
    id: 2,
    user: "María L.",
    action: "aplicó tratamiento en",
    target: "Lote B-12",
    detail: "Fungicida preventivo",
    time: "09:18",
    avatar: "ML",
    type: "treatment",
  },
  {
    id: 3,
    user: "Admin",
    action: "actualizó inventario —",
    target: "Fertilizante NPK",
    detail: "2,400 kg ingresados",
    time: "08:55",
    avatar: "AD",
    type: "inventory",
  },
  {
    id: 4,
    user: "Juan P.",
    action: "creó nuevo cultivo en",
    target: "Parcela Sur-03",
    detail: "Sorgo — Ciclo primavera",
    time: "08:22",
    avatar: "JP",
    type: "crop",
  },
  {
    id: 5,
    user: "Sistema",
    action: "generó reporte automático —",
    target: "Producción mensual",
    detail: "Mayo 2026 completado",
    time: "Ayer",
    avatar: "SI",
    type: "report",
  },
];

const typeColors: Record<string, string> = {
  harvest: "bg-[var(--primary)]/15 text-[var(--primary)]",
  treatment: "bg-amber-100 text-amber-600",
  inventory: "bg-blue-100 text-blue-600",
  crop: "bg-[var(--accent)]/20 text-[var(--primary-dark)]",
  report: "bg-purple-100 text-purple-600",
};

export default function RecentActivity() {
  return (
    <div className="bg-card rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-sm text-[#1E1E1E]">Actividad Reciente</h2>
        <button className="text-xs font-body text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
          Ver registro completo
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 group cursor-default"
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-heading shrink-0",
                typeColors[activity.type]
              )}
            >
              {activity.avatar}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body text-[#1E1E1E] leading-relaxed">
                <span className="font-medium-body">{activity.user}</span>{" "}
                {activity.action}{" "}
                <span className="font-medium-body text-[var(--primary)]">
                  {activity.target}
                </span>
              </p>
              <p className="text-[11px] font-body text-[#9CA3AF]">
                {activity.detail}
              </p>
            </div>

            {/* Time */}
            <span className="font-body text-[10px] text-[#C4C4C4] shrink-0 whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
