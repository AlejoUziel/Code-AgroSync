import { createHash, randomBytes } from "crypto";
import { accessErrorResponse, assertSameOrigin, requireOrganizationAdmin } from "@/lib/authorization";
import { isDatabaseConfigured, withTenantTransaction, type ResultSetHeader, type RowDataPacket } from "@/lib/db";
import { isSmtpConfigured, sendEmail } from "@/lib/email";
import { recordSecurityEvent } from "@/lib/security-events";

const allowedRoles = new Set(["Administrador", "Gerente de Campo", "Supervisor", "Operador", "Analista", "Jornalero"]);
const allowedDepartments = new Set(["Administrativo", "Operativo", "Tecnologico"]);

function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function GET() {
  try {
    const session = await requireOrganizationAdmin();
    const items = await withTenantTransaction(session.empresaId, (execute) => execute<(RowDataPacket & {
      id: string; email_destino: string; rol: string; departamento: string; expira_en: Date | string;
      aceptada_en: Date | string | null; revocada_en: Date | string | null; creada_en: Date | string;
    })[]>(
      `SELECT id, email_destino, rol, departamento, expira_en, aceptada_en, revocada_en, creada_en
       FROM invitaciones WHERE empresa_id = :empresaId ORDER BY creada_en DESC LIMIT 100`,
      { empresaId: session.empresaId },
    ));
    return Response.json({ items });
  } catch (error) {
    return accessErrorResponse(error, "No se pudieron consultar las invitaciones.", 500);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!isDatabaseConfigured) return Response.json({ message: "PostgreSQL no esta configurado." }, { status: 503 });
    if (!isSmtpConfigured()) return Response.json({ message: "Configura SMTP antes de enviar invitaciones." }, { status: 503 });
    const session = await requireOrganizationAdmin();
    const body = (await request.json()) as { email?: string; rol?: string; departamento?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    const rol = String(body.rol ?? "");
    const departamento = String(body.departamento ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ message: "Correo invalido." }, { status: 400 });
    if (!allowedRoles.has(rol)) return Response.json({ message: "Rol no permitido." }, { status: 400 });
    if (!allowedDepartments.has(departamento)) return Response.json({ message: "Departamento no permitido." }, { status: 400 });

    const rawToken = `${session.empresaId}.${randomBytes(32).toString("base64url")}`;
    const invitation = await withTenantTransaction(session.empresaId, async (execute) => {
      await execute<ResultSetHeader>(
        `UPDATE invitaciones SET revocada_en = CURRENT_TIMESTAMP
         WHERE empresa_id = :empresaId AND email_hash = :emailHash
           AND aceptada_en IS NULL AND revocada_en IS NULL`,
        { empresaId: session.empresaId, emailHash: sha256(email) },
      );
      const rows = await execute<(RowDataPacket & { id: string })[]>(
        `INSERT INTO invitaciones (
           empresa_id, email_destino, email_hash, token_hash, rol, departamento,
           invitado_por, expira_en
         ) VALUES (
           :empresaId, :email, :emailHash, :tokenHash, :rol, :departamento,
           :invitedBy, CURRENT_TIMESTAMP + INTERVAL '72 hours'
         ) RETURNING id`,
        {
          empresaId: session.empresaId,
          email,
          emailHash: sha256(email),
          tokenHash: sha256(rawToken),
          rol,
          departamento,
          invitedBy: session.userId,
        },
      );
      return rows[0];
    });

    try {
      const url = `${appUrl()}/aceptar-invitacion?token=${encodeURIComponent(rawToken)}`;
      await sendEmail({
        to: email,
        subject: "Te invitaron a AgroSync",
        text: `Acepta la invitacion desde ${url}. El enlace vence en 72 horas.`,
        html: `<p>Te invitaron a colaborar en AgroSync.</p><p><a href="${url}">Aceptar invitación</a></p><p>El enlace vence en 72 horas.</p>`,
        empresaId: session.empresaId,
        type: "invitation",
      });
    } catch (error) {
      await withTenantTransaction(session.empresaId, (execute) => execute<ResultSetHeader>(
        "UPDATE invitaciones SET revocada_en = CURRENT_TIMESTAMP WHERE id = :id AND empresa_id = :empresaId",
        { id: invitation.id, empresaId: session.empresaId },
      ));
      throw error;
    }

    await recordSecurityEvent({
      empresaId: session.empresaId,
      actorUserId: session.userId,
      action: "organization.invitation.created",
      targetType: "invitacion",
      targetId: invitation.id,
      result: "exito",
    });
    return Response.json({ ok: true, id: invitation.id }, { status: 201 });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo enviar la invitacion.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireOrganizationAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ message: "ID requerido." }, { status: 400 });
    const result = await withTenantTransaction(session.empresaId, (execute) => execute<ResultSetHeader>(
      `UPDATE invitaciones SET revocada_en = CURRENT_TIMESTAMP
       WHERE id = :id AND empresa_id = :empresaId AND aceptada_en IS NULL AND revocada_en IS NULL`,
      { id, empresaId: session.empresaId },
    ));
    if (!result.affectedRows) return Response.json({ message: "Invitacion no encontrada o cerrada." }, { status: 404 });
    await recordSecurityEvent({
      empresaId: session.empresaId,
      actorUserId: session.userId,
      action: "organization.invitation.revoked",
      targetType: "invitacion",
      targetId: id,
      result: "exito",
    });
    return Response.json({ ok: true });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo revocar la invitacion.", 500);
  }
}

