import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[var(--secondary)] p-4"><section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-card p-6 shadow-xl"><h1 className="text-2xl font-semibold">Nueva contrasena</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">El cambio cerrara las sesiones abiertas de esta cuenta.</p><ResetPasswordForm token={token} /></section></main>;
}
