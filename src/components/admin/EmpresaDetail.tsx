"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Empresa, Usuario } from "@/types/models";
import {
  Building2, Mail, Phone, MapPin, Globe, FileText,
  Users, Edit2, Trash2, Calendar, CreditCard, StickyNote,
} from "lucide-react";

interface EmpresaDetailProps {
  open: boolean;
  onClose: () => void;
  empresa: Empresa | null;
  usuariosDeEmpresa: Usuario[];
  onEdit: () => void;
  onDelete: () => void;
}

const planColor: Record<string, string> = {
  Starter: "bg-gray-100 text-gray-600 border-0",
  Pro: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  Enterprise: "bg-purple-100 text-purple-600 border-0",
};

const estadoColor: Record<string, { badge: string; dot: string }> = {
  Activa: { badge: "bg-[var(--secondary)] text-[var(--primary)] border-0", dot: "bg-[var(--primary)]" },
  Inactiva: { badge: "bg-gray-100 text-gray-500 border-0", dot: "bg-gray-400" },
  Suspendida: { badge: "bg-red-50 text-red-500 border-0", dot: "bg-red-500" },
};

const rolColors: Record<string, string> = {
  Administrador: "bg-purple-100 text-purple-600",
  "Gerente de Campo": "bg-[var(--secondary)] text-[var(--primary)]",
  Supervisor: "bg-teal-100 text-teal-600",
  Operador: "bg-blue-100 text-blue-600",
  Analista: "bg-amber-100 text-amber-600",
  Jornalero: "bg-gray-100 text-gray-600",
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit", month: "long", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

export default function EmpresaDetail({
  open, onClose, empresa, usuariosDeEmpresa, onEdit, onDelete,
}: EmpresaDetailProps) {
  if (!empresa) return null;
  const est = estadoColor[empresa.estado] ?? estadoColor.Inactiva;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-[var(--border)] bg-card p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                <Building2 size={20} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="font-heading text-base text-white">{empresa.nombre}</h2>
                <p className="font-body text-xs text-white/50 mt-0.5">{empresa.nit}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className={`text-[10px] px-2 py-0.5 ${planColor[empresa.plan]}`}>
                {empresa.plan}
              </Badge>
              <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${est.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                {empresa.estado}
              </Badge>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Contact info */}
          <div>
            <p className="font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-3">
              Información de Contacto
            </p>
            <div className="space-y-2.5">
              {[
                { icon: <Mail size={13} />, label: empresa.email },
                { icon: <Phone size={13} />, label: empresa.telefono },
                { icon: <MapPin size={13} />, label: empresa.direccion || "Sin dirección registrada" },
                { icon: <Globe size={13} />, label: `${empresa.ciudad}, ${empresa.pais}` },
                { icon: <Calendar size={13} />, label: `Registrado el ${formatDate(empresa.fechaRegistro)}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-[var(--primary)] shrink-0">{item.icon}</span>
                  <span className="font-body text-xs text-[#6B7280]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="font-heading text-2xl text-[#1E1E1E]">{usuariosDeEmpresa.length}</p>
              <p className="font-body text-xs text-[#9CA3AF]">Usuarios</p>
            </div>
            <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="font-heading text-2xl text-[#1E1E1E]">{empresa.totalParcelas ?? 0}</p>
              <p className="font-body text-xs text-[#9CA3AF]">Parcelas</p>
            </div>
          </div>

          {/* Users list */}
          {usuariosDeEmpresa.length > 0 && (
            <div>
              <p className="font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-3">
                Usuarios ({usuariosDeEmpresa.length})
              </p>
              <div className="space-y-2">
                {usuariosDeEmpresa.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-[10px] font-heading text-[var(--primary)] shrink-0">
                      {u.nombre[0]}{u.apellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium-body text-xs text-[#1E1E1E] truncate">
                        {u.nombre} {u.apellido}
                      </p>
                      <p className="font-body text-[10px] text-[#9CA3AF] truncate">{u.email}</p>
                    </div>
                    <Badge className={`text-[9px] px-1.5 border-0 shrink-0 ${rolColors[u.rol] ?? "bg-gray-100 text-gray-600"}`}>
                      {u.rol}
                    </Badge>
                  </div>
                ))}
                {usuariosDeEmpresa.length > 5 && (
                  <p className="font-body text-xs text-[#9CA3AF] text-center">
                    + {usuariosDeEmpresa.length - 5} usuarios más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {empresa.notas && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <StickyNote size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="font-body text-xs text-amber-700">{empresa.notas}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[var(--border)] shrink-0 flex items-center gap-2 bg-[var(--background)]">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-xs font-body text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 size={13} /> Eliminar
          </button>
          <button
            onClick={onEdit}
            className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors"
          >
            <Edit2 size={13} /> Editar Empresa
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
