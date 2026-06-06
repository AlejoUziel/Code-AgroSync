"use client";

import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle2, XCircle, Info, Settings, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const alertas = [
  { id: "A-001", tipo: "danger", titulo: "Plaga detectada en Parcela Norte-12", desc: "Se detectaron áfidos en cultivo de trigo. Se recomienda aplicación inmediata de insecticida sistémico.", tiempo: "Hace 2 horas", zona: "Norte-12", leida: false, accion: "Ver Parcela" },
  { id: "A-002", tipo: "warning", titulo: "Riego programado en 3 horas — Zona B", desc: "El sistema de riego automático iniciará ciclo de riego para las parcelas de la Zona B a las 14:00 hrs.", tiempo: "Hace 4 horas", zona: "Zona B", leida: false, accion: "Ver Programa" },
  { id: "A-003", tipo: "warning", titulo: "Stock crítico: Herbicida Glifosato 480SL", desc: "El inventario actual (280 lt) está por debajo del mínimo establecido (300 lt). Generar orden de compra.", tiempo: "Hace 5 horas", zona: "Bodega B", leida: false, accion: "Ver Inventario" },
  { id: "A-004", tipo: "info", titulo: "Reporte mensual generado", desc: "El reporte automático de Producción — Mayo 2026 ha sido generado y está listo para descarga.", tiempo: "Hace 6 horas", zona: "Sistema", leida: true, accion: "Descargar" },
  { id: "A-005", tipo: "success", titulo: "Cosecha completada — Lote Norte-08", desc: "Se registraron 320.4 toneladas de maíz H-507. Rendimiento: 7.5 t/ha (meta: 7.0 t/ha).", tiempo: "Hace 8 horas", zona: "Norte-08", leida: true, accion: "Ver Detalles" },
  { id: "A-006", tipo: "info", titulo: "Nuevo empleado registrado", desc: "Roberto Méndez fue registrado como Jefe de Campo en Zona Norte.", tiempo: "Hace 10 horas", zona: "RRHH", leida: true, accion: "Ver Empleado" },
  { id: "A-007", tipo: "danger", titulo: "Temperatura extrema prevista", desc: "Pronóstico indica temperatura de 38°C para mañana. Se recomienda adelantar tareas de campo.", tiempo: "Ayer 18:00", zona: "Zona Sur", leida: true, accion: "Ver Clima" },
];

const tipoConfig = {
  danger: {
    icon: <XCircle size={16} />,
    color: "text-red-500",
    bg: "bg-red-50 border-red-100",
    badge: "bg-red-100 text-red-500 border-0",
    dot: "bg-red-500",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-100",
    badge: "bg-amber-100 text-amber-600 border-0",
    dot: "bg-amber-500",
  },
  info: {
    icon: <Info size={16} />,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-100",
    badge: "bg-blue-100 text-blue-600 border-0",
    dot: "bg-blue-500",
  },
  success: {
    icon: <CheckCircle2 size={16} />,
    color: "text-primary",
    bg: "bg-secondary border-border",
    badge: "bg-secondary text-primary border-0",
    dot: "bg-primary",
  },
};

