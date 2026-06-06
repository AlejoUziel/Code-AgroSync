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
  Empleado,
  EstadoEmpleado,
  ContratoEmpleado,
} from "@/types/models";
import {
  User,
  Mail,
  Phone,
  DollarSign,
  Loader2,
} from "lucide-react";

type FormErrors = Partial<Record<keyof Empleado, string>>;

function validate(data: Partial<Empleado>): FormErrors {
  const errors: FormErrors = {};
  if (!data.nombre?.trim()) errors.nombre = "El nombre es requerido.";
  if (!data.puesto?.trim()) errors.puesto = "El puesto es requerido.";
  if (!data.zona?.trim()) errors.zona = "La zona es requerida.";
  if (!data.salario?.trim()) {
    errors.salario = "El salario es requerido.";
  } else {
    const numericStr = data.salario.replace(/[^0-9.]/g, "");
    if (!numericStr) {
      errors.salario = "Formato de salario inválido (ej. L. 4,500).";
    }
  }
  if (!data.contrato) errors.contrato = "Selecciona un tipo de contrato.";
  if (!data.estado) errors.estado = "Selecciona el estado actual.";
  if (!data.tel?.trim()) {
    errors.tel = "El teléfono es requerido.";
  } else if (!/^\+?[0-9\s-]{7,20}$/.test(data.tel.trim())) {
    errors.tel = "Número de teléfono inválido.";
  }
  if (!data.email?.trim()) {
    errors.email = "El correo es requerido.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Formato de correo inválido.";
  }
  return errors;
}

const defaultForm: Partial<Empleado> = {
  nombre: "",
  puesto: "",
  zona: "",
  salario: "",
  contrato: undefined,
  estado: undefined,
  rating: 5,
  tel: "",
  email: "",
  notas: "",
};

const puestosOptions = [
  { value: "Jefe de Campo", label: "Jefe de Campo" },
  { value: "Agrónoma", label: "Agrónoma" },
  { value: "Operador Maquinaria", label: "Operador Maquinaria" },
  { value: "Supervisora Cosecha", label: "Supervisora Cosecha" },
  { value: "Jornalero", label: "Jornalero" },
  { value: "Administrativo", label: "Administrativo" },
  { value: "Asesor Técnico", label: "Asesor Técnico" },
];

const zonasOptions = [
  { value: "Zona Norte", label: "Zona Norte" },
  { value: "Zona Sur", label: "Zona Sur" },
  { value: "Zona Este", label: "Zona Este" },
  { value: "Zona Oeste", label: "Zona Oeste" },
  { value: "Zona Central", label: "Zona Central" },
];

const contratosOptions: { value: ContratoEmpleado; label: string }[] = [
  { value: "Permanente", label: "Permanente" },
  { value: "Temporal", label: "Temporal" },
];

const estadosOptions: { value: EstadoEmpleado; label: string }[] = [
  { value: "En Campo", label: "Trabajando en Campo" },
  { value: "En Oficina", label: "En Oficina" },
  { value: "Descanso", label: "En Descanso" },
  { value: "Vacaciones", label: "De Vacaciones" },
];

const ratingsOptions = [
  { value: "1", label: "1 Estrella" },
  { value: "2", label: "2 Estrellas" },
  { value: "3", label: "3 Estrellas" },
  { value: "4", label: "4 Estrellas" },
  { value: "5", label: "5 Estrellas" },
];

interface EmpleadoFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Empleado>) => void;
  empleado?: Empleado | null;
}

