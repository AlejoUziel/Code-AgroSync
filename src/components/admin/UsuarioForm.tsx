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
  Usuario,
  Empresa,
  RolUsuario,
  EstadoUsuario,
} from "@/types/models";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Loader2,
  LockKeyhole,
} from "lucide-react";

// ─── Validation ───────────────────────────────────────────────────────────────
type UsuarioFormData = Partial<Usuario> & {
  password?: string;
  confirmPassword?: string;
};
type FormErrors = Partial<Record<keyof Usuario | "password" | "confirmPassword", string>>;
type EmpresaDraftErrors = Partial<Record<"nombre" | "nit" | "email" | "telefono" | "ciudad", string>>;

export type UsuarioEmpresaDraft = Pick<Empresa, "nombre" | "nit" | "email" | "telefono" | "ciudad"> & {
  direccion?: string;
  notas?: string;
};

function validate(data: UsuarioFormData, isEditing = false): FormErrors {
  const errors: FormErrors = {};
  if (!data.nombre?.trim()) errors.nombre = "El nombre es requerido.";
  if (!data.apellido?.trim()) errors.apellido = "El apellido es requerido.";
  if (!data.email?.trim()) {
    errors.email = "El correo es requerido.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Formato de correo inválido.";
  }
  if (!data.telefono?.trim()) errors.telefono = "El teléfono es requerido.";
  else if (!/^\+504\s?\d{4}-?\d{4}$/.test(data.telefono.trim())) {
    errors.telefono = "Usa formato de Honduras: +504 9999-0000.";
  }
  if (!data.rol) errors.rol = "Selecciona un rol.";
  if (!data.empresaId) errors.empresaId = "Selecciona una empresa.";
  if (!data.estado) errors.estado = "Selecciona un estado.";
  if (!isEditing || data.password || data.confirmPassword) {
    if (!data.password) errors.password = "Ingresa una contraseña.";
    else if (data.password.length < 8) errors.password = "Debe tener al menos 8 caracteres.";
    if (!data.confirmPassword) errors.confirmPassword = "Confirma la contraseña.";
    else if (data.password !== data.confirmPassword) errors.confirmPassword = "Las contraseñas no coinciden.";
  }
  return errors;
}

function validateEmpresaDraft(data: UsuarioEmpresaDraft): EmpresaDraftErrors {
  const errors: EmpresaDraftErrors = {};
  if (!data.nombre.trim()) errors.nombre = "El nombre de la empresa es requerido.";
  if (!data.nit.trim()) errors.nit = "El NIT / RUC es requerido.";
  if (!data.email.trim()) {
    errors.email = "El correo de la empresa es requerido.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Formato de correo inválido.";
  }
  if (!data.telefono.trim()) errors.telefono = "El teléfono de la empresa es requerido.";
  if (!data.ciudad.trim()) errors.ciudad = "La ciudad es requerida.";
  return errors;
}

const defaultForm: Partial<Usuario> = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  rol: undefined,
  empresaId: "",
  estado: "Activo",
  notas: "",
};

const defaultAccessFields = {
  password: "",
  confirmPassword: "",
};

const defaultEmpresaDraft: UsuarioEmpresaDraft = {
  nombre: "",
  nit: "",
  email: "",
  telefono: "",
  ciudad: "",
  direccion: "",
  notas: "",
};

const roles: { value: RolUsuario; label: string; desc: string }[] = [
  { value: "Administrador", label: "Administrador", desc: "Acceso total al sistema" },
  { value: "Administrador IT", label: "Administrador IT", desc: "Acceso general a todos los modulos" },
  { value: "Gerente de Campo", label: "Gerente de Campo", desc: "Gestión operativa completa" },
  { value: "Supervisor", label: "Supervisor", desc: "Supervisión de parcelas y empleados" },
  { value: "Operador", label: "Operador", desc: "Registro de actividades y cosechas" },
  { value: "Analista", label: "Analista", desc: "Acceso a reportes y análisis" },
  { value: "Jornalero", label: "Jornalero", desc: "Registro básico de actividades" },
];

