"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Building2, Eye, EyeOff, KeyRound, Lock, LogIn, Mail, Phone, User, UserPlus, Loader2 } from "lucide-react";
import { completeMfaLogin, login, register, type LoginState, type RegisterState } from "@/app/actions/auth";

const initialState: LoginState = {};
const initialRegisterState: RegisterState = {};

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [mfaState, mfaAction, mfaPending] = useActionState(completeMfaLogin, initialState);
  const [registerState, registerAction, registerPending] = useActionState(register, initialRegisterState);
  const pending = loginPending || mfaPending || registerPending;

  const fieldClass =
    "mt-1 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-card px-3 py-2 text-foreground focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/10";
  const inputClass = "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:text-muted-foreground/60 disabled:cursor-not-allowed";
  const iconClass = "text-[var(--primary)] shrink-0";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMode("login");
            setShowPassword(false);
            setShowConfirmPassword(false);
          }}
          className={`rounded-md px-3 py-2 text-xs font-medium-body transition-colors cursor-pointer disabled:opacity-50 ${
            mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMode("register");
            setShowPassword(false);
            setShowConfirmPassword(false);
          }}
          className={`rounded-md px-3 py-2 text-xs font-medium-body transition-colors cursor-pointer disabled:opacity-50 ${
            mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Crear usuario
        </button>
      </div>

      <div key={mode} className="animate-fade-up duration-300">
        {mode === "login" ? loginState.mfaRequired ? (
          <form action={mfaAction} className="space-y-4" noValidate>
            <input type="hidden" name="challenge" value={loginState.mfaChallenge ?? ""} />
            <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-3 py-3 text-xs text-muted-foreground">
              La contraseña fue validada. Completa el segundo factor para crear la sesión.
            </div>
            <div>
              <label htmlFor="mfa-code" className="font-medium-body text-xs text-foreground">
                Código de autenticación
              </label>
              <div className={fieldClass}>
                <KeyRound size={15} className={iconClass} />
                <input
                  id="mfa-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  placeholder="000000 o código de recuperación"
                  className={inputClass}
                  disabled={pending}
                />
              </div>
            </div>
            {(mfaState.message || loginState.message) && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${mfaState.message ? "border-red-200 bg-red-50 text-red-600" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                {mfaState.message ?? loginState.message}
              </div>
            )}
            <button
              type="submit"
              disabled={pending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-sm font-medium-body text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {mfaPending ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              Verificar y entrar
            </button>
          </form>
        ) : (
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
                  disabled={pending}
                />
              </div>
              {loginState?.errors?.email && <p className="mt-1 text-xs text-red-500">{loginState.errors.email}</p>}
            </div>

            <Link href="/recuperar-contrasena" className="block text-right text-xs text-[var(--primary)] hover:underline">
              ¿Olvidaste tu contrasena?
            </Link>

            <div>
              <label htmlFor="password" className="font-medium-body text-xs text-foreground">
                Contrasena
              </label>
              <div className={fieldClass}>
                <Lock size={15} className={iconClass} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  placeholder="Minimo 8 caracteres"
                  className={inputClass}
                  disabled={pending}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {loginState?.errors?.password && <p className="mt-1 text-xs text-red-500">{loginState.errors.password}</p>}
            </div>

            {loginState?.message && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 animate-fade-up">
                {loginState.message}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-sm font-medium-body text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-60 cursor-pointer active:scale-98"
            >
              {loginPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Iniciar sesion
                </>
              )}
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
                  <input id="nombre" name="nombre" required placeholder="Nombre" className={inputClass} disabled={pending} />
                </div>
                {registerState?.errors?.nombre && <p className="mt-1 text-xs text-red-500">{registerState.errors.nombre}</p>}
              </div>
              <div>
                <label htmlFor="apellido" className="font-medium-body text-xs text-foreground">
                  Apellido
                </label>
                <div className={fieldClass}>
                  <User size={15} className={iconClass} />
                  <input id="apellido" name="apellido" required placeholder="Apellido" className={inputClass} disabled={pending} />
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
                <input id="register-email" name="email" type="email" autoComplete="email" required placeholder="usuario@empresa.com" className={inputClass} disabled={pending} />
              </div>
              {registerState?.errors?.email && <p className="mt-1 text-xs text-red-500">{registerState.errors.email}</p>}
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/55 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-medium-body text-foreground">
                <Building2 size={15} className={iconClass} />
                Acceso inicial: Administrador de empresa
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Podras administrar los modulos de tu empresa, sin acceso a otras organizaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="telefono" className="font-medium-body text-xs text-foreground">
                  Telefono
                </label>
                <div className={fieldClass}>
                  <Phone size={15} className={iconClass} />
                  <input id="telefono" name="telefono" required placeholder="+504 9999-0000" className={inputClass} disabled={pending} />
                </div>
                {registerState?.errors?.telefono && <p className="mt-1 text-xs text-red-500">{registerState.errors.telefono}</p>}
              </div>
              <div>
                <label htmlFor="empresa" className="font-medium-body text-xs text-foreground">
                  Empresa
                </label>
                <div className={fieldClass}>
                  <Building2 size={15} className={iconClass} />
                  <input id="empresa" name="empresa" required placeholder="Nombre de empresa" className={inputClass} disabled={pending} />
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
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Minimo 8 caracteres"
                    className={inputClass}
                    disabled={pending}
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setShowPassword((show) => !show)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {registerState?.errors?.password && <p className="mt-1 text-xs text-red-500">{registerState.errors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="font-medium-body text-xs text-foreground">
                  Confirmar
                </label>
                <div className={fieldClass}>
                  <Lock size={15} className={iconClass} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Repite la contrasena"
                    className={inputClass}
                    disabled={pending}
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setShowConfirmPassword((show) => !show)}
                    aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {registerState?.errors?.confirmPassword && <p className="mt-1 text-xs text-red-500">{registerState.errors.confirmPassword}</p>}
              </div>
            </div>

            {registerState?.message && (
              <div className={`rounded-lg border px-3 py-2 text-xs animate-fade-up ${registerState.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                {registerState.message}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-sm font-medium-body text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-60 cursor-pointer active:scale-98"
            >
              {registerPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creando usuario...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Crear cuenta
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