export default function EmpleadoForm({
  open,
  onClose,
  onSave,
  empleado,
}: EmpleadoFormProps) {
  const isEditing = !!empleado;
  const [form, setForm] = useState<Partial<Empleado>>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof Empleado, boolean>>
  >({});

  useEffect(() => {
    if (open) {
      setForm(empleado ? { ...empleado } : { ...defaultForm });
      setErrors({});
      setTouched({});
    }
  }, [open, empleado]);

  const set = (key: keyof Empleado, value: any) => {
    let finalValue = value;
    if (key === "salario") {
      let cleaned = value.replace(/[^0-9]/g, "");
      if (cleaned) {
        finalValue = `L. ${Number(cleaned).toLocaleString("en-US")}`;
      } else {
        finalValue = "";
      }
    }
    setForm((prev) => ({ ...prev, [key]: finalValue }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    const updated = { ...form, [key]: finalValue };
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
    await new Promise((r) => setTimeout(r, 600));
    
    let avatar = "";
    if (form.nombre) {
      const parts = form.nombre.trim().split(/\s+/);
      if (parts.length >= 2) {
        avatar = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      } else if (parts.length === 1 && parts[0]) {
        avatar = parts[0].substring(0, 2).toUpperCase();
      }
    }

    onSave({
      ...form,
      avatar: avatar || "EM",
    });
    setSaving(false);
  };

  const err = (k: keyof Empleado) => (touched[k] ? errors[k] : undefined);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl border-border bg-card p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base text-[#1E1E1E]">
                {isEditing ? "Editar Empleado" : "Nuevo Empleado"}
              </DialogTitle>
              <p className="font-body text-xs text-[#9CA3AF] mt-0.5">
                {isEditing
                  ? `Editando perfil de: ${empleado?.nombre}`
                  : "Registra un nuevo empleado en la plataforma"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-card">
          <FormSection title="Datos Personales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre Completo" required error={err("nombre")}>
                <TextInput
                  placeholder="Ej. Roberto Méndez"
                  value={form.nombre ?? ""}
                  onChange={(e) => set("nombre", e.target.value)}
                  error={!!err("nombre")}
                  icon={<User size={13} />}
                />
              </Field>
              <Field label="Correo Electrónico" required error={err("email")}>
                <TextInput
                  type="email"
                  placeholder="correo@agrosync.com"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  error={!!err("email")}
                  icon={<Mail size={13} />}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Teléfono" required error={err("tel")}>
                <TextInput
                  placeholder="Ej. +52 123 456 7890"
                  value={form.tel ?? ""}
                  onChange={(e) => set("tel", e.target.value)}
                  error={!!err("tel")}
                  icon={<Phone size={13} />}
                />
              </Field>
              <Field label="Calificación (Desempeño)" required error={err("rating")}>
                <SelectInput
                  value={form.rating?.toString() ?? "5"}
                  onChange={(e) => set("rating", parseInt(e.target.value))}
                  options={ratingsOptions}
                  error={!!err("rating")}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Asignación y Nómina">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Puesto / Cargo" required error={err("puesto")}>
                <SelectInput
                  value={form.puesto ?? ""}
                  onChange={(e) => set("puesto", e.target.value)}
                  options={puestosOptions}
                  placeholder="Seleccionar puesto..."
                  error={!!err("puesto")}
                />
              </Field>
              <Field label="Zona de Trabajo" required error={err("zona")}>
                <SelectInput
                  value={form.zona ?? ""}
                  onChange={(e) => set("zona", e.target.value)}
                  options={zonasOptions}
                  placeholder="Seleccionar zona..."
                  error={!!err("zona")}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Salario Mensual (HNL)" required error={err("salario")} hint="Se formateará automáticamente">
                <TextInput
                  placeholder="Ej. 18500"
                  value={form.salario ?? ""}
                  onChange={(e) => set("salario", e.target.value)}
                  error={!!err("salario")}
                  icon={<DollarSign size={13} />}
                />
              </Field>
              <Field label="Tipo de Contrato" required error={err("contrato")}>
                <SelectInput
                  value={form.contrato ?? ""}
                  onChange={(e) => set("contrato", e.target.value)}
                  options={contratosOptions}
                  placeholder="Seleccionar tipo..."
                  error={!!err("contrato")}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Estado Operativo" required error={err("estado")}>
                <SelectInput
                  value={form.estado ?? ""}
                  onChange={(e) => set("estado", e.target.value)}
                  options={estadosOptions}
                  placeholder="Seleccionar estado..."
                  error={!!err("estado")}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Notas Adicionales">
            <TextareaInput
              placeholder="Notas u observaciones sobre el desempeño, certificaciones o restricciones médicas..."
              value={form.notas ?? ""}
              onChange={(e) => set("notas", e.target.value)}
              rows={2}
            />
          </FormSection>
        </div>

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
              <>{isEditing ? "Guardar Cambios" : "Registrar Empleado"}</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
