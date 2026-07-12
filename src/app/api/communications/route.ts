import { randomUUID } from "crypto";
import type { ResultSetHeader } from "mysql2";
import { isDatabaseConfigured, query } from "@/lib/db";
import { isSmtpConfigured, sendEmail } from "@/lib/email";
import { readSession } from "@/lib/session";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json();
  const canal = String(body.canal ?? "");
  const recurso = String(body.recurso ?? "");
  const recursoId = String(body.recursoId ?? "");
  const destino = String(body.destino ?? "");
  const asunto = String(body.asunto ?? "AgroSync");
  const mensaje = String(body.mensaje ?? "");
  const session = await readSession();

  if (!canal || !recurso || !recursoId) {
    return Response.json({ message: "Datos de comunicacion incompletos." }, { status: 400 });
  }

  if (canal === "Correo" && !isValidEmail(destino)) {
    return Response.json({ message: "Ingresa un correo destino valido." }, { status: 400 });
  }

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

  let sent = false;
  let deliveryMode: "smtp" | "mailto" | "whatsapp" = canal === "WhatsApp" ? "whatsapp" : "mailto";

  if (canal === "Correo" && isSmtpConfigured()) {
    try {
      await sendEmail({ to: destino, subject: asunto, text: mensaje });
      sent = true;
      deliveryMode = "smtp";
    } catch (error) {
      return Response.json(
        {
          message: error instanceof Error ? `No se pudo enviar el correo: ${error.message}` : "No se pudo enviar el correo.",
          link,
          sent: false,
          deliveryMode: "mailto",
        },
        { status: 502 }
      );
    }
  }

  return Response.json({
    ok: true,
    dbConfigured: isDatabaseConfigured,
    smtpConfigured: isSmtpConfigured(),
    sent,
    deliveryMode,
    link,
  });
}
