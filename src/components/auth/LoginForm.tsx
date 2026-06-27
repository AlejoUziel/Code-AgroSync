"use client";

import { useActionState, useState } from "react";
import { Building2, Eye, Lock, LogIn, Mail, Phone, User, UserPlus } from "lucide-react";
import { login, register, type LoginState, type RegisterState } from "@/app/actions/auth";
import { departamentos } from "@/lib/departments";

const initialState: LoginState = {};
const initialRegisterState: RegisterState = {};

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [registerState, registerAction, registerPending] = useActionState(register, initialRegisterState);
  const pending = loginPending || registerPending;

  const fieldClass =
    "mt-1 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-card px-3 py-2 text-foreground focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/10";
  const inputClass = "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground";
  const iconClass = "text-[var(--primary)]";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-md px-3 py-2 text-xs font-medium-body transition-colors ${
            mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-md px-3 py-2 text-xs font-medium-body transition-colors ${
            mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Crear usuario
        </button>
      </div>

      {mode === "login" ? (
    <form action={loginAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="font-medium-body text-xs text-foreground">
          Correo electronico
        </label>
        <div className={fieldClass}>
          <Mail size={15} className={iconClass} />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="usuario@empresa.com"
            className={inputClass}
          />
        </div>
        {loginState?.errors?.email && <p className="mt-1 text-xs text-red-500">{loginState.errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="font-medium-body text-xs text-foreground">
          Contrasena
        </label>
        <div className={fieldClass}>
          <Lock size={15} className={iconClass} />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="Minimo 8 caracteres"
            className={inputClass}
          />
          <Eye size={15} className="text-muted-foreground" aria-hidden="true" />
        </div>
        {loginState?.errors?.password && <p className="mt-1 text-xs text-red-500">{loginState.errors.password}</p>}
      </div>

      {loginState?.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {loginState.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-sm font-medium-body text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-60"
      >
        <LogIn size={15} />
        {loginPending ? "Validando..." : "Iniciar sesion"}
      </button>
    </form>
      ) : (
        <form action={registerAction} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="font-medium-body text-xs text-foreground">
                Nombre
              </label>
              <div className={fieldClass}>
                <User size={15} className={iconClass} />
                <input id="nombre" name="nombre" required placeholder="Nombre" className={inputClass} />
              </div>
              {registerState?.errors?.nombre && <p className="mt-1 text-xs text-red-500">{registerState.errors.nombre}</p>}
            </div>
            <div>
              <label htmlFor="apellido" className="font-medium-body text-xs text-foreground">
                Apellido
              </label>
              <div className={fieldClass}>
                <User size={15} className={iconClass} />
                <input id="apellido" name="apellido" required placeholder="Apellido" className={inputClass} />
              </div>
              {registerState?.errors?.apellido && <p className="mt-1 text-xs text-red-500">{registerState.errors.apellido}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="font-medium-body text-xs text-foreground">
              Correo electronico
            </label>
            <div className={fieldClass}>
              <Mail size={15} className={iconClass} />
              <input id="register-email" name="email" type="email" autoComplete="email" required placeholder="usuario@empresa.com" className={inputClass} />
            </div>
            {registerState?.errors?.email && <p className="mt-1 text-xs text-red-500">{registerState.errors.email}</p>}
          </div>

          <div>
            <label htmlFor="departamento" className="font-medium-body text-xs text-foreground">
              Departamento o acceso
            </label>
            <div className={fieldClass}>
              <Building2 size={15} className={iconClass} />
              <select
                id="departamento"
                name="departamento"
                required
                defaultValue="Administrativo"
                className="w-full bg-transparent text-sm outline-none"
              >
                {departamentos.map((departamento) => (
                  <option key={departamento.value} value={departamento.value}>
                    {departamento.label}
                  </option>
                ))}
              </select>
            </div>
            {registerState?.errors?.departamento && <p className="mt-1 text-xs text-red-500">{registerState.errors.departamento}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="telefono" className="font-medium-body text-xs text-foreground">
                Telefono
              </label>
              <div className={fieldClass}>
                <Phone size={15} className={iconClass} />
                <input id="telefono" name="telefono" required placeholder="+504 9999-0000" className={inputClass} />
              </div>
              {registerState?.errors?.telefono && <p className="mt-1 text-xs text-red-500">{registerState.errors.telefono}</p>}
            </div>
            <div>
              <label htmlFor="empresa" className="font-medium-body text-xs text-foreground">
                Empresa
              </label>
              <div className={fieldClass}>
                <Building2 size={15} className={iconClass} />
                <input id="empresa" name="empresa" required placeholder="Nombre de empresa" className={inputClass} />
              </div>
              {registerState?.errors?.empresa && <p className="mt-1 text-xs text-red-500">{registerState.errors.empresa}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="register-password" className="font-medium-body text-xs text-foreground">
                Contrasena
              </label>
              <div className={fieldClass}>
                <Lock size={15} className={iconClass} />
                <input id="register-password" name="password" type="password" required minLength={8} placeholder="Minimo 8 caracteres" className={inputClass} />
              </div>
              {registerState?.errors?.password && <p className="mt-1 text-xs text-red-500">{registerState.errors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="font-medium-body text-xs text-foreground">
                Confirmar
              </label>
              <div className={fieldClass}>
                <Lock size={15} className={iconClass} />
                <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} placeholder="Repite la contrasena" className={inputClass} />
              </div>
              {registerState?.errors?.confirmPassword && <p className="mt-1 text-xs text-red-500">{registerState.errors.confirmPassword}</p>}
            </div>
          </div>

          {registerState?.message && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {registerState.message}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-sm font-medium-body text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-60"
          >
            <UserPlus size={15} />
            {registerPending ? "Creando usuario..." : "Crear usuario e ingresar"}
          </button>
        </form>
      )}
    </div>
  );
}
