"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Filter, Sprout, Calendar, MoreHorizontal } from "lucide-react";

const cultivos = [
  { id: "C-001", nombre: "Maíz Amarillo H-507", parcela: "Norte-08", inicio: "15 Ene 2026", cosecha: "20 Jul 2026", dias: 156, ciclo: 185, etapa: "Floración", estado: "En Progreso" },
  { id: "C-002", nombre: "Trigo Rojo WW-210", parcela: "Norte-12", inicio: "01 Feb 2026", cosecha: "05 Jun 2026", dias: 60, ciclo: 120, etapa: "Encañado", estado: "Alerta" },
  { id: "C-003", nombre: "Sorgo Dulce S-45", parcela: "Sur-03", inicio: "10 Mar 2026", cosecha: "12 Ago 2026", dias: 87, ciclo: 155, etapa: "Vegetativa", estado: "En Progreso" },
  { id: "C-004", nombre: "Frijol Negro FB-80", parcela: "Este-04", inicio: "22 Mar 2026", cosecha: "30 Jun 2026", dias: 75, ciclo: 100, etapa: "Llenado", estado: "En Progreso" },
  { id: "C-005", nombre: "Maíz Blanco H-310", parcela: "Sur-07", inicio: "01 Abr 2026", cosecha: "15 Sep 2026", dias: 10, ciclo: 167, etapa: "Siembra", estado: "Nuevo" },
];

const estadoConfig: Record<string, string> = {
  "En Progreso": "bg-[var(--secondary)] text-[var(--primary)] border-0",
  "Alerta": "bg-amber-50 text-amber-600 border-0",
  "Nuevo": "bg-blue-50 text-blue-600 border-0",
  "Cosechado": "bg-gray-100 text-gray-500 border-0",
};

const etapaColor: Record<string, string> = {
  "Siembra": "bg-blue-100 text-blue-600",
  "Vegetativa": "bg-emerald-100 text-emerald-600",
  "Floración": "bg-purple-100 text-purple-600",
  "Encañado": "bg-amber-100 text-amber-600",
  "Llenado": "bg-[var(--accent)]/30 text-[var(--primary-dark)]",
};

export default function CultivosPage() {
  return (
    <AppShell pageTitle="Gestión de Cultivos" pageSubtitle="Operativo · 128 cultivos en curso">
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Cultivos Activos", value: "128", sub: "en producción" },
            { label: "Próxima Cosecha", value: "Jun 30", sub: "Frijol Negro FB-80" },
            { label: "Promedio Ciclo", value: "145 días", sub: "duración media" },
            { label: "En Alerta", value: "7", sub: "requieren revisión" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-[var(--border)] p-4">
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-1">{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 bg-[var(--background)] rounded-lg px-3 py-2 border border-[var(--border)] flex-1 max-w-xs focus-within:border-[var(--primary)] transition-colors">
              <Search size={13} className="text-[#9CA3AF]" />
              <input type="text" placeholder="Buscar cultivo..." className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 transition-all">
              <Filter size={13} /> Filtrar
            </button>
            <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors">
              <Plus size={13} /> Registrar Cultivo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["ID", "Cultivo", "Parcela", "Inicio", "Cosecha Estimada", "Progreso Ciclo", "Etapa", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cultivos.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--secondary)] hover:bg-[var(--background)] transition-colors group">
                    <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{c.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[var(--primary)]/10 flex items-center justify-center">
                          <Sprout size={11} className="text-[var(--primary)]" />
                        </div>
                        <span className="font-medium-body text-xs text-[#1E1E1E]">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{c.parcela}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280] whitespace-nowrap">{c.inicio}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-[#C4C4C4]" />
                        {c.cosecha}
                      </div>
                    </td>
                    <td className="px-4 py-3 w-36">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.round((c.dias / c.ciclo) * 100)} className="h-1.5 flex-1 bg-[var(--border)]" />
                        <span className="font-body text-[11px] text-[#9CA3AF] w-7 shrink-0">{Math.round((c.dias / c.ciclo) * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 py-0.5 border-0 ${etapaColor[c.etapa] ?? "bg-gray-100 text-gray-500"}`}>
                        {c.etapa}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 py-0.5 ${estadoConfig[c.estado]}`}>{c.estado}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF]">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="font-body text-xs text-[#9CA3AF]">Mostrando 5 de 128 cultivos</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, "...", 26].map((p, i) => (
                <button key={i} className={`w-7 h-7 rounded-md text-xs font-body transition-colors ${p === 1 ? "bg-[var(--primary)] text-white" : "text-[#6B7280] hover:bg-[var(--secondary)]"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
