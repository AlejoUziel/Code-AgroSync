import { randomUUID } from "crypto";
import type { ResultSetHeader } from "mysql2";
import { isDatabaseConfigured, query } from "@/lib/db";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const canal = String(body.canal ?? "");
  const recurso = String(body.recurso ?? "");
  const recursoId = String(body.recursoId ?? "");
  const destino = String(body.destino ?? "");
  const asunto = String(body.asunto ?? "AgroSync");
  const mensaje = String(body.mensaje ?? "");
  const session = await readSession();

  if (isDatabaseConfigured) {
    await query<ResultSetHeader>(
      `INSERT INTO comunicacion_envios (
         id, empresa_id, recurso, recurso_id, canal, destino, asunto, mensaje
       ) VALUES (
         :id, :empresaId, :recurso, :recursoId, :canal, :destino, :asunto, :mensaje
       )`,
      {
        id: randomUUID(),
        empresaId: session?.empresaId ?? "EMP-DEMO",
        recurso,
        recursoId,
        canal,
        destino,
        asunto,
        mensaje,
      }
    );
  }

  const link =
    canal === "WhatsApp"
      ? `https://wa.me/${destino.replace(/[^\d]/g, "")}?text=${encodeURIComponent(mensaje || asunto)}`
      : `mailto:${destino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;

  return Response.json({
    ok: true,
    dbConfigured: isDatabaseConfigured,
    link,
  });
}
