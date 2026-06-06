"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { FileBarChart2, Download, Plus, Filter, Eye, Calendar } from "lucide-react";

const reportes = [
  { id: "R-001", titulo: "Producción Mensual — Mayo 2026", tipo: "Producción", generado: "01 Jun 2026", tamaño: "2.4 MB", formato: "PDF", estado: "Listo" },
  { id: "R-002", titulo: "Inventario Agrícola Q2 2026", tipo: "Inventario", generado: "31 May 2026", tamaño: "1.8 MB", formato: "Excel", estado: "Listo" },
  { id: "R-003", titulo: "Análisis de Costos Operativos", tipo: "Finanzas", generado: "29 May 2026", tamaño: "3.1 MB", formato: "PDF", estado: "Listo" },
  { id: "R-004", titulo: "Rendimiento por Parcela — Semestre 1", tipo: "Rendimiento", generado: "28 May 2026", tamaño: "4.2 MB", formato: "PDF", estado: "Listo" },
  { id: "R-005", titulo: "Nómina y Productividad Empleados", tipo: "RRHH", generado: "En progreso...", tamaño: "—", formato: "Excel", estado: "Generando" },
];

const reportesTipo: Record<string, string> = {
  "Producción": "bg-[#F0F5EA] text-[#8EBF24]",
  "Inventario": "bg-blue-50 text-blue-600",
  "Finanzas": "bg-purple-50 text-purple-600",
  "Rendimiento": "bg-amber-50 text-amber-600",
  "RRHH": "bg-teal-50 text-teal-600",
};

const templates = [
  { titulo: "Producción y Cosecha", desc: "Toneladas por parcela, rendimiento y comparativo", icon: "📊" },
  { titulo: "Estado Financiero", desc: "Ingresos, gastos, utilidad y margen", icon: "💰" },
  { titulo: "Inventario Completo", desc: "Stock actual, mínimos y alertas", icon: "📦" },
  { titulo: "Rendimiento de Cultivos", desc: "Análisis por tipo de cultivo y zona", icon: "🌱" },
  { titulo: "Reporte de Empleados", desc: "Actividad, asistencia y nómina", icon: "👥" },
  { titulo: "Alertas y Eventos", desc: "Log completo de incidencias del período", icon: "🔔" },
];

export default function ReportesPage() {
  return (
    <AppShell pageTitle="Reportes" pageSubtitle="Tecnológico · Generación y descarga de informes">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Reportes Generados", value: "142", sub: "este año" },
            { label: "Este Mes", value: "18", sub: "informes" },
            { label: "Descargados", value: "87", sub: "en 30 días" },
            { label: "Automáticos", value: "12", sub: "programados" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2EDD6] p-4">
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-1">{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Templates */}
        <div className="bg-white rounded-xl border border-[#E2EDD6] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-sm text-[#1E1E1E]">Plantillas de Reportes</h2>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8EBF24] text-white text-xs font-medium-body hover:bg-[#6E9A1A] transition-colors">
              <Plus size={13} /> Nuevo Reporte
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {templates.map((t) => (
              <button
                key={t.titulo}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E2EDD6] hover:border-[#8EBF24]/40 hover:bg-[#F9FBF6] transition-all text-left group"
              >
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="font-medium-body text-xs text-[#1E1E1E] group-hover:text-[#8EBF24] transition-colors">{t.titulo}</p>
                  <p className="font-body text-[11px] text-[#9CA3AF] mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div className="bg-white rounded-xl border border-[#E2EDD6]">
          <div className="flex items-center gap-3 p-4 border-b border-[#E2EDD6]">
            <h2 className="font-heading text-sm text-[#1E1E1E]">Reportes Recientes</h2>
            <button className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2EDD6] text-xs font-body text-[#6B7280] hover:border-[#8EBF24]/40 transition-all">
              <Filter size={12} /> Filtrar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2EDD6]">
                  {["ID", "Título", "Tipo", "Generado", "Tamaño", "Formato", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportes.map((r) => (
                  <tr key={r.id} className="border-b border-[#F0F5EA] hover:bg-[#F9FBF6] transition-colors group">
                    <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileBarChart2 size={13} className="text-[#8EBF24] shrink-0" />
                        <span className="font-medium-body text-xs text-[#1E1E1E]">{r.titulo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 border-0 ${reportesTipo[r.tipo]}`}>{r.tipo}</Badge>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[#9CA3AF] whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Calendar size={10} />{r.generado}</div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[#9CA3AF]">{r.tamaño}</td>
                    <td className="px-4 py-3">
                      <Badge className="text-[10px] px-2 border-0 bg-gray-100 text-gray-600">{r.formato}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 border-0 ${r.estado === "Listo" ? "bg-[#F0F5EA] text-[#8EBF24]" : "bg-blue-50 text-blue-600"}`}>{r.estado}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-[#F0F5EA] text-[#9CA3AF] hover:text-[#8EBF24] transition-colors" title="Ver">
                          <Eye size={13} />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-[#F0F5EA] text-[#9CA3AF] hover:text-[#8EBF24] transition-colors" title="Descargar">
                          <Download size={13} />
                        </button>
                      </div>
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
