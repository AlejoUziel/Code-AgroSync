import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
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
}

const cookieName = "agrosync_session";
const oneDay = 24 * 60 * 60 * 1000;

export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + oneDay);
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getSessionSecret());

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

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const session = payload as unknown as SessionPayload;
    if (!session.userId || !Number.isInteger(Number(session.sessionVersion))) return null;
    if (!isDatabaseConfigured) return session;

    const rows = await query<CurrentSessionUser[]>(
      `SELECT id, email, nombre, apellido, rol, departamento, empresa_id, estado, session_version
       FROM usuarios
       WHERE id = :id
       LIMIT 1`,
      { id: session.userId }
    );
    const user = rows[0];
    if (!user || user.estado !== "Activo" || Number(user.session_version) !== Number(session.sessionVersion)) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      nombre: `${user.nombre} ${user.apellido}`.trim(),
      rol: user.rol,
      departamento: normalizeDepartamento(user.departamento),
      empresaId: user.empresa_id,
      sessionVersion: Number(user.session_version),
    } satisfies SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export { cookieName };
