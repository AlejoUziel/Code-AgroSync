"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  TextInput,
  SelectInput,
  TextareaInput,
  FormSection,
} from "@/components/shared/FormComponents";
import {
  Empresa,
  EstadoEmpresa,
  PlanTipo,
} from "@/types/models";
import { Building2, Mail, Phone, MapPin, Globe, FileText, Loader2 } from "lucide-react";

// ─── Validation ───────────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof Empresa, string>>;

function validate(data: Partial<Empresa>): FormErrors {
  const errors: FormErrors = {};
  if (!data.nombre?.trim()) errors.nombre = "El nombre es requerido.";
  if (!data.nit?.trim()) errors.nit = "El NIT/RUC es requerido.";
  if (!data.email?.trim()) {
    errors.email = "El correo es requerido.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Formato de correo inválido.";
  }
  if (!data.telefono?.trim()) errors.telefono = "El teléfono es requerido.";
  if (!data.ciudad?.trim()) errors.ciudad = "La ciudad es requerida.";
  if (!data.pais?.trim()) errors.pais = "El país es requerido.";
  if (!data.plan) errors.plan = "Selecciona un plan.";
  if (!data.estado) errors.estado = "Selecciona un estado.";
  return errors;
}

// ─── Default form state ───────────────────────────────────────────────────────
const defaultForm: Partial<Empresa> = {
  nombre: "",
  nit: "",
  email: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  pais: "",
  plan: undefined,
  estado: undefined,
  notas: "",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface EmpresaFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Empresa>) => void;
  empresa?: Empresa | null; // null = create mode
}

const planes: { value: PlanTipo; label: string }[] = [
  { value: "Starter", label: "Starter — Hasta 5 usuarios" },
  { value: "Pro", label: "Pro — Hasta 50 usuarios" },
  { value: "Enterprise", label: "Enterprise — Usuarios ilimitados" },
];

const estados: { value: EstadoEmpresa; label: string }[] = [
  { value: "Activa", label: "Activa" },
  { value: "Inactiva", label: "Inactiva" },
  { value: "Suspendida", label: "Suspendida" },
];

// No static country array needed for global support

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmpresaForm({
  open,
  onClose,
  onSave,
  empresa,
}: EmpresaFormProps) {
  const isEditing = !!empresa;
  const [form, setForm] = useState<Partial<Empresa>>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof Empresa, boolean>>>({});

  // Populate form when editing
  useEffect(() => {
    if (open) {
      setForm(empresa ? { ...empresa } : { ...defaultForm });
      setErrors({});
      setTouched({});
    }
  }, [open, empresa]);

  const set = (key: keyof Empresa, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    // Live validation for touched fields
    const updated = { ...form, [key]: value };
    const errs = validate(updated);
    setErrors((prev) => ({ ...prev, [key]: errs[key] }));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    setErrors(errs);
    setTouched(
      Object.keys(defaultForm).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    );
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    // Simulate async save (replace with fetch() for MySQL)
    await new Promise((r) => setTimeout(r, 600));
    onSave(form);
    setSaving(false);
  };

  const err = (k: keyof Empresa) =>
    touched[k] ? errors[k] : undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl border-border bg-card p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center">
              <Building2 size={16} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base text-[#1E1E1E]">
                {isEditing ? "Editar Empresa" : "Nueva Empresa"}
              </DialogTitle>
              <p className="font-body text-xs text-[#9CA3AF] mt-0.5">
                {isEditing
                  ? `Editando: ${empresa?.nombre}`
                  : "Completa los datos para registrar la empresa"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* General */}
          <FormSection title="Información General">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre de la Empresa" required error={err("nombre")}>
                <TextInput
                  placeholder="Ej. AgroSur S.A."
                  value={form.nombre ?? ""}
                  onChange={(e) => set("nombre", e.target.value)}
                  error={!!err("nombre")}
                  icon={<Building2 size={13} />}
                />
              </Field>
              <Field
                label="NIT / RUC / RFC"
                required
                error={err("nit")}
                hint="Número de identificación tributaria"
              >
                <TextInput
                  placeholder="Ej. 900-123-456-7"
                  value={form.nit ?? ""}
                  onChange={(e) => set("nit", e.target.value)}
                  error={!!err("nit")}
                  icon={<FileText size={13} />}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Correo Electrónico" required error={err("email")}>
                <TextInput
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  error={!!err("email")}
                  icon={<Mail size={13} />}
                />
              </Field>
              <Field label="Teléfono" required error={err("telefono")}>
                <TextInput
                  placeholder="+57 601 234 5678"
                  value={form.telefono ?? ""}
                  onChange={(e) => set("telefono", e.target.value)}
                  error={!!err("telefono")}
                  icon={<Phone size={13} />}
                />
              </Field>
            </div>
          </FormSection>

          {/* Location */}
          <FormSection title="Ubicación">
            <Field label="Dirección">
              <TextInput
                placeholder="Av. Principal 1200, Piso 3"
                value={form.direccion ?? ""}
                onChange={(e) => set("direccion", e.target.value)}
                icon={<MapPin size={13} />}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ciudad" required error={err("ciudad")}>
                <TextInput
                  placeholder="Bogotá"
                  value={form.ciudad ?? ""}
                  onChange={(e) => set("ciudad", e.target.value)}
                  error={!!err("ciudad")}
                />
              </Field>
              <Field label="País" required error={err("pais")}>
                <TextInput
                  placeholder="Ej. Honduras o España"
                  value={form.pais ?? ""}
                  onChange={(e) => set("pais", e.target.value)}
                  error={!!err("pais")}
                />
              </Field>
            </div>
          </FormSection>

          {/* Plan & Status */}
          <FormSection title="Plan y Estado">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Plan de Suscripción" required error={err("plan")}>
                <SelectInput
                  value={form.plan ?? ""}
                  onChange={(e) => set("plan", e.target.value)}
                  options={planes}
                  error={!!err("plan")}
                />
              </Field>
              <Field label="Estado" required error={err("estado")}>
                <SelectInput
                  value={form.estado ?? ""}
                  onChange={(e) => set("estado", e.target.value)}
                  options={estados}
                  error={!!err("estado")}
                />
              </Field>
            </div>

            {/* Plan highlight */}
            {form.plan && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <p className="font-body text-xs text-[#6B7280]">
                  {form.plan === "Starter" && "Plan Starter: hasta 5 usuarios, 10 parcelas."}
                  {form.plan === "Pro" && "Plan Pro: hasta 50 usuarios, 50 parcelas, reportes avanzados."}
                  {form.plan === "Enterprise" && "Plan Enterprise: usuarios y parcelas ilimitados, soporte prioritario, API access."}
                </p>
              </div>
            )}
          </FormSection>

          {/* Notes */}
          <FormSection title="Notas Adicionales">
            <TextareaInput
              placeholder="Observaciones o comentarios sobre la empresa..."
              value={form.notas ?? ""}
              onChange={(e) => set("notas", e.target.value)}
              rows={3}
            />
          </FormSection>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border shrink-0 flex-row gap-2 justify-end bg-background">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-border text-xs font-body text-[#6B7280] hover:border-primary/40 hover:text-[#1E1E1E] transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-medium-body hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2 min-w-[120px] justify-center"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>{isEditing ? "Guardar Cambios" : "Crear Empresa"}</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

