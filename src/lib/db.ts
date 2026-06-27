import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

export const isDatabaseConfigured = Boolean(databaseUrl);

export const pool = databaseUrl
  ? mysql.createPool({
      uri: databaseUrl,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
      namedPlaceholders: true,
      timezone: "Z",
    })
  : null;

export async function query<T extends mysql.RowDataPacket[] | mysql.ResultSetHeader>(
  sql: string,
  values?: mysql.QueryOptions["values"]
) {
  if (!pool) {
    throw new Error("DATABASE_URL no esta configurada.");
  }

  const [rows] = await pool.query<T>({ sql, values, namedPlaceholders: true });
  return rows;
}
