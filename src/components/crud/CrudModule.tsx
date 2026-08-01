"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { AlertTriangle, Bell, Download, Edit2, Filter, Landmark, Mail, MapPin, MessageCircle, Package, Plus, Search, Sprout, Trash2, UserSquare2, WarehouseIcon, FileBarChart2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCrudResource } from "@/hooks/useCrudResource";
import { HONDURAS_BOUNDS, HONDURAS_CENTER, calculateInventoryStatus, isInsideHonduras, resourceDefinitions, type ResourceField, type ResourceKey, type ResourceRecord } from "@/lib/resource-definitions";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useModernAlert } from "@/components/shared/ModernAlertDialog";

const ParcelaLocationPicker = dynamic(() => import("@/components/maps/ParcelaLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="sm:col-span-2 flex h-[260px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[#6B7280]">
      Cargando mapa de Honduras...
    </div>
  ),
});

const iconMap = {
  parcelas: MapPin,
  cultivos: Sprout,
  inventario: WarehouseIcon,
  produccion: Package,
  empleados: UserSquare2,
  finanzas: Landmark,
  alertas: Bell,
  reportes: FileBarChart2,
};

const badgeClass: Record<string, string> = {
  Activa: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  Activo: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  Disponible: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  Ingreso: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  Completada: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  Resuelta: "bg-[var(--secondary)] text-[var(--primary)] border-0",
  "En Progreso": "bg-blue-50 text-blue-600 border-0",
  "En Proceso": "bg-blue-50 text-blue-600 border-0",
  Nuevo: "bg-blue-50 text-blue-600 border-0",
  Alerta: "bg-amber-50 text-amber-600 border-0",
  Alta: "bg-red-50 text-red-500 border-0",
  Media: "bg-amber-50 text-amber-600 border-0",
  Baja: "bg-blue-50 text-blue-600 border-0",
  Egreso: "bg-red-50 text-red-500 border-0",
  Agotado: "bg-red-50 text-red-500 border-0",
  "Stock Bajo": "bg-amber-50 text-amber-600 border-0",
  Pendiente: "bg-amber-50 text-amber-600 border-0",
  Inactivo: "bg-gray-100 text-gray-500 border-0",
  "En Descanso": "bg-gray-100 text-gray-500 border-0",
};

function emptyRecord(fields: ResourceField[]) {
  return fields.reduce<ResourceRecord>(
    (acc, field) => ({
      ...acc,
      [field.key]: field.options?.[0] ?? (field.type === "number" ? 0 : ""),
    }),
    { id: "" }
  );
}

function valueLabel(value: ResourceRecord[string]) {
  if (typeof value === "number") return value.toLocaleString("es-HN");
  if (typeof value === "boolean") return value ? "Si" : "No";
  return String(value ?? "");
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="pro-card pro-card-hover rounded-2xl p-4">
      <p className="font-medium-body text-xs text-[var(--text-soft)]">{label}</p>
      <p className="font-heading text-2xl text-[#171A16] mt-1">{value}</p>
      <p className="font-body text-[11px] text-[#C4C4C4]">{sub}</p>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  options,
  disabled,
}: {
  field: ResourceField;
  value: ResourceRecord[string];
  onChange: (value: string | number) => void;
  options?: string[];
  disabled?: boolean;
}) {
  const base =
    "pro-focus mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white/85 px-3 text-sm outline-none disabled:bg-[var(--background)] disabled:text-muted-foreground/60 disabled:cursor-not-allowed";

  const selectOptions = options ?? field.options;
  if (field.type === "select" || selectOptions?.length) {
    return (
      <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={base} disabled={disabled}>
        {!field.required && <option value="">Sin seleccionar</option>}
        {field.required && !String(value ?? "") && <option value="">Seleccionar...</option>}
        {selectOptions?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="pro-focus mt-1 w-full rounded-xl border border-[var(--border)] bg-white/85 px-3 py-2 text-sm outline-none disabled:bg-[var(--background)] disabled:text-muted-foreground/60 disabled:cursor-not-allowed"
        disabled={disabled}
      />
    );
  }

  return (
    <input
      type={field.type}
      step={field.type === "number" ? "any" : undefined}
      value={String(value ?? "")}
      onChange={(event) => {
        if (field.type === "number") {
          const val = event.target.value;
          if (val === "") {
            onChange(0);
          } else {
            const numVal = Number(val);
            onChange(isNaN(numVal) ? 0 : numVal);
          }
        } else {
          onChange(event.target.value);
        }
      }}
      className={base}
      disabled={disabled}
    />
  );
}

export function CrudModule({ resourceKey }: { resourceKey: ResourceKey }) {
  const { definition, records, loading, dbConfigured, create, update, remove } = useCrudResource(resourceKey);
  const parcelasResource = useCrudResource("parcelas");
  const cultivosResource = useCrudResource("cultivos");
  const Icon = iconMap[definition.icon];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<ResourceRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ResourceRecord>(() => emptyRecord(definition.fields));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { alert: modernAlert, confirm: modernConfirm, prompt: modernPrompt } = useModernAlert();

  const statusOptions = useMemo(() => {
    if (!definition.statusKey) return [];
    return Array.from(new Set(records.map((record) => String(record[definition.statusKey!] ?? "")).filter(Boolean)));
  }, [definition.statusKey, records]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        !needle ||
        definition.searchKeys.some((key) => String(record[key] ?? "").toLowerCase().includes(needle));
      const matchesStatus = !status || String(record[definition.statusKey ?? ""] ?? "") === status;
      return matchesSearch && matchesStatus;
    });
  }, [definition.searchKeys, definition.statusKey, records, search, status]);

  const visibleFields = useMemo(
    () => definition.fields.filter((field) => !(resourceKey === "inventario" && field.key === "estado")),
    [definition.fields, resourceKey]
  );

  const inventoryStatus = resourceKey === "inventario" ? calculateInventoryStatus(form.stock, form.stockMinimo) : "";
  const relationOptions = useMemo(() => {
    if (resourceKey === "cultivos") {
      return { parcela: parcelasResource.records.map((record) => String(record.nombre)).filter(Boolean) };
    }
    if (resourceKey === "cosechas") {
      return { cultivo: cultivosResource.records.map((record) => String(record.nombre)).filter(Boolean) };
    }
    return {} as Record<string, string[]>;
  }, [cultivosResource.records, parcelasResource.records, resourceKey]);

  const openCreate = () => {
    setEditing(null);
    const nextForm = emptyRecord(definition.fields);
    if (resourceKey === "parcelas") {
      nextForm.lat = HONDURAS_CENTER[0];
      nextForm.lng = HONDURAS_CENTER[1];
    }
    if (resourceKey === "cultivos" && relationOptions.parcela?.[0]) {
      nextForm.parcela = relationOptions.parcela[0];
    }
    if (resourceKey === "cosechas" && relationOptions.cultivo?.[0]) {
      nextForm.cultivo = relationOptions.cultivo[0];
    }
    setForm(nextForm);
    setError("");
    setOpen(true);
  };

  const openEdit = (record: ResourceRecord) => {
    setEditing(record);
    setForm({ ...record });
    setError("");
    setOpen(true);
  };

  const save = async () => {
    const missing = visibleFields.find((field) => field.required && !String(form[field.key] ?? "").trim());
    if (missing) {
      setError(`Completa: ${missing.label}.`);
      return;
    }

    if (resourceKey === "parcelas") {
      const lat = Number(form.lat);
      const lng = Number(form.lng);
      if (!isInsideHonduras(lat, lng)) {
        setError(
          `La geolocalizacion debe estar dentro de Honduras: lat ${HONDURAS_BOUNDS[0][0]} a ${HONDURAS_BOUNDS[1][0]}, lng ${HONDURAS_BOUNDS[0][1]} a ${HONDURAS_BOUNDS[1][1]}.`
        );
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = resourceKey === "inventario" ? { ...form, estado: inventoryStatus } : form;
      if (editing) await update(editing.id, payload);
      else await create(payload);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRecord = async (record: ResourceRecord) => {
    const ok = await modernConfirm({
      title: `Eliminar ${definition.entityLabel.toLowerCase()}`,
      message: `¿Estás seguro que deseas eliminar el registro "${record.nombre ?? record.concepto ?? record.id}"? Esta acción no se puede deshacer.`,
      type: "warning",
      confirmText: "Eliminar",
      cancelText: "Cancelar"
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      await remove(record.id);
    } catch (err) {
      await modernAlert({
        title: "Error al eliminar",
        message: err instanceof Error ? err.message : "No se pudo completar la operación.",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sendCommunication = async (record: ResourceRecord, canal: "Correo" | "WhatsApp") => {
    let destino: string | null = "";
    if (canal === "WhatsApp") {
      destino = await modernPrompt({
        title: "Enviar WhatsApp",
        message: "Número de WhatsApp con código de país:",
        defaultValue: "+504",
        placeholder: "+504 9999-0000"
      });
    } else {
      destino = await modernPrompt({
        title: "Enviar Correo",
        message: "Dirección de correo electrónico de destino:",
        defaultValue: String(record.destinatario ?? ""),
        placeholder: "usuario@ejemplo.com"
      });
    }
    
    if (destino === null) return;
    destino = destino.trim();

    if (!destino) {
      await modernAlert({
        title: "Dato requerido",
        message: "Debes introducir un destino válido.",
        type: "warning"
      });
      return;
    }

    setSubmitting(true);
    try {
      const asunto =
        resourceKey === "reportes"
          ? `Reporte AgroSync: ${record.titulo ?? record.id}`
          : `Alerta AgroSync: ${record.tipo ?? record.id}`;
      const mensaje =
        resourceKey === "reportes"
          ? `Adjunto/enlace del reporte ${record.titulo ?? record.id}. Descarga: ${location.origin}/api/reports/${record.id}/pdf`
          : `Notificacion AgroSync: ${record.mensaje ?? record.id}`;

      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurso: resourceKey, recursoId: record.id, canal, destino, asunto, mensaje }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        deliveryMode?: "smtp" | "mailto" | "whatsapp";
        link?: string;
        message?: string;
        sent?: boolean;
      };

      if (!response.ok) {
        if (result.link && canal === "Correo") {
          window.location.href = result.link;
        }
        await modernAlert({
          title: "Error de comunicación",
          message: result.message ?? "No se pudo enviar la comunicacion.",
          type: "error"
        });
        return;
      }

      if (result.deliveryMode === "smtp" && result.sent) {
        await modernAlert({
          title: "Envío exitoso",
          message: "Correo enviado correctamente.",
          type: "success"
        });
        return;
      }

      if (result.link) {
        if (canal === "Correo") {
          window.location.href = result.link;
        } else {
          window.open(result.link, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      await modernAlert({
        title: "Error inesperado",
        message: "No se pudo procesar el envío de la comunicación.",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label={`Total ${definition.entityLabel}s`} value={String(records.length)} sub="registrados" />
        <SummaryCard label="Resultados" value={String(filtered.length)} sub="segun busqueda" />
        <SummaryCard label="Persistencia" value={dbConfigured ? "MySQL" : "Local"} sub={dbConfigured ? "guardado automatico" : "sin DATABASE_URL"} />
        <SummaryCard label="Estado" value={loading ? "Cargando" : "Listo"} sub="CRUD habilitado" />
      </div>

      {resourceKey === "parcelas" && (
        <div className="pro-card flex items-center gap-3 rounded-2xl px-4 py-3">
          <MapPin size={16} className="text-[var(--primary)]" />
          <p className="text-sm text-[#1E1E1E]">
            Mapa y geolocalizacion restringidos a Honduras.
          </p>
        </div>
      )}

      <div className="pro-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-white/48 p-4">
          <div className="pro-focus flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 flex-1 min-w-[220px] max-w-sm">
            <Search size={13} className="text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${definition.entityLabel.toLowerCase()}...`}
              className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full"
            />
          </div>

          {definition.statusKey && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/70 px-3 py-2 text-xs text-[#6B7280]">
              <Filter size={13} />
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent outline-none cursor-pointer">
                <option value="">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={openCreate}
            className="ml-auto flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-medium-body text-white shadow-[0_10px_24px_rgba(142,191,36,0.22)] transition-colors hover:bg-[var(--primary-dark)] cursor-pointer"
          >
            <Plus size={13} /> Agregar {definition.entityLabel}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["ID", ...definition.tableFields.map((key) => definition.fields.find((field) => field.key === key)?.label ?? key), ""].map((heading) => (
                  <th key={heading} className="bg-[var(--surface-2)]/60 text-left px-4 py-3 font-heading text-[10px] text-[#7A8678] uppercase tracking-wider whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="group border-b border-[var(--secondary)] transition-colors hover:bg-[var(--surface-2)]/60">
                  <td className="px-4 py-3 font-body text-[11px] text-[#9CA3AF]">{record.id}</td>
                  {definition.tableFields.map((key, index) => {
                    const value = record[key];
                    return (
                      <td key={key} className="px-4 py-3 text-xs text-[#1E1E1E] whitespace-nowrap">
                        {index === 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[var(--primary)]/10 flex items-center justify-center">
                              <Icon size={11} className="text-[var(--primary)]" />
                            </div>
                            <span className="font-medium-body">{valueLabel(value)}</span>
                          </div>
                        ) : key === definition.statusKey || key === "estado" || key === "tipo" || key === "severidad" || key === "resuelta" ? (
                          <Badge className={`text-[10px] px-2 py-0.5 ${badgeClass[String(value)] ?? "bg-gray-100 text-gray-600 border-0"}`}>
                            {valueLabel(value)}
                          </Badge>
                        ) : (
                          valueLabel(value)
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              onClick={() => openEdit(record)}
                              disabled={submitting}
                              className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Edit2 size={13} />
                            </button>
                          }
                        />
                        <TooltipContent side="top" className="bg-[#1E1E1E] text-white border border-white/10 text-[10px] px-2 py-1 rounded shadow-md">
                          Editar
                        </TooltipContent>
                      </Tooltip>

                      {resourceKey === "reportes" && (
                        <>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <a
                                  href={`/api/reports/${record.id}/pdf`}
                                  className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors cursor-pointer"
                                >
                                  <Download size={13} />
                                </a>
                              }
                            />
                            <TooltipContent side="top" className="bg-[#1E1E1E] text-white border border-white/10 text-[10px] px-2 py-1 rounded shadow-md">
                              Descargar PDF
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  onClick={() => void sendCommunication(record, "Correo")}
                                  disabled={submitting}
                                  className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors cursor-pointer disabled:opacity-40"
                                >
                                  <Mail size={13} />
                                </button>
                              }
                            />
                            <TooltipContent side="top" className="bg-[#1E1E1E] text-white border border-white/10 text-[10px] px-2 py-1 rounded shadow-md">
                              Enviar correo
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}

                      {resourceKey === "alertas" && (
                        <>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  onClick={() => void sendCommunication(record, "Correo")}
                                  disabled={submitting}
                                  className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors cursor-pointer disabled:opacity-40"
                                >
                                  <Mail size={13} />
                                </button>
                              }
                            />
                            <TooltipContent side="top" className="bg-[#1E1E1E] text-white border border-white/10 text-[10px] px-2 py-1 rounded shadow-md">
                              Enviar correo
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  onClick={() => void sendCommunication(record, "WhatsApp")}
                                  disabled={submitting}
                                  className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[#9CA3AF] hover:text-[var(--primary)] transition-colors cursor-pointer disabled:opacity-40"
                                >
                                  <MessageCircle size={13} />
                                </button>
                              }
                            />
                            <TooltipContent side="top" className="bg-[#1E1E1E] text-white border border-white/10 text-[10px] px-2 py-1 rounded shadow-md">
                              Enviar WhatsApp
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              onClick={() => void deleteRecord(record)}
                              disabled={submitting}
                              className="p-1.5 rounded-md hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 size={13} />
                            </button>
                          }
                        />
                        <TooltipContent side="top" className="bg-[#1E1E1E] text-white border border-white/10 text-[10px] px-2 py-1 rounded shadow-md">
                          Eliminar
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-[#9CA3AF]" colSpan={definition.tableFields.length + 2}>
                    No hay registros para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!submitting) setOpen(v); }}>
        <DialogContent className="sm:max-w-2xl border-[var(--border)] bg-card p-0 overflow-hidden shadow-2xl" showCloseButton={!submitting}>
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--border)] bg-white/20">
            <DialogTitle>{editing ? "Editar" : "Nuevo"} {definition.entityLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            {resourceKey === "parcelas" && (
              <ParcelaLocationPicker
                lat={Number(form.lat)}
                lng={Number(form.lng)}
                onSelect={(lat, lng) => !submitting && setForm((current) => ({ ...current, lat, lng }))}
              />
            )}
            {visibleFields.map((field) => (
              <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2 block" : "block"}>
                <span className="font-medium-body text-xs text-[#1E1E1E]">
                  {field.label}{field.required ? " *" : ""}
                </span>
                <FieldInput
                  field={field}
                  value={form[field.key]}
                  options={relationOptions[field.key]}
                  disabled={submitting}
                  onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                />
              </label>
            ))}
            {resourceKey === "inventario" && (
              <div className="sm:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2">
                <p className="text-xs text-[#6B7280]">Estado automatico por existencia</p>
                <Badge className={`mt-1 text-[10px] px-2 py-0.5 ${badgeClass[inventoryStatus] ?? "bg-gray-100 text-gray-600 border-0"}`}>
                  {inventoryStatus}
                </Badge>
              </div>
            )}
            {error && (
              <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 animate-fade-up">
                <AlertTriangle size={13} />
                {error}
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]">
            <button
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs text-[#6B7280] hover:text-[#1E1E1E] bg-white transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => void save()}
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ResourceCrudPage({ resourceKey }: { resourceKey: ResourceKey }) {
  const definition = resourceDefinitions[resourceKey];
  return <CrudModule resourceKey={definition.key} />;
}
