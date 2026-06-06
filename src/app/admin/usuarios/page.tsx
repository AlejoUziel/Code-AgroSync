"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocalDB, generateId } from "@/hooks/useLocalDB";
import {
  Empresa,
  Usuario,
  seedEmpresas,
  seedUsuarios,
  RolUsuario,
} from "@/types/models";
import EmpresaForm from "@/components/admin/EmpresaForm";
import UsuarioForm from "@/components/admin/UsuarioForm";
import EmpresaDetail from "@/components/admin/EmpresaDetail";
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
  MoreHorizontal,
  Building2,
  Users,
  Shield,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rolColors: Record<string, string> = {
  Administrador: "bg-purple-50 text-purple-600",
  "Gerente de Campo": "bg-[var(--secondary)] text-[var(--primary)]",
  Supervisor: "bg-teal-50 text-teal-600",
  Operador: "bg-blue-50 text-blue-600",
  Analista: "bg-amber-50 text-amber-600",
  Jornalero: "bg-gray-100 text-gray-600",
};

const estadoUsuario: Record<string, { badge: string; dot: string }> = {
  Activo: { badge: "bg-[var(--secondary)] text-[var(--primary)] border-0", dot: "bg-[var(--primary)]" },
  Inactivo: { badge: "bg-gray-100 text-gray-500 border-0", dot: "bg-gray-400" },
  Suspendido: { badge: "bg-red-50 text-red-500 border-0", dot: "bg-red-500" },
};

const planColor: Record<string, string> = {
  Starter: "bg-gray-100 text-gray-600 border-0",
  Pro: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  Enterprise: "bg-purple-100 text-purple-600 border-0",
};

