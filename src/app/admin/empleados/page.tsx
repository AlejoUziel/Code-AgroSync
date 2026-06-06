"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Filter, MoreHorizontal, Phone, MapPin, Star } from "lucide-react";

const empleados = [
  { id: "E-001", nombre: "Roberto Méndez", puesto: "Jefe de Campo", zona: "Zona Norte", salario: "$8,500", contrato: "Permanente", estado: "En Campo", rating: 5, avatar: "RM", tel: "+52 123 456 7890" },
  { id: "E-002", nombre: "Sofía Torres", puesto: "Agrónoma", zona: "Zona Sur", salario: "$12,000", contrato: "Permanente", estado: "En Oficina", rating: 5, avatar: "ST", tel: "+52 123 456 7891" },
  { id: "E-003", nombre: "Luis Herrera", puesto: "Operador Maquinaria", zona: "Zona Este", salario: "$6,200", contrato: "Temporal", estado: "En Campo", rating: 4, avatar: "LH", tel: "+52 123 456 7892" },
  { id: "E-004", nombre: "Carmen Vega", puesto: "Supervisora Cosecha", zona: "Zona Norte", salario: "$9,800", contrato: "Permanente", estado: "En Campo", rating: 5, avatar: "CV", tel: "+52 123 456 7893" },
  { id: "E-005", nombre: "Miguel Ángel Ruiz", puesto: "Jornalero", zona: "Zona Oeste", salario: "$3,200", contrato: "Temporal", estado: "Descanso", rating: 3, avatar: "MR", tel: "+52 123 456 7894" },
];

const estadoConfig: Record<string, string> = {
  "En Campo": "bg-[#F0F5EA] text-[#8EBF24] border-0",
  "En Oficina": "bg-blue-50 text-blue-600 border-0",
  "Descanso": "bg-gray-100 text-gray-500 border-0",
  "Vacaciones": "bg-purple-50 text-purple-600 border-0",
};

export default function EmpleadosPage() {
  return (
    <AppShell pageTitle="Gestión de Empleados" pageSubtitle="Administrativo · 214 empleados registrados">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Empleados", value: "214", sub: "en nómina" },
            { label: "En Campo Hoy", value: "142", sub: "activos ahora" },
            { label: "Contratos Temp.", value: "38", sub: "temporales" },
            { label: "Nómina Mensual", value: "$1.2M", sub: "total bruto" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2EDD6] p-4">
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-1">{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Employee cards grid (top 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {empleados.slice(0, 3).map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-[#E2EDD6] p-5 hover:border-[#8EBF24]/30 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#8EBF24]/15 text-[#8EBF24] text-sm font-heading">{e.avatar}</AvatarFallback>
                </Avatar>
                <Badge className={`text-[10px] px-2 border-0 ${estadoConfig[e.estado]}`}>{e.estado}</Badge>
              </div>
              <p className="font-heading text-sm text-[#1E1E1E]">{e.nombre}</p>
              <p className="font-body text-xs text-[#9CA3AF] mb-3">{e.puesto}</p>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={10} className={i < e.rating ? "text-amber-400 fill-amber-400" : "text-[#E2EDD6]"} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-body text-[#9CA3AF]">
                <MapPin size={10} /> {e.zona}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-body text-[#9CA3AF] mt-0.5">
                <Phone size={10} /> {e.tel}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2EDD6]">
          <div className="flex items-center gap-3 p-4 border-b border-[#E2EDD6]">
            <div className="flex items-center gap-2 bg-[#F9FBF6] rounded-lg px-3 py-2 border border-[#E2EDD6] flex-1 max-w-xs focus-within:border-[#8EBF24] transition-colors">
              <Search size={13} className="text-[#9CA3AF]" />
              <input type="text" placeholder="Buscar empleado..." className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2EDD6] text-xs font-body text-[#6B7280] hover:border-[#8EBF24]/40 transition-all">
              <Filter size={13} /> Filtrar
            </button>
            <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8EBF24] text-white text-xs font-medium-body hover:bg-[#6E9A1A] transition-colors">
              <Plus size={13} /> Nuevo Empleado
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2EDD6]">
                  {["Empleado", "Puesto", "Zona", "Contrato", "Salario", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empleados.map((e) => (
                  <tr key={e.id} className="border-b border-[#F0F5EA] hover:bg-[#F9FBF6] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-[#8EBF24]/15 text-[#8EBF24] text-[10px] font-heading">{e.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium-body text-xs text-[#1E1E1E]">{e.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{e.puesto}</td>
                    <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{e.zona}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 border-0 ${e.contrato === "Permanente" ? "bg-[#F0F5EA] text-[#8EBF24]" : "bg-amber-50 text-amber-600"}`}>{e.contrato}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium-body text-xs text-[#1E1E1E]">{e.salario}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] px-2 py-0.5 ${estadoConfig[e.estado]}`}>{e.estado}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[#F0F5EA] text-[#9CA3AF]">
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