export default function AlertasPage() {
  const noLeidas = alertas.filter((a) => !a.leida).length;

  return (
    <AppShell pageTitle="Notificaciones y Alertas" pageSubtitle="Tecnológico · Centro de notificaciones">
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "No Leídas", value: `${noLeidas}`, sub: "requieren atención", alert: true },
            { label: "Críticas", value: "1", sub: "peligro inmediato", alert: true },
            { label: "Advertencias", value: "2", sub: "este día" },
            { label: "Total Hoy", value: `${alertas.length}`, sub: "notificaciones" },
          ].map((s) => (
            <div key={s.label} className={`bg-card rounded-xl border p-4 ${s.alert && parseInt(s.value) > 0 ? "border-red-200" : "border-border"}`}>
              <p className="font-body text-xs text-[#9CA3AF]">{s.label}</p>
              <p className={`font-heading text-2xl mt-1 ${s.alert && parseInt(s.value) > 0 ? "text-red-500" : "text-[#1E1E1E]"}`}>{s.value}</p>
              <p className="font-body text-[11px] text-[#C4C4C4]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-card rounded-xl border border-border p-1.5 w-fit">
          {["Todas", "No leídas", "Críticas", "Advertencias", "Info"].map((tab, i) => (
            <button
              key={tab}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-body transition-all",
                i === 0
                  ? "bg-primary text-white font-medium-body"
                  : "text-[#6B7280] hover:text-[#1E1E1E] hover:bg-background"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {/* Mark all read action */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-xs text-[#9CA3AF]">{alertas.length} notificaciones · {noLeidas} sin leer</p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs font-body text-primary hover:text-[var(--primary-dark)] transition-colors">
                <Check size={12} /> Marcar todas como leídas
              </button>
              <button className="flex items-center gap-1.5 text-xs font-body text-[#9CA3AF] hover:text-red-500 transition-colors">
                <Trash2 size={12} /> Limpiar leídas
              </button>
            </div>
          </div>

          {alertas.map((alerta) => {
            const cfg = tipoConfig[alerta.tipo as keyof typeof tipoConfig];
            return (
              <div
                key={alerta.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm",
                  alerta.leida ? "bg-card border-border opacity-70" : `${cfg.bg} border`
                )}
              >
                {/* Unread dot */}
                <div className="mt-1 shrink-0 relative">
                  <span className={cn("flex items-center justify-center", cfg.color)}>
                    {cfg.icon}
                  </span>
                  {!alerta.leida && (
                    <span className={cn("absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white", cfg.dot)} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <p className={cn("font-medium-body text-sm text-[#1E1E1E] flex-1", alerta.leida && "font-body")}>
                      {alerta.titulo}
                    </p>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 shrink-0 ${cfg.badge}`}>
                      {alerta.zona}
                    </Badge>
                  </div>
                  <p className="font-body text-xs text-[#6B7280] leading-relaxed mb-2">
                    {alerta.desc}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-[11px] text-[#C4C4C4]">{alerta.tiempo}</span>
                    <button className={cn("text-[11px] font-medium-body transition-colors", cfg.color, "hover:underline")}>
                      {alerta.accion} →
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!alerta.leida && (
                    <button className="p-1.5 rounded-md hover:bg-card/60 text-[#9CA3AF] hover:text-[#1E1E1E] transition-colors" title="Marcar como leída">
                      <Check size={13} />
                    </button>
                  )}
                  <button className="p-1.5 rounded-md hover:bg-card/60 text-[#9CA3AF] hover:text-red-500 transition-colors" title="Eliminar">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notification settings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={14} className="text-primary" />
            <h2 className="font-heading text-sm text-[#1E1E1E]">Configuración de Alertas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Alertas de Plagas y Enfermedades", desc: "Notificar inmediatamente", active: true },
              { label: "Riego Programado", desc: "Recordatorio 3 horas antes", active: true },
              { label: "Stock Bajo en Inventario", desc: "Al alcanzar nivel mínimo", active: true },
              { label: "Clima Extremo", desc: "Temperatura >35°C o lluvia >50mm", active: true },
              { label: "Cosechas Completadas", desc: "Al registrar cosecha", active: false },
              { label: "Reportes Automáticos", desc: "Al generar reporte programado", active: false },
            ].map((config) => (
              <div key={config.label} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className={cn(
                  "w-9 h-5 rounded-full relative cursor-pointer transition-colors flex items-center shrink-0",
                  config.active ? "bg-primary" : "bg-card"
                )}>
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full bg-card shadow-sm absolute transition-transform",
                    config.active ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
                <div>
                  <p className="font-medium-body text-xs text-[#1E1E1E]">{config.label}</p>
                  <p className="font-body text-[11px] text-[#9CA3AF]">{config.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

