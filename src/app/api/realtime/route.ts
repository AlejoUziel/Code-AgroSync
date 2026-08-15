import { readSession } from "@/lib/session";
import { subscribeToDatabaseChanges } from "@/lib/realtime-hub";
import { query, type RowDataPacket } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type OutboxRow = RowDataPacket & { id: string; payload: Record<string, unknown> };

function sseChange(payload: string) {
  const parsed = JSON.parse(payload) as { eventId?: string };
  const eventId = parsed.eventId ? `id: ${parsed.eventId}\n` : "";
  return `${eventId}event: change\ndata: ${payload}\n\n`;
}

export async function GET(request: Request) {
  const session = await readSession();
  if (!session) return Response.json({ message: "No autorizado." }, { status: 401 });

  if (!(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)?.startsWith("postgres")) {
    return Response.json({ message: "Base de datos no configurada." }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const requestedLastEventId = request.headers.get("last-event-id")?.trim();
  const lastEventId = requestedLastEventId && /^[0-9a-f-]{36}$/i.test(requestedLastEventId) ? requestedLastEventId : null;
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    unsubscribe?.();
    unsubscribe = null;
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (lastEventId) {
          const missed = await query<OutboxRow[]>(
            `SELECT id, payload
             FROM outbox_eventos
             WHERE empresa_id = :empresaId
               AND creado_en > COALESCE(
                 (SELECT creado_en FROM outbox_eventos WHERE id = CAST(:lastEventId AS uuid) AND empresa_id = :empresaId),
                 CURRENT_TIMESTAMP - INTERVAL '10 minutes'
               )
             ORDER BY creado_en
             LIMIT 100`,
            { empresaId: session.empresaId, lastEventId },
          );
          for (const event of missed) {
            controller.enqueue(encoder.encode(sseChange(JSON.stringify({ ...event.payload, eventId: event.id }))));
          }
        }
        unsubscribe = await subscribeToDatabaseChanges((payload) => {
          if (closed) return;
          try {
            const change = JSON.parse(payload) as { companyId?: string };
            if (change.companyId !== session.empresaId) return;
            controller.enqueue(encoder.encode(sseChange(payload)));
          } catch {}
        });
        controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));
        heartbeat = setInterval(() => {
          if (!closed) controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }, 15000);
        request.signal.addEventListener("abort", () => void cleanup(), { once: true });
      } catch (error) {
        controller.error(error);
        await cleanup();
      }
    },
    cancel() {
      return cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
