import { departamentoLabel, normalizeDepartamento } from "@/lib/departments";
import { readSession } from "@/lib/session";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export async function GET() {
  const session = await readSession();
  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: {
      ...session,
      departamento: normalizeDepartamento(session.departamento),
      departamentoLabel: departamentoLabel(session.departamento),
      initials: initials(session.nombre),
    },
  });
}
