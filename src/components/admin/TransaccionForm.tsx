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
  FormSection,
} from "@/components/shared/FormComponents";
import { Transaccion } from "@/types/models";
import { DollarSign, Loader2, FileText, Calendar } from "lucide-react";

type FormErrors = Partial<Record<keyof Transaccion, string>>;

function validate(data: Partial<Transaccion>): FormErrors {
  const errors: FormErrors = {};
  if (!data.concepto?.trim()) errors.concepto = "El concepto es requerido.";
  if (!data.tipo) errors.tipo = "El tipo de transacción es requerido.";
  if (!data.categoria) errors.categoria = "La categoría es requerida.";
  if (!data.fecha) errors.fecha = "La fecha es requerida.";
  if (!data.monto || data.monto <= 0) {
    errors.monto = "El monto debe ser un valor positivo mayor a 0.";
  }
  return errors;
}

const defaultForm: Partial<Transaccion> = {
  concepto: "",
  tipo: undefined,
  monto: 0,
  fecha: new Date().toISOString().split("T")[0],
  categoria: "",
};

const categoriasOptions = [
  { value: "Venta", label: "Venta (Ingresos)" },
  { value: "Insumos", label: "Insumos (Semillas, Fertilizantes)" },
  { value: "Nómina", label: "Nómina (Pago Empleados)" },
  { value: "Operación", label: "Operación y Maquinaria" },
  { value: "Logística", label: "Logística y Transporte" },
  { value: "Administrativos", label: "Administrativos y Seguros" },
  { value: "Otro", label: "Otro" },
];

const tiposOptions = [
  { value: "Ingreso", label: "Ingreso (+)" },
  { value: "Egreso", label: "Egreso (-)" },
];

interface TransaccionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Transaccion>) => void;
  transaccion?: Transaccion | null;
}

export default function TransaccionForm({
  open,
  onClose,
  onSave,
  transaccion,
}: TransaccionFormProps) {
  const isEditing = !!transaccion;
  const [form, setForm] = useState<Partial<Transaccion>>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof Transaccion, boolean>>
  >({});
  const [montoText, setMontoText] = useState("");

  useEffect(() => {
    if (open) {
      if (transaccion) {
        setForm({ ...transaccion });
        setMontoText(`L. ${transaccion.monto.toLocaleString("en-US")}`);
      } else {
        setForm({ ...defaultForm });
        setMontoText("");
      }
      setErrors({});
      setTouched({});
    }
  }, [open, transaccion]);

  const setField = (key: keyof Transaccion, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    const updated = { ...form, [key]: value };
    const errs = validate(updated);
    setErrors((prev) => ({ ...prev, [key]: errs[key] }));
  };

  const handleMontoChange = (value: string) => {
    let cleaned = value.replace(/[^0-9]/g, "");
    let numVal = parseInt(cleaned) || 0;
    
    if (cleaned) {
      setMontoText(`L. ${Number(cleaned).toLocaleString("en-US")}`);
    } else {
      setMontoText("");
    }

    setForm((prev) => ({ ...prev, monto: numVal }));
    setTouched((prev) => ({ ...prev, monto: true }));
    const updated = { ...form, monto: numVal };
    const errs = validate(updated);
    setErrors((prev) => ({ ...prev, monto: errs.monto }));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    setErrors(errs);
    setTouched({
      concepto: true,
      tipo: true,
      monto: true,
      fecha: true,
      categoria: true,
    });
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave(form);
    setSaving(false);
  };

  const err = (k: keyof Transaccion) => (touched[k] ? errors[k] : undefined);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border bg-card p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center">
              <FileText size={16} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base text-[#1E1E1E]">
                {isEditing ? "Editar Transacción" : "Nueva Transacción"}
              </DialogTitle>
              <p className="font-body text-xs text-[#9CA3AF] mt-0.5">
                {isEditing
                  ? `Editando registro ID: ${transaccion?.id}`
                  : "Registra un nuevo movimiento de ingresos o egresos"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-card">
          <FormSection title="Detalles del Movimiento">
            <Field label="Concepto / Descripción" required error={err("concepto")}>
              <TextInput
                placeholder="Ej. Venta Maíz Amarillo o Pago Insumos"
                value={form.concepto ?? ""}
                onChange={(e) => setField("concepto", e.target.value)}
                error={!!err("concepto")}
                icon={<FileText size={13} />}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo" required error={err("tipo")}>
                <SelectInput
                  value={form.tipo ?? ""}
                  onChange={(e) => setField("tipo", e.target.value)}
                  options={tiposOptions}
                  placeholder="Seleccionar..."
                  error={!!err("tipo")}
                />
              </Field>
              <Field label="Categoría" required error={err("categoria")}>
                <SelectInput
                  value={form.categoria ?? ""}
                  onChange={(e) => setField("categoria", e.target.value)}
                  options={categoriasOptions}
                  placeholder="Seleccionar..."
                  error={!!err("categoria")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Monto (HNL)" required error={err("monto")} hint="Se formateará como L.">
                <TextInput
                  placeholder="Ej. 25000"
                  value={montoText}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  error={!!err("monto")}
                  icon={<DollarSign size={13} />}
                />
              </Field>
              <Field label="Fecha" required error={err("fecha")}>
                <TextInput
                  type="date"
                  value={form.fecha ?? ""}
                  onChange={(e) => setField("fecha", e.target.value)}
                  error={!!err("fecha")}
                  icon={<Calendar size={13} />}
                />
              </Field>
            </div>
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
              <>{isEditing ? "Guardar Cambios" : "Crear Registro"}</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
