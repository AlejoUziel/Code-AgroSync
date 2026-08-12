export type NamedValues = Record<string, unknown>;

export function hardenedPostgresUrl(value?: string) {
  if (!value?.startsWith("postgres")) return value;
  try {
    const url = new URL(value);
    const sslMode = url.searchParams.get("sslmode");
    if (!sslMode || ["prefer", "require", "verify-ca"].includes(sslMode)) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function compileNamedQuery(sql: string, values: NamedValues = {}) {
  const indexes = new Map<string, number>();
  const parameters: unknown[] = [];
  const text = sql.replace(/(?<!:):([A-Za-z][A-Za-z0-9_]*)/g, (_match, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(`Falta el parametro SQL :${key}.`);
    }
    if (!indexes.has(key)) {
      parameters.push(values[key]);
      indexes.set(key, parameters.length);
    }
    return `$${indexes.get(key)}`;
  });
  return { text, parameters };
}
