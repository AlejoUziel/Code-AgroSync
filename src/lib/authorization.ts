import { readSession, type SessionPayload } from "@/lib/session";
import type { ResourceKey } from "@/lib/resource-definitions";
import { captureOperationalError } from "@/lib/observability";

export class AccessError extends Error {
  constructor(message: string, public readonly status = 403) {
    super(message);
    this.name = "AccessError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "ValidationError";
  }
}

const resourceDepartments: Record<ResourceKey, string[]> = {
  parcelas: ["Operativo"],
  cultivos: ["Operativo"],
  inventario: ["Operativo"],
  cosechas: ["Operativo"],
  empleados: ["Administrativo"],
  finanzas: ["Administrativo"],
  alertas: ["Tecnologico"],
  reportes: ["Tecnologico"],
};

export function canAccessResource(session: SessionPayload, resource: ResourceKey) {
  return session.platformRole === "platform_admin" || session.rol === "Administrador" || resourceDepartments[resource].includes(session.departamento);
}

export async function requireSession() {
  const session = await readSession();
  if (!session) throw new AccessError("No autorizado.", 401);
  return session;
}

export async function requireResourceAccess(resource: ResourceKey) {
  const session = await requireSession();
  if (!canAccessResource(session, resource)) {
    throw new AccessError("No tienes permisos para este modulo.");
  }
  return session;
}

export async function requireAdministratorIT() {
  const session = await requireSession();
  if (session.platformRole !== "platform_admin") {
    throw new AccessError("Se requiere acceso de administrador de plataforma.");
  }
  return session;
}

export async function requireOrganizationAdmin() {
  const session = await requireSession();
  if (session.platformRole !== "platform_admin" && session.rol !== "Administrador") {
    throw new AccessError("Se requiere acceso de administrador de la organizacion.");
  }
  return session;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(request.url).origin;
  if (origin !== expected) throw new AccessError("Origen de solicitud no permitido.", 403);
}

export function accessErrorResponse(error: unknown, fallback: string, fallbackStatus = 400) {
  if (error instanceof AccessError || error instanceof ValidationError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  const traceId = captureOperationalError(error, "api.request.failed", { fallback, fallbackStatus });
  return Response.json({ message: fallback, traceId }, { status: fallbackStatus });
}