const estados: { value: EstadoUsuario; label: string }[] = [
  { value: "Activo", label: "Activo" },
  { value: "Inactivo", label: "Inactivo" },
  { value: "Suspendido", label: "Suspendido" },
];

const rolColors: Record<RolUsuario, string> = {
  Administrador: "bg-purple-100 text-purple-600",
  "Administrador IT": "bg-[#1E1E1E] text-white",
  "Gerente de Campo": "bg-[var(--secondary)] text-[var(--primary)]",
  Supervisor: "bg-teal-100 text-teal-600",
  Operador: "bg-blue-100 text-blue-600",
  Analista: "bg-amber-100 text-amber-600",
  Jornalero: "bg-gray-100 text-gray-600",
};

interface UsuarioFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Usuario>) => void | Promise<void>;
  onCreateEmpresa?: (data: UsuarioEmpresaDraft) => Promise<Empresa | null>;
  usuario?: Usuario | null;
  empresas: Empresa[];
}

export default function UsuarioForm({
  open,
  onClose,
  onSave,
  onCreateEmpresa,
  usuario,
  empresas,
}: UsuarioFormProps) {
  const isEditing = !!usuario;
  const [form, setForm] = useState<UsuarioFormData>({ ...defaultForm, ...defaultAccessFields });
  const [errors, setErrors] = useState<FormErrors>({});
  const [empresaDraft, setEmpresaDraft] = useState<UsuarioEmpresaDraft>(defaultEmpresaDraft);
  const [createdEmpresas, setCreatedEmpresas] = useState<Empresa[]>([]);
  const [empresaErrors, setEmpresaErrors] = useState<EmpresaDraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof Usuario | "password" | "confirmPassword", boolean>>
  >({});

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setForm(usuario ? { ...usuario, ...defaultAccessFields } : { ...defaultForm, ...defaultAccessFields });
        setEmpresaDraft({ ...defaultEmpresaDraft });
        setCreatedEmpresas([]);
        setErrors({});
        setEmpresaErrors({});
        setTouched({});
      }, 0);
    }
  }, [open, usuario]);

  const availableEmpresas = [...empresas, ...createdEmpresas];
  const needsEmpresaBeforeUser = !isEditing && availableEmpresas.length === 0;

  const set = (key: keyof Usuario | "password" | "confirmPassword", value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    const updated = { ...form, [key]: value };
    const errs = validate(updated, isEditing);
    setErrors((prev) => ({ ...prev, [key]: errs[key] }));
  };

  const handleSubmit = async () => {
    const errs = validate(form, isEditing);
    setErrors(errs);
    setTouched(
      [...Object.keys(defaultForm), ...Object.keys(defaultAccessFields)].reduce((acc, k) => ({ ...acc, [k]: true }), {})
    );
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const err = (k: keyof Usuario | "password" | "confirmPassword") => (touched[k] ? errors[k] : undefined);

  const selectedRol = form.rol as RolUsuario | undefined;
  const selectedEmpresa = availableEmpresas.find((e) => e.id === form.empresaId);

  const setEmpresa = (key: keyof UsuarioEmpresaDraft, value: string) => {
    setEmpresaDraft((prev) => ({ ...prev, [key]: value }));
    setEmpresaErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleCreateEmpresa = async () => {
    const companyErrs = validateEmpresaDraft(empresaDraft);
    setEmpresaErrors(companyErrs);
    if (Object.keys(companyErrs).length > 0 || !onCreateEmpresa) return;

    setSavingEmpresa(true);
    try {
      const created = await onCreateEmpresa(empresaDraft);
      if (!created) return;
      setCreatedEmpresas((current) => [...current, created]);
      set("empresaId", created.id);
      setEmpresaDraft({ ...defaultEmpresaDraft });
      setEmpresaErrors({});
    } finally {
      setSavingEmpresa(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl border-[var(--border)] bg-card p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/12 flex items-center justify-center">
              <User size={16} className="text-[var(--primary)]" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base text-[#1E1E1E]">
                {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
              <p className="font-body text-xs text-[#9CA3AF] mt-0.5">
                {isEditing
                  ? `Editando: ${usuario?.nombre} ${usuario?.apellido}`
                  : "Registra un nuevo usuario en la plataforma"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Personal info */}
          <FormSection title="Datos Personales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" required error={err("nombre")}>
                <TextInput
                  placeholder="Juan"
                  value={form.nombre ?? ""}
                  onChange={(e) => set("nombre", e.target.value)}
                  error={!!err("nombre")}
                  icon={<User size={13} />}
                />
              </Field>
              <Field label="Apellido" required error={err("apellido")}>
                <TextInput
                  placeholder="Martínez"
                  value={form.apellido ?? ""}
                  onChange={(e) => set("apellido", e.target.value)}
                  error={!!err("apellido")}
                  icon={<User size={13} />}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Correo Electrónico" required error={err("email")}>
                <TextInput
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  error={!!err("email")}
                  icon={<Mail size={13} />}
                />
              </Field>
              <Field label="Teléfono" required error={err("telefono")}>
                <TextInput
                  placeholder="+504 9999-0000"
                  value={form.telefono ?? ""}
                  onChange={(e) => set("telefono", e.target.value)}
                  error={!!err("telefono")}
                  icon={<Phone size={13} />}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Acceso al sistema">
            {isEditing && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                <p className="text-xs font-medium-body text-[#1E1E1E]">Restablecer contraseña</p>
                <p className="mt-0.5 text-[11px] font-body text-[#6B7280]">
                  Ingresa una nueva contraseña para este usuario existente. Si queda vacia, conserva su acceso actual.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={isEditing ? "Nueva contraseña" : "Contraseña"}
                required={!isEditing}
                error={err("password")}
                hint={isEditing ? "Déjala vacía para conservar la contraseña actual." : "Mínimo 8 caracteres."}
              >
                <TextInput
                  type="password"
                  placeholder={isEditing ? "Opcional" : "Contraseña de acceso"}
                  value={form.password ?? ""}
                  onChange={(e) => set("password", e.target.value)}
                  error={!!err("password")}
                  icon={<LockKeyhole size={13} />}
                  autoComplete="new-password"
                />
              </Field>
              <Field
                label="Confirmar contraseña"
                required={!isEditing || !!form.password}
                error={err("confirmPassword")}
              >
                <TextInput
                  type="password"
                  placeholder="Repetir contraseña"
                  value={form.confirmPassword ?? ""}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  error={!!err("confirmPassword")}
                  icon={<LockKeyhole size={13} />}
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </FormSection>

          {/* Company & Role */}
          <FormSection title="Empresa y Rol">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {needsEmpresaBeforeUser ? (
                <div className="sm:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/10">
                      <Building2 size={13} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-medium-body text-xs text-[#1E1E1E]">Primero registra una empresa</p>
                      <p className="font-body text-[11px] text-[#6B7280]">
                        Luego podras seleccionarla y crear el usuario asociado.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Field label="Empresa" required error={err("empresaId")}>
                  <SelectInput
                    value={form.empresaId ?? ""}
                    onChange={(e) => set("empresaId", e.target.value)}
                    options={availableEmpresas.map((e) => ({
                      value: e.id,
                      label: `${e.nombre} (${e.plan})`,
                    }))}
                    placeholder="Seleccionar empresa..."
                    error={!!err("empresaId")}
                  />
                </Field>
              )}
              <Field label="Rol" required error={err("rol")}>
                <SelectInput
                  value={form.rol ?? ""}
                  onChange={(e) => set("rol", e.target.value)}
                  options={roles.map((r) => ({
                    value: r.value,
                    label: r.label,
                  }))}
                  placeholder="Seleccionar rol..."
                  error={!!err("rol")}
                />
              </Field>
            </div>

            {needsEmpresaBeforeUser && (
              <div className="space-y-4 rounded-lg border border-[var(--border)] bg-card p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre de empresa" required error={empresaErrors.nombre}>
                    <TextInput
                      placeholder="Finca El Progreso"
                      value={empresaDraft.nombre}
                      onChange={(e) => setEmpresa("nombre", e.target.value)}
                      error={!!empresaErrors.nombre}
                      icon={<Building2 size={13} />}
                    />
                  </Field>
                  <Field label="NIT / RUC" required error={empresaErrors.nit}>
                    <TextInput
                      placeholder="800-987-654-3"
                      value={empresaDraft.nit}
                      onChange={(e) => setEmpresa("nit", e.target.value)}
                      error={!!empresaErrors.nit}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Correo empresa" required error={empresaErrors.email}>
                    <TextInput
                      type="email"
                      placeholder="admin@empresa.com"
                      value={empresaDraft.email}
                      onChange={(e) => setEmpresa("email", e.target.value)}
                      error={!!empresaErrors.email}
                      icon={<Mail size={13} />}
                    />
                  </Field>
                  <Field label="Telefono empresa" required error={empresaErrors.telefono}>
                    <TextInput
                      placeholder="+504 9991-0002"
                      value={empresaDraft.telefono}
                      onChange={(e) => setEmpresa("telefono", e.target.value)}
                      error={!!empresaErrors.telefono}
                      icon={<Phone size={13} />}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Ciudad" required error={empresaErrors.ciudad}>
                    <TextInput
                      placeholder="Comayagua"
                      value={empresaDraft.ciudad}
                      onChange={(e) => setEmpresa("ciudad", e.target.value)}
                      error={!!empresaErrors.ciudad}
                    />
                  </Field>
                  <Field label="Direccion">
                    <TextInput
                      placeholder="Direccion de la empresa"
                      value={empresaDraft.direccion ?? ""}
                      onChange={(e) => setEmpresa("direccion", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleCreateEmpresa()}
                    disabled={savingEmpresa}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium-body text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-60"
                  >
                    {savingEmpresa && <Loader2 size={13} className="animate-spin" />}
                    Guardar empresa
                  </button>
                </div>
              </div>
            )}

            {/* Role description */}
            {selectedRol && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <Shield size={13} className="text-[var(--primary)] shrink-0" />
                <div>
                  <span
                    className={`inline-block text-[10px] font-medium-body px-2 py-0.5 rounded-full mr-2 ${rolColors[selectedRol]}`}
                  >
                    {selectedRol}
                  </span>
                  <span className="font-body text-xs text-[#9CA3AF]">
                    {roles.find((r) => r.value === selectedRol)?.desc}
                  </span>
                </div>
              </div>
            )}

            {/* Company preview */}
            {selectedEmpresa && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <div className="w-7 h-7 rounded-md bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium-body text-xs text-[#1E1E1E]">
                    {selectedEmpresa.nombre}
                  </p>
                  <p className="font-body text-[11px] text-[#9CA3AF]">
                    Plan {selectedEmpresa.plan} · {selectedEmpresa.ciudad},{" "}
                    {selectedEmpresa.pais}
                  </p>
                </div>
              </div>
            )}

            <Field label="Estado" required error={err("estado")}>
              <SelectInput
                value={form.estado ?? ""}
                onChange={(e) => set("estado", e.target.value)}
                options={estados}
                error={!!err("estado")}
              />
            </Field>
          </FormSection>

          {/* Notes */}
          <FormSection title="Notas Adicionales">
            <TextareaInput
              placeholder="Observaciones sobre el usuario..."
              value={form.notas ?? ""}
              onChange={(e) => set("notas", e.target.value)}
              rows={2}
            />
          </FormSection>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-[var(--border)] shrink-0 flex-row gap-2 justify-end bg-[var(--background)]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 hover:text-[#1E1E1E] transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium-body hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center gap-2 min-w-[120px] justify-center"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>{isEditing ? "Guardar Cambios" : "Crear Usuario"}</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