const estadoEmpresa: Record<string, { badge: string; dot: string }> = {
  Activa: { badge: "bg-[var(--secondary)] text-[var(--primary)] border-0", dot: "bg-[var(--primary)]" },
  Inactiva: { badge: "bg-gray-100 text-gray-500 border-0", dot: "bg-gray-400" },
  Suspendida: { badge: "bg-red-50 text-red-500 border-0", dot: "bg-red-500" },
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function timeAgo(iso?: string): string {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type TabKey = "usuarios" | "empresas";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const empresaDB = useLocalDB<Empresa>("empresas", seedEmpresas);
  const usuarioDB = useLocalDB<Usuario>("usuarios", seedUsuarios);
  const { toast, showToast, hideToast } = useToast();

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>("usuarios");

  // ── Search & filter ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState<string>("");
  const [filterEmpresaId, setFilterEmpresaId] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Usuario modals ────────────────────────────────────────────────────────────
  const [usuarioFormOpen, setUsuarioFormOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<Usuario | null>(null);

  // ── Empresa modals ────────────────────────────────────────────────────────────
  const [empresaFormOpen, setEmpresaFormOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null);
  const [viewingEmpresa, setViewingEmpresa] = useState<Empresa | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredUsuarios = useMemo(() => {
    const q = search.toLowerCase();
    return usuarioDB.records.filter((u) => {
      const matchQ =
        !q ||
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRol = !filterRol || u.rol === filterRol;
      const matchEmp = !filterEmpresaId || u.empresaId === filterEmpresaId;
      const matchEst = !filterEstado || u.estado === filterEstado;
      return matchQ && matchRol && matchEmp && matchEst;
    });
  }, [usuarioDB.records, search, filterRol, filterEmpresaId, filterEstado]);

  const filteredEmpresas = useMemo(() => {
    const q = search.toLowerCase();
    return empresaDB.records.filter(
      (e) =>
        !q ||
        e.nombre.toLowerCase().includes(q) ||
        e.nit.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }, [empresaDB.records, search]);

  // ── Handlers: Usuarios ────────────────────────────────────────────────────────
  const handleSaveUsuario = (data: Partial<Usuario>) => {
    if (editingUsuario) {
      usuarioDB.update(editingUsuario.id, data);
      showToast(`Usuario "${data.nombre} ${data.apellido}" actualizado.`);
    } else {
      usuarioDB.create({
        ...data,
        id: generateId("USR"),
        fechaCreacion: new Date().toISOString(),
      } as Usuario);
      showToast(`Usuario "${data.nombre} ${data.apellido}" creado exitosamente.`);
    }
    setUsuarioFormOpen(false);
    setEditingUsuario(null);
  };

  const handleDeleteUsuario = () => {
    if (!deletingUsuario) return;
    usuarioDB.remove(deletingUsuario.id);
    showToast(`Usuario "${deletingUsuario.nombre}" eliminado.`, "error");
    setDeletingUsuario(null);
  };

  // ── Handlers: Empresas ────────────────────────────────────────────────────────
  const handleSaveEmpresa = (data: Partial<Empresa>) => {
    if (editingEmpresa) {
      empresaDB.update(editingEmpresa.id, data);
      showToast(`Empresa "${data.nombre}" actualizada.`);
    } else {
      empresaDB.create({
        ...data,
        id: generateId("EMP"),
        fechaRegistro: new Date().toISOString(),
        totalUsuarios: 0,
        totalParcelas: 0,
      } as Empresa);
      showToast(`Empresa "${data.nombre}" creada exitosamente.`);
    }
    setEmpresaFormOpen(false);
    setEditingEmpresa(null);
  };

  const handleDeleteEmpresa = () => {
    if (!deletingEmpresa) return;
    // Also remove linked users
    const linkedUsers = usuarioDB.records.filter(
      (u) => u.empresaId === deletingEmpresa.id
    );
    linkedUsers.forEach((u) => usuarioDB.remove(u.id));
    empresaDB.remove(deletingEmpresa.id);
    showToast(`Empresa "${deletingEmpresa.nombre}" y ${linkedUsers.length} usuario(s) eliminados.`, "error");
    setDeletingEmpresa(null);
    setViewingEmpresa(null);
  };

  const activeUsers = usuarioDB.records.filter((u) => u.estado === "Activo").length;
  const activeEmpresas = empresaDB.records.filter((e) => e.estado === "Activa").length;

  return (
    <AppShell
      pageTitle="Usuarios y Empresas"
      pageSubtitle={`Administrativo · ${usuarioDB.records.length} usuarios · ${empresaDB.records.length} empresas`}
    >
      {/* ─── KPI Row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Usuarios", value: usuarioDB.records.length, sub: "registrados", icon: <Users size={16} className="text-[var(--primary)]" /> },
          { label: "Activos Hoy", value: activeUsers, sub: "sesiones activas", icon: <Shield size={16} className="text-[var(--primary)]" /> },
          { label: "Empresas", value: empresaDB.records.length, sub: `${activeEmpresas} activas`, icon: <Building2 size={16} className="text-[var(--primary)]" /> },
          { label: "Roles Distintos", value: [...new Set(usuarioDB.records.map((u) => u.rol))].length, sub: "tipos de acceso" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[var(--border)] p-4 flex items-start gap-3">
            {s.icon && (
              <div className="w-9 h-9 rounded-lg bg-[var(--secondary)] flex items-center justify-center shrink-0">
                {s.icon}
              </div>
            )}
            <div>
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className="font-heading text-2xl text-[#1E1E1E]">{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main card ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[var(--border)]">
        {/* Tabs + toolbar */}
        <div className="flex items-center gap-0 border-b border-[var(--border)] px-4 pt-3">
          {(["usuarios", "empresas"] as TabKey[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); setFilterRol(""); setFilterEmpresaId(""); setFilterEstado(""); }}
              className={cn(
                "px-5 py-2.5 text-xs font-body border-b-2 transition-all capitalize",
                tab === t
                  ? "border-[var(--primary)] text-[var(--primary)] font-medium-body"
                  : "border-transparent text-[#6B7280] hover:text-[#1E1E1E]"
              )}
            >
              {t === "usuarios" ? `Usuarios (${usuarioDB.records.length})` : `Empresas (${empresaDB.records.length})`}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-[var(--border)]">
          {/* Search */}
          <div className="flex items-center gap-2 bg-[var(--background)] rounded-lg px-3 py-2 border border-[var(--border)] flex-1 min-w-[200px] max-w-xs focus-within:border-[var(--primary)] transition-colors">
            <Search size={13} className="text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              placeholder={tab === "usuarios" ? "Buscar usuario..." : "Buscar empresa..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#C4C4C4] hover:text-[#9CA3AF] text-xs">✕</button>
            )}
          </div>

          {/* Filter toggle */}
          {tab === "usuarios" && (
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-body transition-all",
                showFilters
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--secondary)]"
                  : "border-[var(--border)] text-[#6B7280] hover:border-[var(--primary)]/40"
              )}
            >
              <Filter size={13} />
              Filtros
              {(filterRol || filterEmpresaId || filterEstado) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              )}
            </button>
          )}

          {/* Reset */}
          <button
            onClick={() => { empresaDB.reset(); usuarioDB.reset(); showToast("Datos de demostración restaurados."); }}
            title="Restaurar datos de demo"
            className="p-2 rounded-lg border border-[var(--border)] text-[#9CA3AF] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all"
          >
            <RefreshCw size={13} />
          </button>

          {/* Create button */}
          <button
            onClick={() => {
              if (tab === "usuarios") { setEditingUsuario(null); setUsuarioFormOpen(true); }
              else { setEditingEmpresa(null); setEmpresaFormOpen(true); }
            }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors"
          >
            <Plus size={13} />
            {tab === "usuarios" ? "Nuevo Usuario" : "Nueva Empresa"}
          </button>
        </div>

        {/* Filters row (usuarios only) */}
        {tab === "usuarios" && showFilters && (
          <div className="flex flex-wrap gap-2 px-4 py-3 bg-[var(--background)] border-b border-[var(--border)]">
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="h-8 px-2 text-xs font-body rounded-lg border border-[var(--border)] bg-white outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="">Todos los roles</option>
              {["Administrador", "Gerente de Campo", "Supervisor", "Operador", "Analista", "Jornalero"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={filterEmpresaId}
              onChange={(e) => setFilterEmpresaId(e.target.value)}
              className="h-8 px-2 text-xs font-body rounded-lg border border-[var(--border)] bg-white outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="">Todas las empresas</option>
              {empresaDB.records.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="h-8 px-2 text-xs font-body rounded-lg border border-[var(--border)] bg-white outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="">Todos los estados</option>
              {["Activo", "Inactivo", "Suspendido"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(filterRol || filterEmpresaId || filterEstado) && (
              <button
                onClick={() => { setFilterRol(""); setFilterEmpresaId(""); setFilterEstado(""); }}
                className="text-xs font-body text-red-500 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* ── USUARIOS TABLE ──────────────────────────────────────────────────── */}
        {tab === "usuarios" && (
          <div className="overflow-x-auto">
            {filteredUsuarios.length === 0 ? (
              <EmptyState
                icon={<Users size={24} />}
                title="No se encontraron usuarios"
                desc={search ? `Sin resultados para "${search}"` : "Aún no hay usuarios registrados."}
                action={
                  <button
                    onClick={() => { setEditingUsuario(null); setUsuarioFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    <Plus size={13} /> Crear primer usuario
                  </button>
                }
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Usuario", "Empresa", "Rol", "Estado", "Último acceso", "Creado", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map((u) => {
                    const empresa = empresaDB.records.find((e) => e.id === u.empresaId);
                    const est = estadoUsuario[u.estado] ?? estadoUsuario.Inactivo;
                    return (
                      <tr key={u.id} className="border-b border-[var(--secondary)] hover:bg-[var(--background)] transition-colors group">
                        {/* Avatar + name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-heading">
                                {u.nombre[0]}{u.apellido[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium-body text-xs text-[#1E1E1E]">
                                {u.nombre} {u.apellido}
                              </p>
                              <p className="font-body text-[11px] text-[#9CA3AF]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Empresa */}
                        <td className="px-4 py-3">
                          {empresa ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 size={11} className="text-[#C4C4C4] shrink-0" />
                              <span className="font-body text-xs text-[#6B7280] truncate max-w-[120px]">{empresa.nombre}</span>
                            </div>
                          ) : (
                            <span className="font-body text-xs text-[#C4C4C4]">—</span>
                          )}
                        </td>
                        {/* Rol */}
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] px-2 py-0.5 border-0 ${rolColors[u.rol] ?? "bg-gray-100 text-gray-600"}`}>
                            {u.rol}
                          </Badge>
                        </td>
                        {/* Estado */}
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit ${est.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                            {u.estado}
                          </Badge>
                        </td>
                        {/* Last access */}
                        <td className="px-4 py-3 font-body text-xs text-[#9CA3AF] whitespace-nowrap">
                          {timeAgo(u.ultimoAcceso)}
                        </td>
                        {/* Created */}
                        <td className="px-4 py-3 font-body text-xs text-[#9CA3AF] whitespace-nowrap">
                          {formatDate(u.fechaCreacion)}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Editar"
                              onClick={() => { setEditingUsuario(u); setUsuarioFormOpen(true); }}
                              className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              title="Eliminar"
                              onClick={() => setDeletingUsuario(u)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── EMPRESAS TABLE ──────────────────────────────────────────────────── */}
        {tab === "empresas" && (
          <div className="overflow-x-auto">
            {filteredEmpresas.length === 0 ? (
              <EmptyState
                icon={<Building2 size={24} />}
                title="No se encontraron empresas"
                desc={search ? `Sin resultados para "${search}"` : "Aún no hay empresas registradas."}
                action={
                  <button
                    onClick={() => { setEditingEmpresa(null); setEmpresaFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    <Plus size={13} /> Crear primera empresa
                  </button>
                }
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Empresa", "NIT / RUC", "Contacto", "Ciudad", "Plan", "Usuarios", "Estado", "Registro", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmpresas.map((e) => {
                    const usersCount = usuarioDB.records.filter((u) => u.empresaId === e.id).length;
                    const est = estadoEmpresa[e.estado] ?? estadoEmpresa.Inactiva;
                    return (
                      <tr key={e.id} className="border-b border-[var(--secondary)] hover:bg-[var(--background)] transition-colors group">
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                              <Building2 size={14} className="text-[var(--primary)]" />
                            </div>
                            <div>
                              <p className="font-medium-body text-xs text-[#1E1E1E]">{e.nombre}</p>
                              <p className="font-body text-[11px] text-[#9CA3AF] truncate max-w-[140px]">{e.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{e.nit}</td>
                        <td className="px-4 py-3 font-body text-xs text-[#9CA3AF]">{e.telefono}</td>
                        <td className="px-4 py-3 font-body text-xs text-[#6B7280]">{e.ciudad}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] px-2 py-0.5 ${planColor[e.plan]}`}>{e.plan}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium-body text-xs text-[#1E1E1E] text-center">
                          {usersCount}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit ${est.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                            {e.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-body text-xs text-[#9CA3AF] whitespace-nowrap">
                          {formatDate(e.fechaRegistro)}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Ver detalle"
                              onClick={() => setViewingEmpresa(e)}
                              className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              title="Editar"
                              onClick={() => { setEditingEmpresa(e); setEmpresaFormOpen(true); }}
                              className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              title="Eliminar"
                              onClick={() => setDeletingEmpresa(e)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Results count footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <p className="font-body text-xs text-[#9CA3AF]">
            {tab === "usuarios"
              ? `${filteredUsuarios.length} de ${usuarioDB.records.length} usuarios`
              : `${filteredEmpresas.length} de ${empresaDB.records.length} empresas`}
          </p>
          <p className="font-body text-[10px] text-[#C4C4C4]">
            💾 Base de datos: localStorage (demo) → Migrará a MySQL
          </p>
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────────────────────────────── */}

      {/* Usuario form */}
      <UsuarioForm
        open={usuarioFormOpen}
        onClose={() => { setUsuarioFormOpen(false); setEditingUsuario(null); }}
        onSave={handleSaveUsuario}
        usuario={editingUsuario}
        empresas={empresaDB.records}
      />

      {/* Empresa form */}
      <EmpresaForm
        open={empresaFormOpen}
        onClose={() => { setEmpresaFormOpen(false); setEditingEmpresa(null); }}
        onSave={handleSaveEmpresa}
        empresa={editingEmpresa}
      />

      {/* Empresa detail */}
      <EmpresaDetail
        open={!!viewingEmpresa}
        onClose={() => setViewingEmpresa(null)}
        empresa={viewingEmpresa}
        usuariosDeEmpresa={usuarioDB.records.filter((u) => u.empresaId === viewingEmpresa?.id)}
        onEdit={() => { setEditingEmpresa(viewingEmpresa); setViewingEmpresa(null); setEmpresaFormOpen(true); }}
        onDelete={() => { setDeletingEmpresa(viewingEmpresa); setViewingEmpresa(null); }}
      />

      {/* Delete usuario */}
      <ConfirmDeleteDialog
        open={!!deletingUsuario}
        onClose={() => setDeletingUsuario(null)}
        onConfirm={handleDeleteUsuario}
        itemName={deletingUsuario ? `${deletingUsuario.nombre} ${deletingUsuario.apellido}` : ""}
        entityType="usuario"
      />

      {/* Delete empresa */}
      <ConfirmDeleteDialog
        open={!!deletingEmpresa}
        onClose={() => setDeletingEmpresa(null)}
        onConfirm={handleDeleteEmpresa}
        itemName={deletingEmpresa?.nombre ?? ""}
        entityType="empresa"
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </AppShell>
  );
}
