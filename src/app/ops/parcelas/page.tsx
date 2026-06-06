"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Plus, MapPin, MoreHorizontal } from "lucide-react";

const parcelas = [
  { id: "P-001", nombre: "Norte-08", hectareas: 42.5, cultivo: "Maíz", estado: "Activa", progreso: 78, zona: "Zona Norte" },
  { id: "P-002", nombre: "Norte-12", hectareas: 38.0, cultivo: "Trigo", estado: "Alerta", progreso: 55, zona: "Zona Norte" },
  { id: "P-003", nombre: "Sur-03", hectareas: 61.2, cultivo: "Sorgo", estado: "Activa", progreso: 90, zona: "Zona Sur" },
  { id: "P-004", nombre: "Sur-07", hectareas: 29.8, cultivo: "Maíz", estado: "En Preparación", progreso: 20, zona: "Zona Sur" },
  { id: "P-005", nombre: "Este-04", hectareas: 54.1, cultivo: "Frijol", estado: "Activa", progreso: 65, zona: "Zona Este" },
  { id: "P-006", nombre: "Oeste-01", hectareas: 33.7, cultivo: "Trigo", estado: "En Descanso", progreso: 0, zona: "Zona Oeste" },
];

const estadoConfig: Record<string, { color: string; dot: string }> = {
  "Activa": { color: "bg-[var(--secondary)] text-[var(--primary)] border-0", dot: "bg-[var(--primary)]" },
  "Alerta": { color: "bg-amber-50 text-amber-600 border-0", dot: "bg-amber-500" },
  "En Preparación": { color: "bg-blue-50 text-blue-600 border-0", dot: "bg-blue-500" },
  "En Descanso": { color: "bg-gray-100 text-gray-500 border-0", dot: "bg-gray-400" },
};

export default function ParcelasPage() {
  return (
    <AppShell pageTitle="Gestión de Parcelas" pageSubtitle="Operativo · 47 parcelas registradas">
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Parcelas", value: "47", sub: "registradas" },
            { label: "Total Hectáreas", value: "2,841", sub: "hectáreas" },
            { label: "En Producción", value: "38", sub: "activas" },
            { label: "En Alerta", value: "2", sub: "requieren atención" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[var(--border)] p-4">
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-1">{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-[var(--border)]">
          {/* Toolbar */}
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 bg-[var(--background)] rounded-lg px-3 py-2 border border-[var(--border)] flex-1 max-w-xs focus-within:border-[var(--primary)] transition-colors">
              <Search size={13} className="text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Buscar parcela..."
                className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 hover:text-[#1E1E1E] transition-all">
              <Filter size={13} /> Filtrar
            </button>
            <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors">
              <Plus size={13} /> Nueva Parcela
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["ID", "Nombre", "Zona", "Cultivo", "Hectáreas", "Progreso", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parcelas.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--secondary)] hover:bg-[var(--background)] transition-colors group"
                  >
                    <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[var(--primary)]/10 flex items-center justify-center">
                          <MapPin size={11} className="text-[var(--primary)]" />
                        </div>
                        <span className="font-medium-body text-xs text-[#1E1E1E]">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{p.zona}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{p.cultivo}</td>
                    <td className="px-4 py-3 font-medium-body text-xs text-[#1E1E1E]">{p.hectareas} ha</td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={p.progreso} className="h-1.5 flex-1 bg-[var(--border)]" />
                        <span className="font-body text-[11px] text-[#9CA3AF] w-7 shrink-0">{p.progreso}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 py-0.5 ${estadoConfig[p.estado].color} flex items-center gap-1 w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estadoConfig[p.estado].dot}`} />
                        {p.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[#1E1E1E]">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="font-body text-xs text-[#9CA3AF]">Mostrando 6 de 47 parcelas</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, "...", 8].map((p, i) => (
                <button
                  key={i}
                  className={`w-7 h-7 rounded-md text-xs font-body transition-colors ${
                    p === 1
                      ? "bg-[var(--primary)] text-white"
                      : "text-[#6B7280] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
