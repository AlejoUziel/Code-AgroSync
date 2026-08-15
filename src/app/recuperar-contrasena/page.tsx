import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";

export default function PasswordRecoveryPage() {
  return <main className="grid min-h-screen place-items-center bg-[var(--secondary)] p-4"><section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-card p-6 shadow-xl"><h1 className="text-2xl font-semibold">Recuperar acceso</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">Te enviaremos un enlace de un solo uso que vence en 30 minutos.</p><PasswordRecoveryForm /></section></main>;
}
