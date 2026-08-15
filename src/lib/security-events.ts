import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { isDatabaseConfigured, query, type ResultSetHeader } from "@/lib/db";

type SecurityEventInput = {
  empresaId?: string | null;
  actorUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  result: "exito" | "rechazado" | "error";
  metadata?: Record<string, unknown> | null;
};

export function privacyHash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function recordSecurityEvent(input: SecurityEventInput) {
  const traceId = randomUUID();
  if (!isDatabaseConfigured) return traceId;
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
    await query<ResultSetHeader>(
      `INSERT INTO eventos_seguridad (
         empresa_id, actor_usuario_id, accion, objetivo_tipo, objetivo_id,
         resultado, trace_id, ip_hash, metadata
       ) VALUES (
         :empresaId, :actorUserId, :action, :targetType, :targetId,
         :result, CAST(:traceId AS uuid), :ipHash, CAST(:metadata AS jsonb)
       )`,
      {
        empresaId: input.empresaId ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        result: input.result,
        traceId,
        ipHash: privacyHash(ip),
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    );
  } catch (error) {
    console.error(`[AgroSync:security-event:${traceId}]`, error);
  }
  return traceId;
}
