import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^"|"$/g, "")];
      }),
  );
}

const envPath = process.argv[2] ?? ".env.local";
const env = parseEnv(await readFile(envPath, "utf8"));
if (!env.DATABASE_URL?.startsWith("mysql")) throw new Error("DATABASE_URL MySQL invalida.");

const connection = await mysql.createConnection(env.DATABASE_URL);

async function ensureColumn(table) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='codigo'",
    [table],
  );
  if (Number(rows[0].total) === 0) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN codigo VARCHAR(20) NULL`);
  }
}

async function backfill(table, prefix, orderBy) {
  const [rows] = await connection.query(`SELECT id, codigo FROM ${table} ORDER BY ${orderBy}, id`);
  const expression = new RegExp(`^${prefix}-(\\d{3,})$`);
  let last = rows.reduce((highest, row) => {
    const match = String(row.codigo ?? "").match(expression);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  for (const row of rows) {
    if (expression.test(String(row.codigo ?? ""))) continue;
    last += 1;
    await connection.query(`UPDATE ${table} SET codigo=? WHERE id=?`, [`${prefix}-${String(last).padStart(3, "0")}`, row.id]);
  }
  return last;
}

async function ensureUniqueIndex(table) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='codigo' AND NON_UNIQUE=0",
    [table],
  );
  if (Number(rows[0].total) === 0) {
    await connection.query(`ALTER TABLE ${table} ADD UNIQUE INDEX uq_${table}_codigo (codigo)`);
  }
  await connection.query(`ALTER TABLE ${table} MODIFY codigo VARCHAR(20) NOT NULL`);
}

async function installTrigger(table, prefix) {
  const trigger = `${table}_codigo_before_insert`;
  await connection.query(`DROP TRIGGER IF EXISTS ${trigger}`);
  await connection.query(`
    CREATE TRIGGER ${trigger}
    BEFORE INSERT ON ${table}
    FOR EACH ROW
    BEGIN
      IF NEW.codigo IS NULL OR NEW.codigo = '' OR NEW.codigo NOT REGEXP '^${prefix}-[0-9]{3,}$' THEN
        UPDATE business_code_counters
        SET last_value = LAST_INSERT_ID(last_value + 1)
        WHERE entity = '${table}';
        SET NEW.codigo = CONCAT('${prefix}-', LPAD(LAST_INSERT_ID(), 3, '0'));
      END IF;
    END
  `);
}

try {
  await ensureColumn("empresas");
  await ensureColumn("usuarios");
  const companyLast = await backfill("empresas", "EMP", "fecha_registro");
  const userLast = await backfill("usuarios", "USR", "fecha_creacion");
  await ensureUniqueIndex("empresas");
  await ensureUniqueIndex("usuarios");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS business_code_counters (
      entity VARCHAR(40) PRIMARY KEY,
      last_value BIGINT UNSIGNED NOT NULL
    ) ENGINE=InnoDB
  `);
  await connection.query(
    "INSERT INTO business_code_counters (entity, last_value) VALUES (?, ?), (?, ?) ON DUPLICATE KEY UPDATE last_value=GREATEST(last_value, VALUES(last_value))",
    ["empresas", companyLast, "usuarios", userLast],
  );
  await installTrigger("empresas", "EMP");
  await installTrigger("usuarios", "USR");
  console.log(`Empresas listas hasta EMP-${String(companyLast).padStart(3, "0")}.`);
  console.log(`Usuarios listos hasta USR-${String(userLast).padStart(3, "0")}.`);
} finally {
  await connection.end();
}
