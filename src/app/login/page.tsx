import LoginForm from "@/components/auth/LoginForm";
import { APP_COPYRIGHT, APP_VERSION } from "@/lib/app-info";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_440px]">
        <section className="relative hidden overflow-hidden bg-[var(--sidebar)] lg:block">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(142,191,36,0.78), rgba(30,30,30,0.92)), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]">
                <Leaf size={19} />
              </div>
              <span className="font-heading text-xl">AgroSync</span>
            </div>
            <div className="max-w-xl">
              <h1 className="font-heading text-5xl leading-tight tracking-normal">
                Gestión Agrícola
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/75">
                Administra parcelas, cultivos, usuarios y reportes con datos reales para tomar mejores decisiones en cada cosecha.
              </p>
            </div>
            <p className="text-xs text-white/60">
              {APP_COPYRIGHT} · Version {APP_VERSION}
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 sm:mb-8 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                <Leaf size={17} />
              </div>
              <span className="font-heading text-lg">AgroSync</span>
            </div>
            <div className="mb-6">
              <h2 className="font-heading text-2xl text-foreground">Acceso a la plataforma</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingresa o crea tu usuario para habilitar todos los modulos.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-card p-4 shadow-sm sm:p-5">
              <LoginForm />
            </div>
            <p className="mt-5 text-center text-xs text-muted-foreground">
              {APP_COPYRIGHT} · Version {APP_VERSION}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
