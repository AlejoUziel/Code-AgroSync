import * as Sentry from "@sentry/nextjs";
import { randomUUID } from "crypto";

type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.info(serialized);
}

export function captureOperationalError(error: unknown, event: string, context: Record<string, unknown> = {}) {
  const traceId = randomUUID();
  logEvent("error", event, {
    traceId,
    ...context,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : "Error no serializable",
  });
  Sentry.captureException(error, { tags: { event, traceId }, extra: context });
  return traceId;
}

