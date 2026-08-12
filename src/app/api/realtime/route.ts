import { readSession } from "@/lib/session";
import { subscribeToDatabaseChanges } from "@/lib/realtime-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const session = await readSession();
  if (!session) return Response.json({ message: "No autorizado." }, { status: 401 });

  if (!(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)?.startsWith("postgres")) {
    return Response.json({ message: "Base de datos no configurada." }, { status: 503 });
  }

  const encoder = new TextEncoder();
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
        unsubscribe = await subscribeToDatabaseChanges((payload) => {
          if (closed) return;
          try {
            const change = JSON.parse(payload) as { companyId?: string };
            if (change.companyId !== session.empresaId) return;
            controller.enqueue(encoder.encode(`event: change\ndata: ${payload}\n\n`));
          } catch {
            // Los eventos inválidos no deben cerrar el stream del usuario.
          }
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
