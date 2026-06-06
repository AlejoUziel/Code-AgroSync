"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Filter, Package, Download, MoreHorizontal } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const produccionData = [
  { mes: "Ene", toneladas: 840 },
  { mes: "Feb", toneladas: 760 },
  { mes: "Mar", toneladas: 1020 },
  { mes: "Abr", toneladas: 920 },
  { mes: "May", toneladas: 1240 },
  { mes: "Jun", toneladas: 1160 },
];

const cosechas = [
  { id: "H-001", lote: "Norte-08 / Maíz H-507", fecha: "02 Jun 2026", cantidad: "320.4 t", empleados: 18, rendimiento: "7.5 t/ha", calidad: "Premium", estado: "Completada" },
  { id: "H-002", lote: "Sur-03 / Sorgo S-45", fecha: "04 Jun 2026", cantidad: "180.2 t", empleados: 12, rendimiento: "6.2 t/ha", calidad: "Estándar", estado: "Completada" },
  { id: "H-003", lote: "Este-04 / Frijol FB-80", fecha: "10 Jun 2026", cantidad: "95.8 t", empleados: 9, rendimiento: "5.1 t/ha", calidad: "Premium", estado: "En Proceso" },
  { id: "H-004", lote: "Norte-12 / Trigo WW-210", fecha: "25 Jun 2026", cantidad: "Estimado 210 t", empleados: 0, rendimiento: "5.5 t/ha est.", calidad: "—", estado: "Programada" },
];

const estadoConfig: Record<string, string> = {
  "Completada": "bg-[var(--secondary)] text-[var(--primary)] border-0",
  "En Proceso": "bg-blue-50 text-blue-600 border-0",
  "Programada": "bg-amber-50 text-amber-600 border-0",
};

export default function ProduccionPage() {
  return (
    <AppShell pageTitle="Producción y Cosecha" pageSubtitle="Operativo · Registros de cosecha y rendimiento">
      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Cosecha Acumulada", value: "3,842 t", sub: "enero–junio 2026" },
            { label: "Meta Anual", value: "82%", sub: "6,800 t meta" },
            { label: "Rendimiento Prom.", value: "6.8 t/ha", sub: "vs 6.2 t/ha año ant." },
            { label: "Próx. Cosecha", value: "Jun 10", sub: "Frijol Negro FB-80" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-[var(--border)] p-4">
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-1">{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart + meta */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-sm text-[#1E1E1E]">Producción Mensual</h2>
                <p className="font-body text-xs text-[#9CA3AF]">Toneladas cosechadas — 2026</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 transition-all">
                <Download size={12} /> Exportar
              </button>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produccionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1E1E1E", border: "none", borderRadius: 10, fontFamily: "Outfit", fontSize: 12, color: "var(--background)" }}
                    cursor={{ fill: "rgba(142,191,36,0.08)" }}
                    formatter={(v) => [`${v as number} t`, "Producción"]}
                  />
                  <Bar dataKey="toneladas" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-[var(--border)] p-5">
            <h2 className="font-heading text-sm text-[#1E1E1E] mb-3">Meta Anual</h2>
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center mb-3">
                <svg className="w-28 h-28 -rotate-90">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle cx="56" cy="56" r="48" fill="none" stroke="var(--primary)" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 48 * 0.82} ${2 * Math.PI * 48 * 0.18}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <p className="font-heading text-2xl text-[#1E1E1E]">82%</p>
                  <p className="font-body text-[10px] text-[#9CA3AF]">completado</p>
                </div>
              </div>
              <p className="font-body text-xs text-[#9CA3AF]">3,842 t de 6,800 t meta</p>
              <p className="font-body text-[11px] text-[var(--primary)] mt-1">+8.3% vs meta mensual</p>
            </div>
            <div className="space-y-2 mt-2">
              {[
                { label: "Maíz", pct: 88 },
                { label: "Trigo", pct: 70 },
                { label: "Sorgo", pct: 91 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-xs text-[#6B7280]">{item.label}</span>
                    <span className="font-body text-xs text-[#9CA3AF]">{item.pct}%</span>
                  </div>
                  <Progress value={item.pct} className="h-1.5 bg-[var(--border)]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Harvest records */}
        <div className="bg-card rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
            <h2 className="font-heading text-sm text-[#1E1E1E]">Registros de Cosecha</h2>
            <div className="ml-auto flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 transition-all">
                <Filter size={13} /> Filtrar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors">
                <Plus size={13} /> Registrar Cosecha
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["ID", "Lote / Cultivo", "Fecha", "Cantidad", "Empleados", "Rendimiento", "Calidad", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cosechas.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--secondary)] hover:bg-[var(--background)] transition-colors group">
                    <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{c.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[var(--primary)]/10 flex items-center justify-center">
                          <Package size={11} className="text-[var(--primary)]" />
                        </div>
                        <span className="font-medium-body text-xs text-[#1E1E1E]">{c.lote}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280] whitespace-nowrap">{c.fecha}</td>
                    <td className="px-4 py-3 font-medium-body text-xs text-[#1E1E1E]">{c.cantidad}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{c.empleados > 0 ? c.empleados : "—"}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{c.rendimiento}</td>
                    <td className="px-4 py-3">
                      {c.calidad !== "—" ? (
                        <Badge className={`text-[10px] px-2 py-0.5 border-0 ${c.calidad === "Premium" ? "bg-purple-50 text-purple-600" : "bg-[var(--secondary)] text-[var(--primary)]"}`}>{c.calidad}</Badge>
                      ) : <span className="text-[#C4C4C4] text-xs">—</span>}
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
        </div>
      </div>
    </AppShell>
  );
}
