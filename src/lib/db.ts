import { Pool, type PoolClient, type QueryResult } from "pg";
import { compileNamedQuery, hardenedPostgresUrl, type NamedValues } from "@/lib/db-utils";

export { compileNamedQuery, hardenedPostgresUrl } from "@/lib/db-utils";

export interface RowDataPacket {
  [column: string]: unknown;
}

export interface ResultSetHeader {
  affectedRows: number;
}

export type QueryExecutor = <T>(sql: string, values?: NamedValues) => Promise<T>;

const databaseUrl = process.env.DATABASE_URL;

export const isDatabaseConfigured = Boolean(databaseUrl?.startsWith("postgres"));

export const pool = isDatabaseConfigured
  ? new Pool({
      connectionString: hardenedPostgresUrl(databaseUrl),
      max: Number(process.env.DB_CONNECTION_LIMIT ?? 2),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

function normalizeResult<T>(text: string, result: QueryResult): T {
  if (/^\s*(SELECT|WITH)\b/i.test(text) || result.rows.length > 0) {
    return result.rows as T;
  }
  return { affectedRows: result.rowCount ?? 0 } as T;
}

function executorFor(client: PoolClient): QueryExecutor {
  return async <T>(sql: string, values?: NamedValues) => {
    const { text, parameters } = compileNamedQuery(sql, values);
    const result = await client.query(text, parameters);
    return normalizeResult<T>(text, result);
  };
}

export async function query<T>(sql: string, values?: NamedValues): Promise<T> {
  if (!pool) throw new Error("DATABASE_URL PostgreSQL no esta configurada.");
  const { text, parameters } = compileNamedQuery(sql, values);
  const result = await pool.query(text, parameters);
  return normalizeResult<T>(text, result);
}

export async function withTransaction<T>(work: (execute: QueryExecutor) => Promise<T>) {
  if (!pool) throw new Error("DATABASE_URL PostgreSQL no esta configurada.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(executorFor(client));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
