import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { createHash, randomUUID } from "crypto";
import { getSessionSecret } from "@/lib/session-secret";
import { isDatabaseConfigured, query, type RowDataPacket } from "@/lib/db";
import { normalizeDepartamento } from "@/lib/departments";

export interface SessionPayload {
  userId: string;
  email: string;
  nombre: string;
  rol: string;
  departamento: string;
  empresaId: string;
  sessionVersion: number;
  sessionId?: string;
  platformRole?: "none" | "platform_support" | "platform_admin";
  mfaVerified?: boolean;
  mfaEnrollmentRequired?: boolean;
}

interface CurrentSessionUser extends RowDataPacket {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  departamento: string;
  empresa_id: string;
  estado: string;
  session_version: number;
  platform_role: "none" | "platform_support" | "platform_admin";
  mfa_habilitado: boolean;
}

const cookieName = "agrosync_session";
const oneDay = 24 * 60 * 60 * 1000;

export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + oneDay);
  const sessionId = randomUUID();
  const token = await new SignJWT({ ...payload, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getSessionSecret());

  if (isDatabaseConfigured) {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
    const userAgent = requestHeaders.get("user-agent") || "unknown";
    if (payload.sessionId) {
      await query(
        "UPDATE sesiones SET revocada_en = COALESCE(revocada_en, CURRENT_TIMESTAMP) WHERE id_hash = :idHash AND usuario_id = :userId",
        { idHash: createHash("sha256").update(payload.sessionId).digest("hex"), userId: payload.userId },
      );
    }
    await query(
      `INSERT INTO sesiones (
         id_hash, usuario_id, empresa_id, user_agent_hash, ip_hash, dispositivo, expira_en
       ) VALUES (
         :idHash, :userId, :empresaId, :userAgentHash, :ipHash, :dispositivo, :expiresAt
       )`,
      {
        idHash: createHash("sha256").update(sessionId).digest("hex"),
        userId: payload.userId,
        empresaId: payload.empresaId,
        userAgentHash: createHash("sha256").update(userAgent).digest("hex"),
        ipHash: createHash("sha256").update(`${payload.userId}:${ip}`).digest("hex"),
        dispositivo: userAgent.slice(0, 120),
        expiresAt,
      },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function readSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;

  let session: SessionPayload;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    session = payload as unknown as SessionPayload;
    if (!session.userId || !Number.isInteger(Number(session.sessionVersion))) return null;
  } catch {
    return null;
  }

  if (!isDatabaseConfigured) return session;

  // La consulta queda fuera del catch del JWT: una interrupcion temporal de la
  // base debe propagarse como error 5xx, no invalidar ni borrar la sesion.
  const rows = await query<CurrentSessionUser[]>(
    `SELECT u.id, u.email, u.nombre, u.apellido,
            CASE WHEN m.rol IN ('owner','admin') THEN 'Administrador' ELSE u.rol END AS rol,
            u.departamento, m.empresa_id, u.estado, u.session_version, u.platform_role, u.mfa_habilitado
     FROM usuarios u
     JOIN membresias m ON m.usuario_id = u.id AND m.empresa_id = :empresaId AND m.estado = 'Activa'
     LEFT JOIN sesiones s ON s.usuario_id = u.id AND s.id_hash = :sessionHash
     WHERE u.id = :id
       AND (:legacySession = TRUE OR (s.revocada_en IS NULL AND s.expira_en > CURRENT_TIMESTAMP))
     LIMIT 1`,
    {
      id: session.userId,
      empresaId: session.empresaId,
      sessionHash: session.sessionId ? createHash("sha256").update(session.sessionId).digest("hex") : "legacy",
      legacySession: !session.sessionId,
    }
  );
  const user = rows[0];
  if (!user || user.estado !== "Activo" || Number(user.session_version) !== Number(session.sessionVersion)) {
    return null;
  }

  const enrollmentRequired = user.platform_role === "platform_admin" && !user.mfa_habilitado;
  if (user.mfa_habilitado && !session.mfaVerified) return null;

  return {
    userId: user.id,
    email: user.email,
    nombre: `${user.nombre} ${user.apellido}`.trim(),
    rol: user.rol,
    departamento: normalizeDepartamento(user.departamento),
    empresaId: user.empresa_id,
    sessionVersion: Number(user.session_version),
    sessionId: session.sessionId,
    platformRole: user.platform_role,
    mfaVerified: Boolean(session.mfaVerified),
    mfaEnrollmentRequired: enrollmentRequired,
  } satisfies SessionPayload;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (token && isDatabaseConfigured) {
    try {
      const { payload } = await jwtVerify(token, getSessionSecret());
      const session = payload as unknown as SessionPayload;
      if (session.sessionId && session.userId) {
        await query(
          "UPDATE sesiones SET revocada_en = COALESCE(revocada_en, CURRENT_TIMESTAMP) WHERE id_hash = :idHash AND usuario_id = :userId",
          { idHash: createHash("sha256").update(session.sessionId).digest("hex"), userId: session.userId },
        );
      }
    } catch {}
  }
  cookieStore.delete(cookieName);
}

export { cookieName };
