import fs from "node:fs/promises";
import mysql from "mysql2/promise";
import pg from "pg";

const { Pool } = pg;

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

const envPath = process.argv[2] ?? ".env.neon.production.local";
const remoteEnv = parseEnv(await fs.readFile(envPath, "utf8"));
const postgresUrl = remoteEnv.DATABASE_URL_UNPOOLED ?? remoteEnv.DATABASE_URL;
if (!postgresUrl?.startsWith("postgres")) throw new Error("No se encontro una DATABASE_URL PostgreSQL valida.");

const source = await mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "agrosync_app",
  password: "Cambiar_Esta_Clave_2026!",
  database: "agrosync",
  timezone: "Z",
});
const target = new Pool({ connectionString: postgresUrl, max: 1 });

const schema = await fs.readFile(new URL("../db/postgres-schema.sql", import.meta.url), "utf8");
await target.query(schema);

const tableQueries = [
  ["empresas", "SELECT * FROM empresas"],
  ["usuarios", "SELECT * FROM usuarios"],
  ["empleados", "SELECT * FROM empleados"],
  ["parcelas", "SELECT id, empresa_id, nombre, zona, hectareas, estado, ST_Y(centro) AS lat, ST_X(centro) AS lng, ST_AsText(poligono) AS poligono_wkt FROM parcelas"],
  ["cultivos", "SELECT * FROM cultivos"],
  ["cosechas", "SELECT * FROM cosechas"],
  ["inventario_items", "SELECT * FROM inventario_items"],
  ["finanzas_transacciones", "SELECT * FROM finanzas_transacciones"],
  ["alertas", "SELECT * FROM alertas"],
  ["reportes", "SELECT * FROM reportes"],
  ["comunicacion_envios", "SELECT * FROM comunicacion_envios"],
];

for (const [table, selectSql] of tableQueries) {
  const [rows] = await source.query(selectSql);
  const targetColumnsResult = await target.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
    [table]
  );
  const targetColumns = new Set(targetColumnsResult.rows.map((column) => column.column_name));
  let migrated = 0;
  for (const originalRow of rows) {
    const row = { ...originalRow };
    let columns = Object.keys(row).filter((column) => targetColumns.has(column));
    let expressions = columns.map((_, index) => `$${index + 1}`);
    let values = columns.map((column) => row[column]);

    if (table === "parcelas") {
      const { lat, lng, poligono_wkt: polygonWkt, ...parcel } = row;
      const parcelColumns = Object.keys(parcel).filter((column) => targetColumns.has(column));
      columns = [...parcelColumns, "centro", "poligono"];
      values = [...parcelColumns.map((column) => parcel[column]), lng, lat, polygonWkt];
      expressions = [
        ...parcelColumns.map((_, index) => `$${index + 1}`),
        `ST_SetSRID(ST_MakePoint($${parcelColumns.length + 1}, $${parcelColumns.length + 2}), 4326)`,
        `ST_GeomFromText($${parcelColumns.length + 3}, 4326)`,
      ];
    }

    const updates = columns.filter((column) => column !== "id").map((column) => `${column}=EXCLUDED.${column}`);
    const insertSql = `INSERT INTO ${table} (${columns.join(",")}) VALUES (${expressions.join(",")}) ON CONFLICT (id) DO UPDATE SET ${updates.join(",")}`;
    await target.query(insertSql, values);
    migrated += 1;
  }
  console.log(`${table}: ${migrated}`);
}

await source.end();
await target.end();
