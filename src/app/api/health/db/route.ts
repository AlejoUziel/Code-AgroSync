import { isDatabaseConfigured, query } from "@/lib/db";

export async function GET() {
  if (!isDatabaseConfigured) {
    return Response.json(
      { ok: false, message: "DATABASE_URL no esta configurada." },
      { status: 503 }
    );
  }

  try {
    await query("SELECT 1 AS ok");
    return Response.json({ ok: true, database: "postgresql", provider: "neon" });
  } catch {
    return Response.json(
      { ok: false, message: "No se pudo conectar a PostgreSQL en Neon." },
      { status: 503 }
    );
  }
}
