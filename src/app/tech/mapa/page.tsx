"use client";

import AppShell from "@/components/layout/AppShell";
import { MapPin, Layers, ZoomIn, ZoomOut, Navigation, Satellite } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Static map placeholder (Leaflet requires client-side only)
const parcelas = [
  { id: "P-001", nombre: "Norte-08", top: "12%", left: "22%", estado: "Activa", cultivo: "Maíz" },
  { id: "P-002", nombre: "Norte-12", top: "18%", left: "55%", estado: "Alerta", cultivo: "Trigo" },
  { id: "P-003", nombre: "Sur-03", top: "64%", left: "35%", estado: "Activa", cultivo: "Sorgo" },
  { id: "P-004", nombre: "Este-04", top: "44%", left: "72%", estado: "Activa", cultivo: "Frijol" },
  { id: "P-005", nombre: "Oeste-01", top: "50%", left: "10%", estado: "En Descanso", cultivo: "Trigo" },
  { id: "P-006", nombre: "Sur-07", top: "76%", left: "60%", estado: "En Preparación", cultivo: "Maíz" },
];

const dotColor: Record<string, string> = {
  "Activa": "bg-[#8EBF24] shadow-[0_0_8px_rgba(142,191,36,0.6)]",
  "Alerta": "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  "En Descanso": "bg-gray-400",
  "En Preparación": "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
};

const layerData = [
  { label: "Parcelas", count: 47, active: true },
  { label: "Cultivos", count: 128, active: true },
  { label: "Alertas", count: 2, active: true },
  { label: "Clima", count: null, active: false },
  { label: "Suelos", count: null, active: false },
];

export default function MapaPage() {
  return (
    <AppShell pageTitle="Mapa Interactivo Agrícola" pageSubtitle="Tecnológico · Vista satelital de parcelas y cultivos">
      <div className="space-y-4">
        {/* Map container */}
        <div className="bg-white rounded-xl border border-[#E2EDD6] overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>
          <div className="flex h-full">
            {/* Left panel */}
            <div className="w-64 border-r border-[#E2EDD6] flex flex-col overflow-hidden shrink-0">
              {/* Layers */}
              <div className="p-4 border-b border-[#E2EDD6]">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={14} className="text-[#8EBF24]" />
                  <h3 className="font-heading text-xs text-[#1E1E1E]">Capas del Mapa</h3>
                </div>
                <div className="space-y-2">
                  {layerData.map((layer) => (
                    <label key={layer.label} className="flex items-center gap-2.5 cursor-pointer group">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${layer.active ? "bg-[#8EBF24] border-[#8EBF24]" : "border-[#E2EDD6] group-hover:border-[#8EBF24]/50"}`}>
                        {layer.active && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="font-body text-xs text-[#6B7280] group-hover:text-[#1E1E1E] transition-colors">{layer.label}</span>
                      {layer.count && <span className="ml-auto font-body text-[10px] text-[#C4C4C4]">{layer.count}</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Parcela list */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1.5">
                <p className="font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider px-1 mb-2">Parcelas</p>
                {parcelas.map((p) => (
                  <button key={p.id} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F9FBF6] transition-colors text-left group">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor[p.estado]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium-body text-xs text-[#1E1E1E] truncate">{p.nombre}</p>
                      <p className="font-body text-[10px] text-[#9CA3AF] truncate">{p.cultivo} · {p.estado}</p>
                    </div>
                    <Navigation size={10} className="text-[#C4C4C4] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Map area */}
            <div className="flex-1 relative bg-[#E8F0DC] overflow-hidden">
              {/* Fake satellite map bg */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(135deg, #C8DFA0 0%, #A8C870 25%, #90B850 50%, #78A038 75%, #608028 100%)",
              }}>
                {/* Field texture lines */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `repeating-linear-gradient(${45 + i * 22}deg, transparent, transparent 60px, rgba(0,0,0,0.1) 60px, rgba(0,0,0,0.1) 62px)`
                  }} />
                ))}
              </div>

              {/* Parcela markers */}
              {parcelas.map((p) => (
                <div
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                  style={{ top: p.top, left: p.left }}
                >
                  <div className="relative">
                    <div className={`w-4 h-4 rounded-full border-2 border-white ${dotColor[p.estado]} transition-transform group-hover:scale-150`} />
                    {/* Tooltip */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-[#1E1E1E] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                        <p className="font-heading text-xs text-white">{p.nombre}</p>
                        <p className="font-body text-[11px] text-white/60">{p.cultivo}</p>
                        <Badge className={`text-[9px] px-1.5 border-0 mt-1 ${p.estado === "Activa" ? "bg-[#8EBF24]/20 text-[#BEE86B]" : p.estado === "Alerta" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/50"}`}>
                          {p.estado}
                        </Badge>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1E1E1E]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Map controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                {[
                  { icon: <ZoomIn size={14} />, label: "Zoom in" },
                  { icon: <ZoomOut size={14} />, label: "Zoom out" },
                  { icon: <Satellite size={14} />, label: "Satélite" },
                ].map((ctrl) => (
                  <button
                    key={ctrl.label}
                    title={ctrl.label}
                    className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-[#6B7280] hover:text-[#8EBF24] hover:shadow-lg transition-all"
                  >
                    {ctrl.icon}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-[#E2EDD6] z-10">
                <p className="font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Leyenda</p>
                {[
                  { label: "Activa", color: "bg-[#8EBF24]" },
                  { label: "En Alerta", color: "bg-amber-500" },
                  { label: "En Preparación", color: "bg-blue-500" },
                  { label: "En Descanso", color: "bg-gray-400" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="font-body text-[11px] text-[#6B7280]">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
