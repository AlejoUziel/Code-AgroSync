import { accessErrorResponse, assertSameOrigin, requireSession } from "@/lib/authorization";
import { query, type RowDataPacket } from "@/lib/db";
import { createSession } from "@/lib/session";
import { recordSecurityEvent } from "@/lib/security-events";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await query<(RowDataPacket & { id: string; codigo: string; nombre: string; slug: string; rol: string })[]>(
      `SELECT e.id, e.codigo, e.nombre, e.slug, m.rol
       FROM membresias m JOIN empresas e ON e.id = m.empresa_id
       WHERE m.usuario_id = :userId AND m.estado = 'Activa' AND e.estado = 'Activa'
       ORDER BY e.nombre`,
      { userId: session.userId },
    );
    return Response.json({ currentEmpresaId: session.empresaId, items });
  } catch (error) {
    return accessErrorResponse(error, "No se pudieron consultar las organizaciones.", 500);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const body = (await request.json()) as { empresaId?: string };
    const rows = await query<(RowDataPacket & { empresa_id: string })[]>(
      `SELECT empresa_id FROM membresias
       WHERE usuario_id = :userId AND empresa_id = :empresaId AND estado = 'Activa' LIMIT 1`,
      { userId: session.userId, empresaId: body.empresaId },
    );
    if (!rows[0]) return Response.json({ message: "No perteneces a esa organizacion." }, { status: 403 });
    await createSession({ ...session, empresaId: rows[0].empresa_id });
    await recordSecurityEvent({
      empresaId: rows[0].empresa_id,
      actorUserId: session.userId,
      action: "organization.switched",
      targetType: "empresa",
      targetId: rows[0].empresa_id,
      result: "exito",
    });
    return Response.json({ ok: true });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo cambiar de organizacion.", 500);
  }
}

