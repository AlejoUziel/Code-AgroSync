import type { RowDataPacket } from "mysql2";
import { isDatabaseConfigured, query } from "@/lib/db";
import { readSession } from "@/lib/session";

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
  const session = await readSession();
  if (!session) {
    return Response.json({ items: [], unread: 0 }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return Response.json({
      items: [
        {
          id: "LOCAL-001",
          tipo: "Sistema",
          severidad: "Media",
          mensaje: "Notificaciones internas habilitadas. Configura MySQL para guardar alertas reales.",
          resuelta: false,
          creadaEn: new Date().toISOString(),
        },
      ],
      unread: 1,
    });
  }

  const rows = await query<NotificationRow[]>(
    `SELECT id, tipo, severidad, mensaje, resuelta, creada_en
     FROM alertas
     ORDER BY creada_en DESC
     LIMIT 8`,
    {}
  );

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
