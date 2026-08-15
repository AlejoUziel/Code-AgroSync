import InvitationAcceptForm from "@/components/auth/InvitationAcceptForm";

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <section className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-card p-6 shadow-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">AgroSync · Organización</p>
        <h1 className="mt-2 font-heading text-2xl">Aceptar invitación</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">Confirma tus datos para integrarte de forma segura al equipo.</p>
        {token ? <InvitationAcceptForm token={token} /> : <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">El enlace no contiene un token válido.</p>}
      </section>
    </main>
  );
}

