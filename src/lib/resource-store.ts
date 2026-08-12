import { isDatabaseConfigured, query, withTransaction, type QueryExecutor, type ResultSetHeader, type RowDataPacket } from "@/lib/db";
import { requireResourceAccess, ValidationError } from "@/lib/authorization";
import { HONDURAS_CENTER, calculateInventoryStatus, isInsideHonduras, polygonAround, type ResourceKey, type ResourceRecord } from "@/lib/resource-definitions";

type DbRow = RowDataPacket & Record<string, string | number | boolean | null>;

type StoreConfig = {
  table: string;
  select: string;
  insert: (item: ResourceRecord, empresaId: string, id: string) => { sql: string; values: Record<string, string | number | boolean | null> };
  update: (item: ResourceRecord, id: string) => { sql: string; values: Record<string, string | number | boolean | null> };
  mapRow: (row: DbRow) => ResourceRecord;
};

function text(item: ResourceRecord, key: string, fallback = "") {
  return String(item[key] ?? fallback).trim();
}

function num(item: ResourceRecord, key: string, fallback = 0) {
  const value = Number(item[key] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

function dateOrNull(item: ResourceRecord, key: string) {
  const value = text(item, key);
  return value || null;
}

function databaseDate(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function polygonWkt(lat: number, lng: number) {
  const points = polygonAround(lat, lng);
  const closed = [...points, points[0]];
  return `POLYGON((${closed.map(([pointLat, pointLng]) => `${pointLng} ${pointLat}`).join(",")}))`;
}

function centerWkt(lat: number, lng: number) {
  return `POINT(${lng} ${lat})`;
}

function validHondurasPoint(item: ResourceRecord) {
  const lat = num(item, "lat", HONDURAS_CENTER[0]);
  const lng = num(item, "lng", HONDURAS_CENTER[1]);
  if (!isInsideHonduras(lat, lng)) {
    throw new Error("La geolocalizacion debe estar dentro de Honduras.");
  }
  return { lat, lng };
}

const cropAliases: Record<string, string> = {
  maiz: "MAI",
  cafe: "CAF",
  frijol: "FRI",
  sorgo: "SOR",
  palma: "PAL",
  arroz: "ARR",
  tomate: "TOM",
  chile: "CHI",
  banano: "BAN",
  platano: "PLA",
  yuca: "YUC",
};

const resourcePrefixes: Record<ResourceKey, string> = {
  parcelas: "PAR",
  cultivos: "CUL",
  inventario: "INV",
  cosechas: "COS",
  empleados: "EML",
  finanzas: "FIN",
  alertas: "ALT",
  reportes: "REP",
};

function normalizeCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .toLowerCase();
}

function cropCode(value: string) {
  const normalized = normalizeCode(value);
  const alias = Object.entries(cropAliases).find(([name]) => normalized.includes(name));
  if (alias) return alias[1];
  const letters = normalized.replace(/[^a-z0-9]/g, "").toUpperCase();
  return (letters || "GEN").slice(0, 3).padEnd(3, "X");
}

function codeContext(resource: ResourceKey, item: ResourceRecord) {
  if (resource === "parcelas") return cropCode(text(item, "cultivo", text(item, "nombre", "General")));
  if (resource === "cultivos") return cropCode(text(item, "nombre", "General"));
  if (resource === "cosechas") return cropCode(text(item, "cultivo", "General"));
  if (resource === "inventario") return cropCode(text(item, "categoria", "Insumo"));
  if (resource === "finanzas") return cropCode(text(item, "tipo", "Finanza"));
  if (resource === "alertas") return cropCode(text(item, "tipo", "Alerta"));
  if (resource === "reportes") return cropCode(text(item, "tipo", "Reporte"));
  return "GEN";
}

async function nextResourceId(execute: QueryExecutor, resource: ResourceKey, item: ResourceRecord) {
  const base = `${resourcePrefixes[resource]}-${codeContext(resource, item)}`;
  const config = stores[resource];
  await execute("SELECT pg_advisory_xact_lock(hashtext(:lockKey))", { lockKey: `agrosync:${resource}:${base}` });
  const rows = await execute<(RowDataPacket & { id: string })[]>(
    `SELECT id FROM ${config.table} WHERE id LIKE :pattern ORDER BY id DESC LIMIT 1`,
    { pattern: `${base}-%` }
  );
  const last = rows[0]?.id ?? "";
  const next = (Number(last.match(/-(\d+)$/)?.[1] ?? 0) || 0) + 1;
  return `${base}-${String(next).padStart(3, "0")}`;
}

async function writeAudit(
  execute: QueryExecutor,
  session: { userId: string; empresaId: string },
  resource: ResourceKey,
  recordId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null
) {
  await execute<ResultSetHeader>(
    `INSERT INTO auditoria_eventos (empresa_id, usuario_id, recurso, registro_id, accion, datos_anteriores, datos_nuevos)
     VALUES (:empresaId, :usuarioId, :recurso, :recordId, :action, CAST(:beforeData AS jsonb), CAST(:afterData AS jsonb))`,
    {
      empresaId: session.empresaId,
      usuarioId: session.userId,
      recurso: resource,
      recordId,
      action,
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
    }
  );
}

const stores: Record<ResourceKey, StoreConfig> = {
  parcelas: {
    table: "parcelas",
    select:
      "SELECT id, nombre, zona, cultivo, hectareas, estado, ST_Y(centro) AS lat, ST_X(centro) AS lng FROM parcelas ORDER BY nombre",
    insert: (item, empresaId, id) => {
      const { lat, lng } = validHondurasPoint(item);
      return {
        sql:
          "INSERT INTO parcelas (id, empresa_id, nombre, zona, cultivo, hectareas, estado, centro, poligono) VALUES (:id, :empresaId, :nombre, :zona, :cultivo, :hectareas, :estado, ST_GeomFromText(:centro, 4326), ST_GeomFromText(:poligono, 4326))",
        values: {
          id,
          empresaId,
          nombre: text(item, "nombre"),
          zona: text(item, "zona"),
          cultivo: text(item, "cultivo"),
          hectareas: num(item, "hectareas"),
          estado: text(item, "estado", "Activa"),
          centro: centerWkt(lat, lng),
          poligono: polygonWkt(lat, lng),
        },
      };
    },
    update: (item, id) => {
      const { lat, lng } = validHondurasPoint(item);
      return {
        sql:
          "UPDATE parcelas SET nombre = :nombre, zona = :zona, cultivo = :cultivo, hectareas = :hectareas, estado = :estado, centro = ST_GeomFromText(:centro, 4326), poligono = ST_GeomFromText(:poligono, 4326) WHERE id = :id AND deleted_at IS NULL",
        values: {
          id,
          nombre: text(item, "nombre"),
          zona: text(item, "zona"),
          cultivo: text(item, "cultivo"),
          hectareas: num(item, "hectareas"),
          estado: text(item, "estado", "Activa"),
          centro: centerWkt(lat, lng),
          poligono: polygonWkt(lat, lng),
        },
      };
    },
    mapRow: (row) => ({
      id: String(row.id),
      nombre: String(row.nombre),
      zona: String(row.zona),
      cultivo: String(row.cultivo ?? "Sin cultivo"),
      hectareas: Number(row.hectareas),
      estado: String(row.estado),
      lat: Number(row.lat),
      lng: Number(row.lng),
    }),
  },
  cultivos: {
    table: "cultivos",
    select:
      "SELECT c.id, c.nombre, c.fecha_siembra, c.fecha_cosecha_estimada, c.etapa, c.estado, COALESCE(p.nombre, '') AS parcela FROM cultivos c LEFT JOIN parcelas p ON p.id = c.parcela_id AND p.empresa_id = c.empresa_id AND p.deleted_at IS NULL ORDER BY c.fecha_siembra DESC",
    insert: (item, empresaId, id) => ({
      sql:
        "INSERT INTO cultivos (id, empresa_id, parcela_id, nombre, fecha_siembra, fecha_cosecha_estimada, etapa, estado) VALUES (:id, :empresaId, (SELECT id FROM parcelas WHERE empresa_id = :empresaId AND deleted_at IS NULL AND (id = :parcela OR nombre = :parcela) ORDER BY nombre LIMIT 1), :nombre, :fechaSiembra, :fechaCosechaEstimada, :etapa, :estado)",
      values: { id, empresaId, parcela: text(item, "parcela"), nombre: text(item, "nombre"), fechaSiembra: text(item, "fechaSiembra"), fechaCosechaEstimada: dateOrNull(item, "fechaCosechaEstimada"), etapa: text(item, "etapa"), estado: text(item, "estado", "Nuevo") },
    }),
    update: (item, id) => ({
      sql: "UPDATE cultivos SET parcela_id = COALESCE((SELECT p.id FROM parcelas p WHERE p.empresa_id = :empresaId AND p.deleted_at IS NULL AND (p.id = :parcela OR p.nombre = :parcela) ORDER BY p.nombre LIMIT 1), parcela_id), nombre = :nombre, fecha_siembra = :fechaSiembra, fecha_cosecha_estimada = :fechaCosechaEstimada, etapa = :etapa, estado = :estado WHERE id = :id AND deleted_at IS NULL",
      values: { id, empresaId: "", parcela: text(item, "parcela"), nombre: text(item, "nombre"), fechaSiembra: text(item, "fechaSiembra"), fechaCosechaEstimada: dateOrNull(item, "fechaCosechaEstimada"), etapa: text(item, "etapa"), estado: text(item, "estado", "Nuevo") },
    }),
    mapRow: (row) => ({ id: String(row.id), nombre: String(row.nombre), parcela: String(row.parcela), fechaSiembra: databaseDate(row.fecha_siembra), fechaCosechaEstimada: databaseDate(row.fecha_cosecha_estimada), etapa: String(row.etapa), estado: String(row.estado) }),
  },
  inventario: {
    table: "inventario_items",
    select:
      "SELECT id, nombre, categoria, stock, unidad, stock_minimo, costo_unitario_hnl, ubicacion FROM inventario_items ORDER BY nombre",
    insert: (item, empresaId, id) => ({
      sql:
        "INSERT INTO inventario_items (id, empresa_id, nombre, categoria, stock, unidad, stock_minimo, costo_unitario_hnl, ubicacion) VALUES (:id, :empresaId, :nombre, :categoria, :stock, :unidad, :stockMinimo, :costoUnitario, :ubicacion)",
      values: { id, empresaId, nombre: text(item, "nombre"), categoria: text(item, "categoria"), stock: num(item, "stock"), unidad: text(item, "unidad"), stockMinimo: num(item, "stockMinimo"), costoUnitario: num(item, "costoUnitario"), ubicacion: text(item, "ubicacion") },
    }),
    update: (item, id) => ({
      sql:
        "UPDATE inventario_items SET nombre = :nombre, categoria = :categoria, stock = :stock, unidad = :unidad, stock_minimo = :stockMinimo, costo_unitario_hnl = :costoUnitario, ubicacion = :ubicacion WHERE id = :id AND deleted_at IS NULL",
      values: { id, nombre: text(item, "nombre"), categoria: text(item, "categoria"), stock: num(item, "stock"), unidad: text(item, "unidad"), stockMinimo: num(item, "stockMinimo"), costoUnitario: num(item, "costoUnitario"), ubicacion: text(item, "ubicacion") },
    }),
    mapRow: (row) => {
      const stock = Number(row.stock);
      const stockMinimo = Number(row.stock_minimo);
      return { id: String(row.id), nombre: String(row.nombre), categoria: String(row.categoria), stock, unidad: String(row.unidad), stockMinimo, costoUnitario: Number(row.costo_unitario_hnl), ubicacion: String(row.ubicacion), estado: calculateInventoryStatus(stock, stockMinimo) };
    },
  },
  cosechas: {
    table: "cosechas",
    select:
      "SELECT h.id, h.fecha, h.toneladas, h.calidad, h.estado, COALESCE(c.nombre, '') AS cultivo FROM cosechas h LEFT JOIN cultivos c ON c.id = h.cultivo_id AND c.empresa_id = h.empresa_id AND c.deleted_at IS NULL ORDER BY h.fecha DESC",
    insert: (item, empresaId, id) => ({
      sql:
        "INSERT INTO cosechas (id, empresa_id, cultivo_id, fecha, toneladas, calidad, estado) VALUES (:id, :empresaId, (SELECT id FROM cultivos WHERE empresa_id = :empresaId AND deleted_at IS NULL AND (id = :cultivo OR nombre = :cultivo) ORDER BY fecha_siembra DESC LIMIT 1), :fecha, :toneladas, :calidad, :estado)",
      values: { id, empresaId, cultivo: text(item, "cultivo"), fecha: text(item, "fecha"), toneladas: num(item, "toneladas"), calidad: text(item, "calidad", "Estandar"), estado: text(item, "estado", "Completada") },
    }),
    update: (item, id) => ({
      sql: "UPDATE cosechas SET cultivo_id = COALESCE((SELECT c.id FROM cultivos c WHERE c.empresa_id = :empresaId AND c.deleted_at IS NULL AND (c.id = :cultivo OR c.nombre = :cultivo) ORDER BY c.fecha_siembra DESC LIMIT 1), cultivo_id), fecha = :fecha, toneladas = :toneladas, calidad = :calidad, estado = :estado WHERE id = :id AND deleted_at IS NULL",
      values: { id, empresaId: "", cultivo: text(item, "cultivo"), fecha: text(item, "fecha"), toneladas: num(item, "toneladas"), calidad: text(item, "calidad", "Estandar"), estado: text(item, "estado", "Completada") },
    }),
    mapRow: (row) => ({ id: String(row.id), cultivo: String(row.cultivo), fecha: databaseDate(row.fecha), toneladas: Number(row.toneladas), calidad: String(row.calidad), estado: String(row.estado ?? "Completada") }),
  },
  empleados: {
    table: "empleados",
    select: "SELECT id, nombre, cargo, salario_mensual_hnl, estado FROM empleados ORDER BY nombre",
    insert: (item, empresaId, id) => ({
      sql: "INSERT INTO empleados (id, empresa_id, nombre, cargo, salario_mensual_hnl, estado) VALUES (:id, :empresaId, :nombre, :cargo, :salarioMensual, :estado)",
      values: { id, empresaId, nombre: text(item, "nombre"), cargo: text(item, "cargo"), salarioMensual: num(item, "salarioMensual"), estado: text(item, "estado", "Activo") },
    }),
    update: (item, id) => ({
      sql: "UPDATE empleados SET nombre = :nombre, cargo = :cargo, salario_mensual_hnl = :salarioMensual, estado = :estado WHERE id = :id AND deleted_at IS NULL",
      values: { id, nombre: text(item, "nombre"), cargo: text(item, "cargo"), salarioMensual: num(item, "salarioMensual"), estado: text(item, "estado", "Activo") },
    }),
    mapRow: (row) => ({ id: String(row.id), nombre: String(row.nombre), cargo: String(row.cargo), salarioMensual: Number(row.salario_mensual_hnl), estado: String(row.estado) }),
  },
  finanzas: {
    table: "finanzas_transacciones",
    select: "SELECT id, concepto, categoria, tipo, monto_hnl, fecha FROM finanzas_transacciones ORDER BY fecha DESC",
    insert: (item, empresaId, id) => ({
      sql: "INSERT INTO finanzas_transacciones (id, empresa_id, concepto, categoria, tipo, monto_hnl, fecha) VALUES (:id, :empresaId, :concepto, :categoria, :tipo, :monto, :fecha)",
      values: { id, empresaId, concepto: text(item, "concepto"), categoria: text(item, "categoria"), tipo: text(item, "tipo", "Ingreso"), monto: num(item, "monto"), fecha: text(item, "fecha") },
    }),
    update: (item, id) => ({
      sql: "UPDATE finanzas_transacciones SET concepto = :concepto, categoria = :categoria, tipo = :tipo, monto_hnl = :monto, fecha = :fecha WHERE id = :id AND deleted_at IS NULL",
      values: { id, concepto: text(item, "concepto"), categoria: text(item, "categoria"), tipo: text(item, "tipo", "Ingreso"), monto: num(item, "monto"), fecha: text(item, "fecha") },
    }),
    mapRow: (row) => ({ id: String(row.id), concepto: String(row.concepto), categoria: String(row.categoria), tipo: String(row.tipo), monto: Number(row.monto_hnl), fecha: databaseDate(row.fecha) }),
  },
  alertas: {
    table: "alertas",
    select: "SELECT id, tipo, severidad, mensaje, resuelta FROM alertas ORDER BY creada_en DESC",
    insert: (item, empresaId, id) => ({
      sql: "INSERT INTO alertas (id, empresa_id, tipo, severidad, mensaje, resuelta) VALUES (:id, :empresaId, :tipo, :severidad, :mensaje, :resuelta)",
      values: { id, empresaId, tipo: text(item, "tipo"), severidad: text(item, "severidad", "Media"), mensaje: text(item, "mensaje"), resuelta: text(item, "resuelta") === "Resuelta" },
    }),
    update: (item, id) => ({
      sql: "UPDATE alertas SET tipo = :tipo, severidad = :severidad, mensaje = :mensaje, resuelta = :resuelta WHERE id = :id AND deleted_at IS NULL",
      values: { id, tipo: text(item, "tipo"), severidad: text(item, "severidad", "Media"), mensaje: text(item, "mensaje"), resuelta: text(item, "resuelta") === "Resuelta" },
    }),
    mapRow: (row) => ({ id: String(row.id), tipo: String(row.tipo), severidad: String(row.severidad), mensaje: String(row.mensaje), zona: "Honduras", resuelta: row.resuelta ? "Resuelta" : "Pendiente" }),
  },
  reportes: {
    table: "reportes",
    select:
      "SELECT id, titulo, tipo, fecha, formato, destinatario, estado, descripcion FROM reportes ORDER BY fecha DESC",
    insert: (item, empresaId, id) => ({
      sql:
        "INSERT INTO reportes (id, empresa_id, titulo, tipo, fecha, formato, destinatario, estado, descripcion) VALUES (:id, :empresaId, :titulo, :tipo, :fecha, :formato, :destinatario, :estado, :descripcion)",
      values: {
        id,
        empresaId,
        titulo: text(item, "titulo"),
        tipo: text(item, "tipo", "Produccion"),
        fecha: text(item, "fecha"),
        formato: text(item, "formato", "PDF"),
        destinatario: text(item, "destinatario"),
        estado: text(item, "estado", "Listo"),
        descripcion: text(item, "descripcion"),
      },
    }),
    update: (item, id) => ({
      sql:
        "UPDATE reportes SET titulo = :titulo, tipo = :tipo, fecha = :fecha, formato = :formato, destinatario = :destinatario, estado = :estado, descripcion = :descripcion WHERE id = :id AND deleted_at IS NULL",
      values: {
        id,
        titulo: text(item, "titulo"),
        tipo: text(item, "tipo", "Produccion"),
        fecha: text(item, "fecha"),
        formato: text(item, "formato", "PDF"),
        destinatario: text(item, "destinatario"),
        estado: text(item, "estado", "Listo"),
        descripcion: text(item, "descripcion"),
      },
    }),
    mapRow: (row) => ({
      id: String(row.id),
      titulo: String(row.titulo),
      tipo: String(row.tipo),
      fecha: databaseDate(row.fecha),
      formato: String(row.formato),
      destinatario: String(row.destinatario ?? ""),
      estado: String(row.estado),
      descripcion: String(row.descripcion ?? ""),
    }),
  },
};

export function isResourceKey(value: string): value is ResourceKey {
  return value in stores;
}

function buildScopedSelectQuery(selectSql: string, empresaIdValue: string) {
  const prefix = selectSql.includes(" c.")
    ? "c."
    : selectSql.includes(" h.")
    ? "h."
    : "";
  const conditions = [`${prefix}deleted_at IS NULL`];
  if (empresaIdValue) conditions.push(`${prefix}empresa_id = :empresaId`);
  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const values = empresaIdValue ? { empresaId: empresaIdValue } : {};
  if (selectSql.includes("ORDER BY")) {
    return {
      sql: selectSql.replace("ORDER BY", `${whereClause} ORDER BY`),
      values,
    };
  }
  return {
    sql: `${selectSql} ${whereClause}`,
    values,
  };
}

function tenantCondition(empresaId: string) {
  return { sql: " AND empresa_id = :empresaId", values: { empresaId } };
}

async function currentRecord(execute: QueryExecutor, table: string, id: string, empresaId: string) {
  const tenant = tenantCondition(empresaId);
  const rows = await execute<DbRow[]>(
    `SELECT * FROM ${table} WHERE id = :id AND deleted_at IS NULL${tenant.sql} LIMIT 1`,
    { id, ...tenant.values }
  );
  return rows[0] ?? null;
}

export async function listResource(resource: ResourceKey, authorizeAs: ResourceKey = resource) {
  if (!isDatabaseConfigured) return { items: [], dbConfigured: false };
  const session = await requireResourceAccess(authorizeAs);
  const config = stores[resource];
  const { sql, values } = buildScopedSelectQuery(config.select, session.empresaId);
  const rows = await query<DbRow[]>(sql, values);
  return { items: rows.map(config.mapRow), dbConfigured: true };
}

function validateCultivoDates(item: ResourceRecord) {
  const sowing = text(item, "fechaSiembra");
  const harvest = dateOrNull(item, "fechaCosechaEstimada");
  if (harvest && harvest < sowing) {
    throw new ValidationError("La cosecha estimada no puede ser anterior a la fecha de siembra.");
  }
}

async function resolveCultivoParcel(
  execute: QueryExecutor,
  empresaId: string,
  item: ResourceRecord
) {
  const reference = text(item, "parcela").trim();
  if (!reference) throw new ValidationError("Selecciona una parcela válida.");
  const rows = await execute<(RowDataPacket & { id: string; nombre: string })[]>(
    `SELECT id, nombre FROM parcelas
     WHERE empresa_id = :empresaId AND deleted_at IS NULL
       AND (id = :reference OR nombre = :reference)
     ORDER BY CASE WHEN id = :reference THEN 0 ELSE 1 END, nombre
     LIMIT 1`,
    { empresaId, reference }
  );
  const parcel = rows[0];
  if (!parcel) {
    throw new ValidationError("La parcela seleccionada ya no está disponible. Actualiza la lista e intenta nuevamente.");
  }
  return { id: String(parcel.id), nombre: String(parcel.nombre) };
}

export async function createResource(resource: ResourceKey, item: ResourceRecord) {
  if (!isDatabaseConfigured) throw new Error("DATABASE_URL no esta configurada.");
  const session = await requireResourceAccess(resource);
  const config = stores[resource];
  return withTransaction(async (execute) => {
    const id = item.id || await nextResourceId(execute, resource, item);
    let saved: ResourceRecord = { ...item, id: String(id) };
    let responseItem: ResourceRecord = saved;
    if (resource === "cultivos") {
      validateCultivoDates(saved);
      const parcel = await resolveCultivoParcel(execute, session.empresaId, saved);
      saved = { ...saved, parcela: parcel.id };
      responseItem = { ...saved, parcela: parcel.nombre };
    }
    const mutation = config.insert(saved, session.empresaId, String(id));
    await execute<ResultSetHeader>(mutation.sql, mutation.values);
    await writeAudit(execute, session, resource, String(id), "CREATE", null, responseItem);
    return responseItem;
  });
}

export async function updateResource(resource: ResourceKey, id: string, item: ResourceRecord) {
  if (!isDatabaseConfigured) throw new Error("DATABASE_URL no esta configurada.");
  const session = await requireResourceAccess(resource);
  const config = stores[resource];
  return withTransaction(async (execute) => {
    const before = await currentRecord(execute, config.table, id, session.empresaId);
    if (!before) throw new Error("Registro no encontrado o fuera de tu alcance.");
    const tenant = tenantCondition(session.empresaId);
    let saved: ResourceRecord = { ...item, id };
    let responseItem: ResourceRecord = saved;
    if (resource === "cultivos") {
      validateCultivoDates(saved);
      const parcel = await resolveCultivoParcel(execute, session.empresaId, saved);
      saved = { ...saved, parcela: parcel.id };
      responseItem = { ...saved, parcela: parcel.nombre };
    }
    const mutation = config.update(saved, id);
    const result = await execute<ResultSetHeader>(`${mutation.sql}${tenant.sql}`, {
      ...mutation.values,
      ...tenant.values,
    });
    if (result.affectedRows !== 1) throw new Error("No se pudo actualizar el registro.");
    await writeAudit(execute, session, resource, id, "UPDATE", before, responseItem);
    return responseItem;
  });
}

export async function deleteResource(resource: ResourceKey, id: string) {
  if (!isDatabaseConfigured) throw new Error("DATABASE_URL no esta configurada.");
  const session = await requireResourceAccess(resource);
  const config = stores[resource];
  await withTransaction(async (execute) => {
    const before = await currentRecord(execute, config.table, id, session.empresaId);
    if (!before) throw new Error("Registro no encontrado o fuera de tu alcance.");
    const tenant = tenantCondition(session.empresaId);
    const result = await execute<ResultSetHeader>(
      `UPDATE ${config.table} SET deleted_at = CURRENT_TIMESTAMP, deleted_by = :userId
       WHERE id = :id AND deleted_at IS NULL${tenant.sql}`,
      { id, userId: session.userId, ...tenant.values }
    );
    if (result.affectedRows !== 1) throw new Error("No se pudo eliminar el registro.");
    await writeAudit(execute, session, resource, id, "DELETE", before, null);
  });
}
