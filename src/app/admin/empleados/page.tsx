"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocalDB, generateId } from "@/hooks/useLocalDB";
import { Empleado, seedEmpleados } from "@/types/models";
import EmpleadoForm from "@/components/admin/EmpleadoForm";
import {
  ConfirmDeleteDialog,
  EmptyState,
  Toast,
  useToast,
} from "@/components/shared/FormComponents";
import {
  Search,
  Plus,
  Filter,
  Phone,
  MapPin,
  Star,
  Edit2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const estadoConfig: Record<string, string> = {
  "En Campo": "bg-secondary text-primary border-0",
  "En Oficina": "bg-blue-50 text-blue-600 border-0",
  "Descanso": "bg-gray-100 text-gray-500 border-0",
  "Vacaciones": "bg-purple-50 text-purple-600 border-0",
};

export default function EmpleadosPage() {
  const db = useLocalDB<Empleado>("empleados", seedEmpleados);
  const { toast, showToast, hideToast } = useToast();

  // Search & Filters state
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterContrato, setFilterContrato] = useState("");
  const [filterZona, setFilterZona] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal Dialogs state
  const [empleadoFormOpen, setEmpleadoFormOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [deletingEmpleado, setDeletingEmpleado] = useState<Empleado | null>(null);

  // Filter logic
  const filteredEmpleados = useMemo(() => {
    const q = search.toLowerCase();
    return db.records.filter((e) => {
      const matchQ =
        !q ||
        e.nombre.toLowerCase().includes(q) ||
        e.puesto.toLowerCase().includes(q) ||
        e.zona.toLowerCase().includes(q);
      const matchEstado = !filterEstado || e.estado === filterEstado;
      const matchContrato = !filterContrato || e.contrato === filterContrato;
      const matchZona = !filterZona || e.zona === filterZona;
      return matchQ && matchEstado && matchContrato && matchZona;
    });
  }, [db.records, search, filterEstado, filterContrato, filterZona]);

  // Handlers
  const handleSaveEmpleado = (data: Partial<Empleado>) => {
    if (editingEmpleado) {
      db.update(editingEmpleado.id, data);
      showToast(`Empleado "${data.nombre}" actualizado con éxito.`);
    } else {
      db.create({
        ...data,
        id: generateId("E"),
        fechaIngreso: new Date().toISOString(),
      } as Empleado);
      showToast(`Empleado "${data.nombre}" registrado exitosamente.`);
    }
    setEmpleadoFormOpen(false);
    setEditingEmpleado(null);
  };

  const handleDeleteEmpleado = () => {
    if (!deletingEmpleado) return;
    db.remove(deletingEmpleado.id);
    showToast(`Empleado "${deletingEmpleado.nombre}" eliminado.`, "error");
    setDeletingEmpleado(null);
  };

  // Dynamic statistics
  const totalCount = db.records.length;
  const enCampoCount = db.records.filter((e) => e.estado === "En Campo").length;
  const temporalCount = db.records.filter((e) => e.contrato === "Temporal").length;

  const totalPayroll = db.records.reduce((sum, e) => {
    const val = parseInt(e.salario.replace(/[^0-9]/g, "")) || 0;
    return sum + val;
  }, 0);

  let payrollStr = "";
  if (totalPayroll >= 1000000) {
    payrollStr = `$${(totalPayroll / 1000000).toFixed(1)}M`;
  } else {
    payrollStr = `$${totalPayroll.toLocaleString("en-US")}`;
  }

  return (
    <AppShell pageTitle="Gestión de Empleados" pageSubtitle={`Administrativo · ${totalCount} empleados registrados`}>
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Empleados", value: totalCount.toString(), sub: "en nómina" },
            { label: "En Campo Hoy", value: enCampoCount.toString(), sub: "activos ahora" },
            { label: "Contratos Temp.", value: temporalCount.toString(), sub: "temporales" },
            { label: "Nómina Mensual", value: payrollStr, sub: "total bruto" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E] mt-1">{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Employee cards grid (top 3) */}
        {db.records.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {db.records.slice(0, 3).map((e) => (
              <div
                key={e.id}
                onClick={() => { setEditingEmpleado(e); setEmpleadoFormOpen(true); }}
                className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                title="Haz clic para editar"
              >
                <div className="flex items-start justify-between mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/15 text-primary text-sm font-heading">{e.avatar}</AvatarFallback>
                  </Avatar>
                  <Badge className={`text-[10px] px-2 border-0 ${estadoConfig[e.estado]}`}>{e.estado}</Badge>
                </div>
                <p className="font-heading text-sm text-[#1E1E1E] group-hover:text-primary transition-colors">{e.nombre}</p>
                <p className="font-body text-xs text-[#9CA3AF] mb-3">{e.puesto}</p>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={10} className={i < e.rating ? "text-amber-400 fill-amber-400" : "text-[var(--border)]"} />
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
        )}

        {/* Table / List card */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
            {/* Search */}
            <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border flex-1 max-w-xs focus-within:border-primary transition-colors">
              <Search size={13} className="text-[#9CA3AF]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, cargo o zona..."
                className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-[#C4C4C4] hover:text-[#9CA3AF] text-xs">✕</button>
              )}
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-body transition-all",
                showFilters
                  ? "border-primary text-primary bg-secondary"
                  : "border-border text-[#6B7280] hover:border-primary/40"
              )}
            >
              <Filter size={13} /> Filtrar
              {(filterEstado || filterContrato || filterZona) && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>

            {/* Reset data */}
            <button
              onClick={() => { db.reset(); showToast("Datos de demostración restaurados."); }}
              title="Restaurar datos de demo"
              className="p-2 rounded-lg border border-border text-[#9CA3AF] hover:text-primary hover:border-primary/40 transition-all"
            >
              <RefreshCw size={13} />
            </button>

            {/* New employee button */}
            <button
              onClick={() => { setEditingEmpleado(null); setEmpleadoFormOpen(true); }}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium-body hover:bg-primary-dark transition-colors"
            >
              <Plus size={13} /> Nuevo Empleado
            </button>
          </div>

          {/* Filter options row */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 px-4 py-3 bg-background border-b border-border">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="h-8 px-2 text-xs font-body rounded-lg border border-border bg-card outline-none focus:border-primary transition-colors"
              >
                <option value="">Todos los estados</option>
                {["En Campo", "En Oficina", "Descanso", "Vacaciones"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterContrato}
                onChange={(e) => setFilterContrato(e.target.value)}
                className="h-8 px-2 text-xs font-body rounded-lg border border-border bg-card outline-none focus:border-primary transition-colors"
              >
                <option value="">Todos los contratos</option>
                {["Permanente", "Temporal"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={filterZona}
                onChange={(e) => setFilterZona(e.target.value)}
                className="h-8 px-2 text-xs font-body rounded-lg border border-border bg-card outline-none focus:border-primary transition-colors"
              >
                <option value="">Todas las zonas</option>
                {["Zona Norte", "Zona Sur", "Zona Este", "Zona Oeste", "Zona Central"].map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              {(filterEstado || filterContrato || filterZona) && (
                <button
                  onClick={() => { setFilterEstado(""); setFilterContrato(""); setFilterZona(""); }}
                  className="text-xs font-body text-red-500 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Employee Table */}
          <div className="overflow-x-auto">
            {filteredEmpleados.length === 0 ? (
              <EmptyState
                icon={<Search size={24} />}
                title="No se encontraron empleados"
                desc={search || filterEstado || filterContrato || filterZona ? "Ajusta la búsqueda o los filtros para encontrar lo que necesitas." : "Registra un nuevo empleado para comenzar."}
                action={
                  <button
                    onClick={() => { setEditingEmpleado(null); setEmpleadoFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium-body hover:bg-primary-dark transition-colors"
                  >
                    <Plus size={13} /> Registrar primer empleado
                  </button>
                }
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Empleado", "Puesto", "Zona", "Contrato", "Salario", "Estado", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmpleados.map((e) => (
                    <tr key={e.id} className="border-b border-secondary hover:bg-background transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-heading">{e.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium-body text-xs text-[#1E1E1E] block">{e.nombre}</span>
                            <span className="font-body text-[10px] text-[#9CA3AF] block">{e.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{e.puesto}</td>
                      <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{e.zona}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] px-2 border-0 ${e.contrato === "Permanente" ? "bg-secondary text-primary" : "bg-amber-50 text-amber-600"}`}>{e.contrato}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium-body text-xs text-[#1E1E1E]">{e.salario}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] px-2 py-0.5 ${estadoConfig[e.estado]}`}>{e.estado}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Editar"
                            onClick={() => { setEditingEmpleado(e); setEmpleadoFormOpen(true); }}
                            className="p-1.5 rounded-md hover:bg-secondary text-[#9CA3AF] hover:text-primary transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => setDeletingEmpleado(e)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Results count footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="font-body text-xs text-[#9CA3AF]">
              {filteredEmpleados.length} de {db.records.length} empleados mostrados
            </p>
            <p className="font-body text-[10px] text-[#C4C4C4]">
              💾 Base de datos: localStorage (demo) → Migrará a MySQL
            </p>
          </div>
        </div>
      </div>

      {/* Modals & Popups */}
      <EmpleadoForm
        open={empleadoFormOpen}
        onClose={() => { setEmpleadoFormOpen(false); setEditingEmpleado(null); }}
        onSave={handleSaveEmpleado}
        empleado={editingEmpleado}
      />

      <ConfirmDeleteDialog
        open={!!deletingEmpleado}
        onClose={() => setDeletingEmpleado(null)}
        onConfirm={handleDeleteEmpleado}
        itemName={deletingEmpleado ? deletingEmpleado.nombre : ""}
        entityType="empleado"
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </AppShell>
  );
}


