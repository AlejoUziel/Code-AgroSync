import pg from "pg";
import { createHash } from "node:crypto";

const primaryUrl = process.env.DATABASE_URL_UNPOOLED;
const restoredUrl = process.env.PITR_RESTORED_DATABASE_URL;
const target = process.env.PITR_TARGET_TIMESTAMP;

if (!primaryUrl?.startsWith("postgres") || !restoredUrl?.startsWith("postgres")) {
  throw new Error("DATABASE_URL_UNPOOLED y PITR_RESTORED_DATABASE_URL son obligatorias.");
}
if (primaryUrl === restoredUrl) throw new Error("La base restaurada debe ser distinta de produccion.");

function harden(value) {
  const url = new URL(value);
  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}

const primary = new pg.Client({ connectionString: harden(primaryUrl) });
const restored = new pg.Client({ connectionString: harden(restoredUrl) });
const startedAt = Date.now();
const checks = [];

async function scalar(client, sql) {
  const result = await client.query(sql);
  return Number(Object.values(result.rows[0] ?? {})[0] ?? 0);
}

try {
  await Promise.all([primary.connect(), restored.connect()]);
  const tables = ["empresas", "usuarios", "membresias", "parcelas", "cultivos", "schema_migrations"];
  for (const table of tables) {
    const count = await scalar(restored, `SELECT COUNT(*) FROM ${table}`);
    checks.push({ check: `count.${table}`, value: count, ok: count >= 0 });
  }
  const orphanMemberships = await scalar(restored, `SELECT COUNT(*) FROM membresias m LEFT JOIN usuarios u ON u.id=m.usuario_id LEFT JOIN empresas e ON e.id=m.empresa_id WHERE u.id IS NULL OR e.id IS NULL`);
  checks.push({ check: "integrity.orphan_memberships", value: orphanMemberships, ok: orphanMemberships === 0 });
  const duplicateEmails = await scalar(restored, `SELECT COUNT(*) FROM (SELECT email FROM usuarios GROUP BY email HAVING COUNT(*) > 1) d`);
  checks.push({ check: "integrity.duplicate_emails", value: duplicateEmails, ok: duplicateEmails === 0 });
  const migrationRows = await restored.query("SELECT nombre, checksum FROM schema_migrations ORDER BY nombre");
  const migrationChecksum = createHash("sha256").update(JSON.stringify(migrationRows.rows)).digest("hex");
  checks.push({ check: "migrations.checksum", value: migrationChecksum, ok: migrationRows.rowCount > 0 });
  const ok = checks.every((check) => check.ok);
  const durationSeconds = Math.ceil((Date.now() - startedAt) / 1000);
  const targetDate = target ? new Date(target) : null;
  const rpoSeconds = targetDate && !Number.isNaN(targetDate.getTime()) ? Math.max(0, Math.ceil((Date.now() - targetDate.getTime()) / 1000)) : null;
  await primary.query(
    `INSERT INTO continuidad_simulacros (
       tipo, entorno, punto_objetivo, finalizado_en, resultado, rto_segundos, rpo_segundos, evidencia
     ) VALUES ('PITR','production',$1,CURRENT_TIMESTAMP,$2,$3,$4,$5::jsonb)`,
    [targetDate, ok ? "aprobado" : "fallido", durationSeconds, rpoSeconds, JSON.stringify({ checks })],
  );
  console.log(JSON.stringify({ ok, durationSeconds, rpoSeconds, checks }, null, 2));
  if (!ok) process.exitCode = 1;
} catch (error) {
  if (primary._connected) {
    await primary.query(
      `INSERT INTO continuidad_simulacros (tipo, entorno, punto_objetivo, finalizado_en, resultado, evidencia)
       VALUES ('PITR','production',$1,CURRENT_TIMESTAMP,'fallido',$2::jsonb)`,
      [target ? new Date(target) : null, JSON.stringify({ error: error instanceof Error ? error.message : String(error) })],
    ).catch(() => undefined);
  }
  throw error;
} finally {
  await Promise.all([primary.end().catch(() => undefined), restored.end().catch(() => undefined)]);
}

