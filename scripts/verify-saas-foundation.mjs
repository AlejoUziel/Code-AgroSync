import { readFile } from "node:fs/promises";
import pg from "pg";

function parseEnv(text) {
  return Object.fromEntries(
    text.split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
    }),
  );
}

function hardenedUrl(value) {
  const url = new URL(value);
  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}

const env = parseEnv(await readFile(process.argv[2] ?? ".env.local", "utf8"));
const connectionString = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!connectionString?.startsWith("postgres")) throw new Error("DATABASE_URL PostgreSQL invalida.");

const client = new pg.Client({ connectionString: hardenedUrl(connectionString) });
await client.connect();
try {
  const objects = await client.query(`
    SELECT
      to_regclass('public.membresias') IS NOT NULL AS memberships,
      to_regclass('public.sesiones') IS NOT NULL AS sessions,
      to_regclass('public.eventos_seguridad') IS NOT NULL AS security_events,
      to_regclass('public.outbox_eventos') IS NOT NULL AS outbox,
      to_regclass('public.suscripciones') IS NOT NULL AS subscriptions
  `);
  if (Object.values(objects.rows[0]).some((value) => value !== true)) throw new Error("Faltan objetos SaaS.");

  const policies = await client.query(`
    SELECT COUNT(*)::int AS count
    FROM pg_policies
    WHERE policyname = 'agrosync_tenant_policy'
      AND tablename = ANY($1::text[])
  `, [["empleados", "parcelas", "cultivos", "cosechas", "inventario_items", "finanzas_transacciones", "alertas", "reportes", "comunicacion_envios", "auditoria_eventos"]]);
  if (policies.rows[0].count !== 10) throw new Error("RLS incompleto.");

  const quality = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM empresas WHERE codigo !~ '^EMP-[0-9]{3,}$') AS invalid_companies,
      (SELECT COUNT(*)::int FROM usuarios WHERE codigo !~ '^USR-[0-9]{3,}$') AS invalid_users,
      (SELECT COUNT(*)::int FROM usuarios u LEFT JOIN membresias m ON m.usuario_id = u.id AND m.empresa_id = u.empresa_id WHERE m.id IS NULL) AS missing_memberships,
      (SELECT COUNT(*)::int FROM (SELECT LOWER(BTRIM(email)) FROM usuarios GROUP BY LOWER(BTRIM(email)) HAVING COUNT(*) > 1) d) AS duplicate_emails
  `);
  if (Object.values(quality.rows[0]).some((value) => Number(value) !== 0)) throw new Error(`Calidad SaaS invalida: ${JSON.stringify(quality.rows[0])}`);

  const companies = await client.query("SELECT id FROM empresas ORDER BY id LIMIT 1");
  if (companies.rows[0]) {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_empresa_id', $1, true)", [companies.rows[0].id]);
    const tenantRows = await client.query("SELECT COUNT(DISTINCT empresa_id)::int AS tenants FROM parcelas");
    await client.query("ROLLBACK");
    if (tenantRows.rows[0].tenants > 1) throw new Error("RLS permitio datos de otra empresa.");
  }

  const summary = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM empresas) AS companies,
      (SELECT COUNT(*)::int FROM usuarios) AS users,
      (SELECT COUNT(*)::int FROM membresias WHERE estado = 'Activa') AS active_memberships,
      (SELECT COUNT(*)::int FROM schema_migrations) AS migrations,
      $1::int AS tenant_policies
  `, [policies.rows[0].count]);
  console.log(JSON.stringify({ ok: true, ...summary.rows[0] }, null, 2));
} finally {
  await client.end();
}
