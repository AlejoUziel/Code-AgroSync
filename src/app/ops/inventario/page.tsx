"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Filter, AlertTriangle, MoreHorizontal, WarehouseIcon } from "lucide-react";

const inventario = [
  { id: "INV-001", nombre: "Fertilizante NPK 20-20-20", categoria: "Fertilizante", stock: 4800, unidad: "kg", minimo: 1000, ubicacion: "Bodega A", estado: "Disponible" },
  { id: "INV-002", nombre: "Herbicida Glifosato 480SL", categoria: "Agroquímico", stock: 280, unidad: "lt", minimo: 300, ubicacion: "Bodega B", estado: "Stock Bajo" },
  { id: "INV-003", nombre: "Semilla Maíz H-507", categoria: "Semilla", stock: 15000, unidad: "kg", minimo: 2000, ubicacion: "Silo 1", estado: "Disponible" },
  { id: "INV-004", nombre: "Fungicida Mancozeb 80WP", categoria: "Agroquímico", stock: 520, unidad: "kg", minimo: 200, ubicacion: "Bodega B", estado: "Disponible" },
  { id: "INV-005", nombre: "Fuel Diésel Agrícola", categoria: "Combustible", stock: 3400, unidad: "lt", minimo: 5000, ubicacion: "Tanque 1", estado: "Stock Bajo" },
  { id: "INV-006", nombre: "Urea 46%", categoria: "Fertilizante", stock: 0, unidad: "kg", minimo: 500, ubicacion: "Bodega A", estado: "Agotado" },
];

const estadoConfig: Record<string, { badge: string; dot: string }> = {
  "Disponible": { badge: "bg-[var(--secondary)] text-[var(--primary)] border-0", dot: "bg-[var(--primary)]" },
  "Stock Bajo": { badge: "bg-amber-50 text-amber-600 border-0", dot: "bg-amber-500" },
  "Agotado": { badge: "bg-red-50 text-red-500 border-0", dot: "bg-red-500" },
};

const categoriaColor: Record<string, string> = {
  "Fertilizante": "bg-[var(--accent)]/20 text-[var(--primary-dark)]",
  "Agroquímico": "bg-orange-100 text-orange-600",
  "Semilla": "bg-emerald-100 text-emerald-600",
  "Combustible": "bg-gray-100 text-gray-600",
};

export default function InventarioPage() {
  return (
    <AppShell pageTitle="Inventario Agrícola" pageSubtitle="Operativo · Control de insumos y materiales">
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Ítems", value: "342", sub: "registrados" },
            { label: "Stock Bajo", value: "12", sub: "requieren reposición", alert: true },
            { label: "Agotados", value: "3", sub: "sin stock", alert: true },
            { label: "Valor Inventario", value: "$284K", sub: "valorización total" },
          ].map((s) => (
            <div key={s.label} className={`bg-card rounded-xl border p-4 ${s.alert ? "border-amber-200" : "border-[var(--border)]"}`}>
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className={`font-heading text-2xl mt-1 ${s.alert ? "text-amber-500" : "text-[#1E1E1E]"}`}>{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Alert banner */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="font-body text-sm text-amber-700">
            <span className="font-medium-body">Atención:</span> 12 ítems con stock bajo y 3 agotados. Se requiere orden de compra.
          </p>
          <button className="ml-auto text-xs font-medium-body text-amber-600 hover:text-amber-800 transition-colors whitespace-nowrap">
            Ver todos →
          </button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 bg-[var(--background)] rounded-lg px-3 py-2 border border-[var(--border)] flex-1 max-w-xs focus-within:border-[var(--primary)] transition-colors">
              <Search size={13} className="text-[#9CA3AF]" />
              <input type="text" placeholder="Buscar insumo..." className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 transition-all">
              <Filter size={13} /> Filtrar
            </button>
            <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors">
              <Plus size={13} /> Agregar Ítem
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["ID", "Nombre", "Categoría", "Stock", "Stock Mínimo", "Nivel", "Ubicación", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventario.map((item) => {
                  const pct = item.minimo > 0 ? Math.min(100, Math.round((item.stock / (item.minimo * 3)) * 100)) : 0;
                  return (
                    <tr key={item.id} className="border-b border-[var(--secondary)] hover:bg-[var(--background)] transition-colors group">
                      <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{item.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[var(--primary)]/10 flex items-center justify-center">
                            <WarehouseIcon size={11} className="text-[var(--primary)]" />
                          </div>
                          <span className="font-medium-body text-xs text-[#1E1E1E]">{item.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] px-2 py-0.5 border-0 ${categoriaColor[item.categoria]}`}>{item.categoria}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium-body text-xs text-[#1E1E1E]">{item.stock.toLocaleString()} {item.unidad}</td>
                      <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{item.minimo.toLocaleString()} {item.unidad}</td>
                      <td className="px-4 py-3 w-28">
                        <Progress
                          value={pct}
                          className={`h-1.5 bg-[var(--border)] ${item.estado === "Agotado" ? "[&>div]:bg-red-500" : item.estado === "Stock Bajo" ? "[&>div]:bg-amber-500" : "[&>div]:bg-[var(--primary)]"}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{item.ubicacion}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit ${estadoConfig[item.estado].badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estadoConfig[item.estado].dot}`} />
                          {item.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF]">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="font-body text-xs text-[#9CA3AF]">Mostrando 6 de 342 ítems</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
