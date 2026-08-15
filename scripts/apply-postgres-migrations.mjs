import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import pg from "pg";

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
      }),
  );
}

function hardenedPostgresUrl(value) {
  const url = new URL(value);
  const sslMode = url.searchParams.get("sslmode");
  if (!sslMode || ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

const envPath = process.argv[2] ?? ".env.local";
const env = parseEnv(await readFile(envPath, "utf8"));
const connectionString = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!connectionString?.startsWith("postgres")) {
  throw new Error("DATABASE_URL PostgreSQL inválida.");
}

const migrationFiles = [
  "db/postgres-hardening.sql",
  "db/postgres-realtime.sql",
  "db/05-public-business-codes.sql",
  "db/07-saas-foundation.sql",
];
const client = new pg.Client({ connectionString: hardenedPostgresUrl(connectionString) });

await client.connect();
try {
  await client.query("BEGIN");
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    nombre TEXT PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  for (const file of migrationFiles) {
    const sql = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const applied = await client.query("SELECT checksum FROM schema_migrations WHERE nombre = $1", [file]);
    if (applied.rows[0]) {
      if (applied.rows[0].checksum !== checksum) {
        throw new Error(`La migracion ${file} fue modificada despues de aplicarse.`);
      }
      console.log(`Omitida: ${file}`);
      continue;
    }
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (nombre, checksum) VALUES ($1, $2)", [file, checksum]);
    console.log(`Aplicada: ${file}`);
  }
  await client.query("COMMIT");
  console.log("Migraciones completadas en una transacción.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
