import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { isDatabaseConfigured, withTransaction, type ResultSetHeader, type RowDataPacket } from "@/lib/db";
import { recordSecurityEvent } from "@/lib/security-events";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const destination = new URL("/login", request.url);
  if (!token || !isDatabaseConfigured) {
    destination.searchParams.set("verified", "invalid");
    return NextResponse.redirect(destination);
  }

  const result = await withTransaction(async (execute) => {
    const rows = await execute<(RowDataPacket & { id: string; usuario_id: string; empresa_id: string })[]>(
      `SELECT t.id, t.usuario_id, u.empresa_id
       FROM auth_tokens t JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.token_hash = :tokenHash AND t.tipo = 'email_verification'
         AND t.usado_en IS NULL AND t.expira_en > CURRENT_TIMESTAMP
       FOR UPDATE`,
      { tokenHash: createHash("sha256").update(token).digest("hex") }
    );
    const row = rows[0];
    if (!row) return null;
    await execute<ResultSetHeader>(
      "UPDATE usuarios SET email_verificado_en = CURRENT_TIMESTAMP WHERE id = :userId",
      { userId: row.usuario_id }
    );
    await execute<ResultSetHeader>("UPDATE auth_tokens SET usado_en = CURRENT_TIMESTAMP WHERE id = :id", { id: row.id });
    return row;
  });

  if (!result) {
    destination.searchParams.set("verified", "invalid");
    return NextResponse.redirect(destination);
  }

  await recordSecurityEvent({
    empresaId: result.empresa_id,
    actorUserId: result.usuario_id,
    action: "auth.email_verified",
    targetType: "usuario",
    targetId: result.usuario_id,
    result: "exito",
  });
  destination.searchParams.set("verified", "success");
  return NextResponse.redirect(destination);
}
