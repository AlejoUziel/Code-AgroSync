"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const ingresoData = [
  { mes: "Ene", ingresos: 480000, gastos: 310000 },
  { mes: "Feb", ingresos: 420000, gastos: 280000 },
  { mes: "Mar", ingresos: 560000, gastos: 390000 },
  { mes: "Abr", ingresos: 510000, gastos: 340000 },
  { mes: "May", ingresos: 680000, gastos: 420000 },
  { mes: "Jun", ingresos: 620000, gastos: 380000 },
];

const transacciones = [
  { id: "T-001", concepto: "Venta Cosecha Maíz — Lote Norte-08", tipo: "Ingreso", monto: "+$128,400", fecha: "02 Jun", categoria: "Venta" },
  { id: "T-002", concepto: "Fertilizante NPK — Proveedor AgriMex", tipo: "Egreso", monto: "-$24,800", fecha: "01 Jun", categoria: "Insumos" },
  { id: "T-003", concepto: "Nómina Mayo 2026", tipo: "Egreso", monto: "-$198,000", fecha: "31 May", categoria: "Nómina" },
  { id: "T-004", nombre: "Venta Sorgo — Exportación", tipo: "Ingreso", monto: "+$84,200", fecha: "28 May", categoria: "Venta" },
  { id: "T-005", concepto: "Combustible y Maquinaria", tipo: "Egreso", monto: "-$18,600", fecha: "27 May", categoria: "Operación" },
];

export default function FinanzasPage() {
  return (
    <AppShell pageTitle="Finanzas" pageSubtitle="Administrativo · Estado financiero agrícola">
      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Ingresos (Jun)", value: "$620K", change: "+14.5%", up: true, icon: <DollarSign size={16} className="text-[var(--primary)]" /> },
            { label: "Gastos (Jun)", value: "$380K", change: "+9.2%", up: false, icon: <CreditCard size={16} className="text-amber-500" /> },
            { label: "Utilidad Neta", value: "$240K", change: "+21.3%", up: true, icon: <PiggyBank size={16} className="text-[var(--primary)]" /> },
            { label: "Margen", value: "38.7%", change: "+2.4pp", up: true, icon: <ArrowUpRight size={16} className="text-[var(--primary)]" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center">{s.icon}</div>
                <div className={`flex items-center gap-1 text-[11px] font-body ${s.up ? "text-[var(--primary)]" : "text-red-500"}`}>
                  {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {s.change}
                </div>
              </div>
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ingresos vs Gastos */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-sm text-[#1E1E1E]">Ingresos vs Gastos</h2>
                <p className="font-body text-xs text-[#9CA3AF]">Enero – Junio 2026</p>
              </div>
              <div className="flex items-center gap-3">
                {[{ label: "Ingresos", color: "var(--primary)" }, { label: "Gastos", color: "var(--accent)" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="font-body text-[11px] text-[#6B7280]">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresoData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Outfit" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: "#1E1E1E", border: "none", borderRadius: 10, fontFamily: "Outfit", fontSize: 12, color: "var(--background)" }}
                    formatter={(v) => [`$${((v as number)/1000).toFixed(0)}K`]}
                    cursor={{ fill: "rgba(142,191,36,0.06)" }}
                  />
                  <Bar dataKey="ingresos" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" fill="#D4EE9A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gastos by category */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <h2 className="font-heading text-sm text-[#1E1E1E] mb-4">Distribución de Gastos</h2>
            <div className="space-y-3">
              {[
                { categoria: "Nómina", pct: 52, monto: "$197,600", color: "bg-[var(--primary)]" },
                { categoria: "Insumos y Agroquímicos", pct: 24, monto: "$91,200", color: "bg-[var(--accent)]" },
                { categoria: "Maquinaria y Combustible", pct: 14, monto: "$53,200", color: "bg-amber-400" },
                { categoria: "Logística y Transporte", pct: 6, monto: "$22,800", color: "bg-blue-400" },
                { categoria: "Administrativos", pct: 4, monto: "$15,200", color: "bg-[#D4EE9A]" },
              ].map((c) => (
                <div key={c.categoria}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.color}`} />
                      <span className="font-body text-xs text-[#6B7280]">{c.categoria}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-body text-xs text-[#9CA3AF]">{c.monto}</span>
                      <span className="font-medium-body text-xs text-[#1E1E1E] w-8 text-right">{c.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-[var(--border)]">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="font-heading text-sm text-[#1E1E1E]">Transacciones Recientes</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 transition-all">
              <Download size={12} /> Exportar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["ID", "Concepto", "Categoría", "Tipo", "Monto", "Fecha"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transacciones.map((t) => (
                  <tr key={t.id} className="border-b border-[var(--secondary)] hover:bg-[var(--background)] transition-colors">
                    <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{t.id}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#1E1E1E] max-w-56 truncate">{t.concepto || t.nombre}</td>
                    <td className="px-4 py-3">
                      <Badge className="text-[10px] px-2 border-0 bg-[var(--secondary)] text-[var(--primary)]">{t.categoria}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 border-0 ${t.tipo === "Ingreso" ? "bg-[var(--secondary)] text-[var(--primary)]" : "bg-red-50 text-red-500"}`}>{t.tipo}</Badge>
                    </td>
                    <td className={`px-4 py-3 font-heading text-sm ${t.tipo === "Ingreso" ? "text-[var(--primary)]" : "text-red-500"}`}>{t.monto}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#9CA3AF]">{t.fecha}</td>
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
