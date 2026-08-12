import { accessErrorResponse, canAccessResource, requireSession } from "@/lib/authorization";
import { query, type RowDataPacket } from "@/lib/db";
import type { ResourceKey } from "@/lib/resource-definitions";

interface ActivityRow extends RowDataPacket {
  id: number;
  empresa_id: string;
  recurso: ResourceKey;
  registro_id: string;
  accion: "CREATE" | "UPDATE" | "DELETE";
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  creado_en: Date | string;
  usuario_nombre: string | null;
}

const actionLabel = {
  CREATE: "creó",
  UPDATE: "actualizó",
  DELETE: "eliminó",
} as const;

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await query<ActivityRow[]>(
      `SELECT a.id, a.empresa_id, a.recurso, a.registro_id, a.accion,
              a.datos_anteriores, a.datos_nuevos, a.creado_en,
              NULLIF(TRIM(CONCAT(u.nombre, ' ', u.apellido)), '') AS usuario_nombre
       FROM auditoria_eventos a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.empresa_id = :empresaId
       ORDER BY a.creado_en DESC
       LIMIT 40`,
      { empresaId: session.empresaId }
    );

    const items = rows
      .filter((row) => canAccessResource(session, row.recurso))
      .slice(0, 8)
      .map((row) => {
        const snapshot = row.datos_nuevos ?? row.datos_anteriores ?? {};
        const target = String(snapshot.nombre ?? snapshot.titulo ?? snapshot.concepto ?? snapshot.cultivo ?? row.registro_id);
        return {
          id: row.id,
          user: row.usuario_nombre ?? "Sistema",
          action: actionLabel[row.accion],
          resource: row.recurso,
          target,
          recordId: row.registro_id,
          createdAt: new Date(row.creado_en).toISOString(),
        };
      });

    return Response.json({ items });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo cargar la actividad reciente.", 500);
  }
}
