import { isDatabaseConfigured, query, type RowDataPacket } from "@/lib/db";
import { isSmtpConfigured } from "@/lib/email";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  if (isDatabaseConfigured) {
    database = Boolean((await query<(RowDataPacket & { ok: number })[]>("SELECT 1 AS ok"))[0]?.ok);
  }
  const dependencies = {
    database,
    smtp: isSmtpConfigured(),
    stripe: isStripeConfigured(),
    sentry: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  };
  const coreReady = dependencies.database;
  return Response.json({ status: coreReady ? "ok" : "degraded", version: process.env.npm_package_version ?? "1.0.0", dependencies }, { status: coreReady ? 200 : 503 });
}

