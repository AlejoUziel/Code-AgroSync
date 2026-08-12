import { isDatabaseConfigured, query, type RowDataPacket } from "@/lib/db";
import { accessErrorResponse, requireResourceAccess } from "@/lib/authorization";

type NotificationRow = RowDataPacket & {
  id: string;
  tipo: string;
  severidad: string;
  mensaje: string;
  resuelta: number | boolean;
  creada_en: Date | string;
};

function formatDate(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function GET() {
  let session;
  try {
    session = await requireResourceAccess("alertas");
  } catch (error) {
    return accessErrorResponse(error, "No autorizado.", 401);
  }

  if (!isDatabaseConfigured) {
    return Response.json({ message: "PostgreSQL no esta configurado.", items: [], unread: 0 }, { status: 503 });
  }

  let rows: NotificationRow[];
  try {
    rows = await query<NotificationRow[]>(
      `SELECT id, tipo, severidad, mensaje, resuelta, creada_en
       FROM alertas
       WHERE deleted_at IS NULL AND empresa_id = :empresaId
       ORDER BY creada_en DESC
       LIMIT 8`,
      { empresaId: session.empresaId },
    );
  } catch (error) {
    return accessErrorResponse(error, "No se pudieron cargar las notificaciones.", 500);
  }

  const items = rows.map((row) => ({
    id: row.id,
    tipo: row.tipo,
    severidad: row.severidad,
    mensaje: row.mensaje,
    resuelta: Boolean(row.resuelta),
    creadaEn: formatDate(row.creada_en),
  }));

  return Response.json({
    items,
    unread: items.filter((item) => !item.resuelta).length,
  });
}
