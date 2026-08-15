import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
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
  return url;
}

const sourcePath = process.argv[2] ?? ".env.local";
const outputPath = process.argv[3];
if (!outputPath) throw new Error("Indica el archivo temporal de salida.");
const env = parseEnv(await readFile(sourcePath, "utf8"));
const adminValue = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
const pooledValue = env.DATABASE_URL;
if (!adminValue?.startsWith("postgres") || !pooledValue?.startsWith("postgres")) throw new Error("Faltan URLs PostgreSQL.");

const adminUrl = hardenedUrl(adminValue);
const password = randomBytes(30).toString("base64url");
const role = "agrosync_app";
const client = new pg.Client({ connectionString: adminUrl.toString() });
await client.connect();
try {
  await client.query("BEGIN");
  const exists = await client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [role]);
  if (exists.rows[0]) {
    await client.query(`ALTER ROLE ${role} WITH LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  } else {
    await client.query(`CREATE ROLE ${role} WITH LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  }
  await client.query(`GRANT CONNECT ON DATABASE ${client.escapeIdentifier(adminUrl.pathname.slice(1))} TO ${role}`);
  await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
  await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role}`);
  await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${role}`);
  await client.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${role}`);
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${role}`);
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${role}`);
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${role}`);
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

const appUrl = hardenedUrl(pooledValue);
appUrl.username = role;
appUrl.password = password;
await writeFile(outputPath, `DATABASE_URL=${appUrl.toString()}\n`, { encoding: "utf8", mode: 0o600 });
console.log(`Rol ${role} creado y URL temporal protegida preparada.`);
