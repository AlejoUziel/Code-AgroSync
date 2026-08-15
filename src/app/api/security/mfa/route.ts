import QRCode from "qrcode";
import { isDatabaseConfigured, query, type ResultSetHeader, type RowDataPacket } from "@/lib/db";
import { accessErrorResponse, assertSameOrigin, requireSession } from "@/lib/authorization";
import { createSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import {
  createMfaEnrollment,
  createRecoveryCodes,
  decryptMfaSecret,
  encryptMfaSecret,
  hashRecoveryCode,
  validateTotp,
} from "@/lib/mfa";
import { recordSecurityEvent } from "@/lib/security-events";

interface MfaRow extends RowDataPacket {
  email: string;
  password_hash: string;
  mfa_habilitado: boolean;
  mfa_secret_encrypted: string | null;
  mfa_pending_secret_encrypted: string | null;
  mfa_confirmado_en: Date | string | null;
}

async function getMfaUser(userId: string) {
  const rows = await query<MfaRow[]>(
    `SELECT email, password_hash, mfa_habilitado, mfa_secret_encrypted,
            mfa_pending_secret_encrypted, mfa_confirmado_en
     FROM usuarios WHERE id = :userId LIMIT 1`,
    { userId },
  );
  return rows[0] ?? null;
}

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getMfaUser(session.userId);
    return Response.json({
      configured: isDatabaseConfigured,
      enabled: Boolean(user?.mfa_habilitado),
      confirmedAt: user?.mfa_confirmado_en ?? null,
      required: session.platformRole === "platform_admin",
    });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo consultar MFA.", 500);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!isDatabaseConfigured) return Response.json({ message: "PostgreSQL es requerido para MFA." }, { status: 503 });
    const session = await requireSession();
    const user = await getMfaUser(session.userId);
    if (!user) return Response.json({ message: "Usuario no encontrado." }, { status: 404 });
    if (user.mfa_habilitado) return Response.json({ message: "MFA ya esta habilitado." }, { status: 409 });

    const enrollment = createMfaEnrollment(user.email);
    await query<ResultSetHeader>(
      "UPDATE usuarios SET mfa_pending_secret_encrypted = :secret WHERE id = :userId",
      { userId: session.userId, secret: encryptMfaSecret(enrollment.secret) },
    );
    const qrDataUrl = await QRCode.toDataURL(enrollment.uri, { errorCorrectionLevel: "M", margin: 1, width: 280 });
    await recordSecurityEvent({
      empresaId: session.empresaId,
      actorUserId: session.userId,
      action: "auth.mfa.enrollment_started",
      targetType: "usuario",
      targetId: session.userId,
      result: "exito",
    });
    return Response.json({ qrDataUrl, manualKey: enrollment.secret });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo iniciar la configuracion MFA.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const body = (await request.json()) as { code?: string };
    const user = await getMfaUser(session.userId);
    if (!user?.mfa_pending_secret_encrypted) {
      return Response.json({ message: "Primero genera un codigo QR de configuracion." }, { status: 400 });
    }
    const secret = decryptMfaSecret(user.mfa_pending_secret_encrypted);
    const step = validateTotp(secret, String(body.code ?? "").trim());
    if (step === null) return Response.json({ message: "Codigo TOTP invalido." }, { status: 400 });

    const recoveryCodes = createRecoveryCodes();
    await query<ResultSetHeader>(
      `UPDATE usuarios SET
         mfa_habilitado = TRUE,
         mfa_secret_encrypted = mfa_pending_secret_encrypted,
         mfa_pending_secret_encrypted = NULL,
         mfa_recovery_codes_hashes = CAST(:recoveryHashes AS jsonb),
         mfa_confirmado_en = CURRENT_TIMESTAMP,
         mfa_last_used_step = :step,
         session_version = session_version + 1
       WHERE id = :userId`,
      {
        userId: session.userId,
        recoveryHashes: JSON.stringify(recoveryCodes.map((code) => hashRecoveryCode(session.userId, code))),
        step,
      },
    );
    await createSession({
      ...session,
      sessionVersion: Number(session.sessionVersion) + 1,
      mfaVerified: true,
      mfaEnrollmentRequired: false,
    });
    await recordSecurityEvent({
      empresaId: session.empresaId,
      actorUserId: session.userId,
      action: "auth.mfa.enabled",
      targetType: "usuario",
      targetId: session.userId,
      result: "exito",
    });
    return Response.json({ ok: true, recoveryCodes });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo confirmar MFA.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    if (session.platformRole === "platform_admin") {
      return Response.json({ message: "MFA es obligatorio para administradores de plataforma." }, { status: 403 });
    }
    const body = (await request.json()) as { password?: string; code?: string };
    const user = await getMfaUser(session.userId);
    if (!user?.mfa_habilitado || !user.mfa_secret_encrypted) {
      return Response.json({ message: "MFA no esta habilitado." }, { status: 409 });
    }
    if (!verifyPassword(String(body.password ?? ""), user.password_hash)) {
      return Response.json({ message: "Contrasena invalida." }, { status: 400 });
    }
    const valid = validateTotp(decryptMfaSecret(user.mfa_secret_encrypted), String(body.code ?? "").trim());
    if (valid === null) return Response.json({ message: "Codigo TOTP invalido." }, { status: 400 });
    await query<ResultSetHeader>(
      `UPDATE usuarios SET mfa_habilitado = FALSE, mfa_secret_encrypted = NULL,
       mfa_pending_secret_encrypted = NULL, mfa_recovery_codes_hashes = '[]'::jsonb,
       mfa_confirmado_en = NULL, mfa_last_used_step = NULL, session_version = session_version + 1
       WHERE id = :userId`,
      { userId: session.userId },
    );
    await createSession({ ...session, sessionVersion: Number(session.sessionVersion) + 1, mfaVerified: false });
    await recordSecurityEvent({
      empresaId: session.empresaId,
      actorUserId: session.userId,
      action: "auth.mfa.disabled",
      targetType: "usuario",
      targetId: session.userId,
      result: "exito",
    });
    return Response.json({ ok: true });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo deshabilitar MFA.", 500);
  }
}

