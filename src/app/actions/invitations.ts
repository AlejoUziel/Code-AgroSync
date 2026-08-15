"use server";

import { createHash, randomUUID } from "crypto";
import { hashPassword } from "@/lib/password";
import { isDatabaseConfigured, withTenantTransaction, type ResultSetHeader, type RowDataPacket } from "@/lib/db";
import { recordSecurityEvent } from "@/lib/security-events";

export type InvitationAcceptState = { ok?: boolean; message?: string };

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function acceptInvitation(_state: InvitationAcceptState, formData: FormData): Promise<InvitationAcceptState> {
  const token = String(formData.get("token") ?? "");
  const [empresaId] = token.split(".");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (!isDatabaseConfigured || !/^[0-9a-f-]{36}$/i.test(empresaId ?? "")) return { message: "Invitacion invalida." };
  if (!nombre || !apellido || !telefono) return { message: "Completa tus datos personales." };
  if (password.length < 8) return { message: "La contrasena debe tener al menos 8 caracteres." };
  if (password !== confirmation) return { message: "Las contrasenas no coinciden." };

  const accepted = await withTenantTransaction(empresaId, async (execute) => {
    const rows = await execute<(RowDataPacket & {
      id: string; empresa_id: string; email_destino: string; rol: string; departamento: string;
    })[]>(
      `SELECT id, empresa_id, email_destino, rol, departamento
       FROM invitaciones
       WHERE empresa_id = :empresaId AND token_hash = :tokenHash
         AND aceptada_en IS NULL AND revocada_en IS NULL AND expira_en > CURRENT_TIMESTAMP
       FOR UPDATE`,
      { empresaId, tokenHash: sha256(token) },
    );
    const invitation = rows[0];
    if (!invitation) return null;
    const existing = await execute<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM usuarios WHERE email = :email LIMIT 1",
      { email: invitation.email_destino },
    );
    const userId = existing[0]?.id ?? randomUUID();
    if (!existing[0]) {
      await execute<ResultSetHeader>(
        `INSERT INTO usuarios (
           id, empresa_id, nombre, apellido, email, telefono, rol, departamento,
           estado, password_hash, email_verificado_en, notas
         ) VALUES (
           :id, :empresaId, :nombre, :apellido, :email, :telefono, :rol, :departamento,
           'Activo', :passwordHash, CURRENT_TIMESTAMP, 'Alta mediante invitacion verificada.'
         )`,
        {
          id: userId,
          empresaId,
          nombre,
          apellido,
          email: invitation.email_destino,
          telefono,
          rol: invitation.rol,
          departamento: invitation.departamento,
          passwordHash: hashPassword(password),
        },
      );
    }
    await execute<ResultSetHeader>(
      `INSERT INTO membresias (usuario_id, empresa_id, rol, estado, invitado_por)
       SELECT :userId, empresa_id, CASE WHEN rol = 'Administrador' THEN 'admin' ELSE 'member' END,
              'Activa', invitado_por
       FROM invitaciones WHERE id = :invitationId
       ON CONFLICT (usuario_id, empresa_id) DO UPDATE SET estado = 'Activa', rol = EXCLUDED.rol`,
      { userId, invitationId: invitation.id },
    );
    await execute<ResultSetHeader>(
      "UPDATE invitaciones SET aceptada_en = CURRENT_TIMESTAMP WHERE id = :invitationId",
      { invitationId: invitation.id },
    );
    return { userId, invitationId: invitation.id };
  });
  if (!accepted) return { message: "La invitacion no existe, vencio o ya fue utilizada." };
  await recordSecurityEvent({
    empresaId,
    actorUserId: accepted.userId,
    action: "organization.invitation.accepted",
    targetType: "invitacion",
    targetId: accepted.invitationId,
    result: "exito",
  });
  return { ok: true, message: "Invitacion aceptada. Ya puedes iniciar sesion." };
}

