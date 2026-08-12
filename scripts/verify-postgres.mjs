import { readFile } from "node:fs/promises";
import { scryptSync, timingSafeEqual } from "node:crypto";
import pg from "pg";

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
      })
  );
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, hash] = String(storedHash ?? "").split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hardenedPostgresUrl(value) {
  const url = new URL(value);
  const sslMode = url.searchParams.get("sslmode");
  if (!sslMode || ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

const envPath = process.argv[2] ?? ".env.neon.production.local";
const env = parseEnv(await readFile(envPath, "utf8"));
const connectionString = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!connectionString?.startsWith("postgres")) throw new Error("DATABASE_URL PostgreSQL invalida.");

const pool = new pg.Pool({ connectionString: hardenedPostgresUrl(connectionString), max: 1 });
try {
  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM empresas) AS empresas,
      (SELECT COUNT(*)::int FROM usuarios) AS usuarios,
      (SELECT COUNT(*)::int FROM empleados) AS empleados,
      (SELECT COUNT(*)::int FROM parcelas) AS parcelas,
      (SELECT COUNT(*)::int FROM cultivos) AS cultivos,
      (SELECT COUNT(*)::int FROM inventario_items) AS inventario
  `);
  const spatial = await pool.query(
    "SELECT COUNT(*)::int AS geometry_columns FROM geometry_columns WHERE f_table_schema = 'public' AND f_table_name = 'parcelas'"
  );
  const demo = await pool.query(
    "SELECT password_hash FROM usuarios WHERE email = $1 LIMIT 1",
    ["demo.codex@agrosync.local"]
  );
  const persisted = await pool.query(
    "SELECT COUNT(*)::int AS records FROM inventario_items WHERE id = $1",
    ["INV-NEON-001"]
  );
  const hardening = await pool.query(`
    SELECT
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'session_version'
      ) AS revocable_sessions,
      EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'auditoria_eventos'
      ) AS audit_log,
      (SELECT COUNT(*)::int FROM pg_trigger WHERE tgname = 'agrosync_notify_change' AND NOT tgisinternal) AS realtime_triggers,
      (SELECT COUNT(*)::int FROM parcelas WHERE cultivo = 'Sin cultivo') AS parcelas_without_crop
  `);

  console.log(JSON.stringify({
    connected: true,
    counts: counts.rows[0],
    postgisGeometryColumns: spatial.rows[0].geometry_columns,
    demoLoginPasswordValid: verifyPassword("AgroSyncDemo2026!", demo.rows[0]?.password_hash),
    apiWritePersisted: persisted.rows[0].records === 1,
    hardening: hardening.rows[0],
  }, null, 2));
} finally {
  await pool.end();
}
