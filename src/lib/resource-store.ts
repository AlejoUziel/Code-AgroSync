import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { isDatabaseConfigured, query } from "@/lib/db";
import { readSession } from "@/lib/session";
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

function mysqlDate(value: unknown) {
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

async function nextResourceId(resource: ResourceKey, item: ResourceRecord) {
  const base = `${resourcePrefixes[resource]}-${codeContext(resource, item)}`;
  const config = stores[resource];
  const rows = await query<(RowDataPacket & { id: string })[]>(
    `SELECT id FROM ${config.table} WHERE id LIKE :pattern ORDER BY id DESC LIMIT 1`,
    { pattern: `${base}-%` }
  );
  const last = rows[0]?.id ?? "";
  const next = (Number(last.match(/-(\d+)$/)?.[1] ?? 0) || 0) + 1;
  return `${base}-${String(next).padStart(3, "0")}`;
}

const stores: Record<ResourceKey, StoreConfig> = {
  parcelas: {
    table: "parcelas",
    select:
      "SELECT id, nombre, zona, hectareas, estado, ST_Y(centro) AS lat, ST_X(centro) AS lng FROM parcelas ORDER BY nombre",
    insert: (item, empresaId, id) => {
      const { lat, lng } = validHondurasPoint(item);
      return {
        sql:
          "INSERT INTO parcelas (id, empresa_id, nombre, zona, hectareas, estado, centro, poligono) VALUES (:id, :empresaId, :nombre, :zona, :hectareas, :estado, ST_GeomFromText(:centro, 4326), ST_GeomFromText(:poligono, 4326))",
        values: {
          id,
          empresaId,
          nombre: text(item, "nombre"),
          zona: text(item, "zona"),
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
          "UPDATE parcelas SET nombre = :nombre, zona = :zona, hectareas = :hectareas, estado = :estado, centro = ST_GeomFromText(:centro, 4326), poligono = ST_GeomFromText(:poligono, 4326) WHERE id = :id",
        values: {
          id,
          nombre: text(item, "nombre"),
          zona: text(item, "zona"),
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
      cultivo: "Sin cultivo",
      hectareas: Number(row.hectareas),
      estado: String(row.estado),
      lat: Number(row.lat),
      lng: Number(row.lng),
    }),
  },
  cultivos: {
    table: "cultivos",
    select:
      "SELECT c.id, c.nombre, c.fecha_siembra, c.fecha_cosecha_estimada, c.etapa, c.estado, COALESCE(p.nombre, '') AS parcela FROM cultivos c LEFT JOIN parcelas p ON p.id = c.parcela_id ORDER BY c.fecha_siembra DESC",
    insert: (item, empresaId, id) => ({
      sql:
        "INSERT INTO cultivos (id, empresa_id, parcela_id, nombre, fecha_siembra, fecha_cosecha_estimada, etapa, estado) VALUES (:id, :empresaId, (SELECT id FROM parcelas WHERE id = :parcela OR nombre = :parcela ORDER BY nombre LIMIT 1), :nombre, :fechaSiembra, :fechaCosechaEstimada, :etapa, :estado)",
      values: { id, empresaId, parcela: text(item, "parcela"), nombre: text(item, "nombre"), fechaSiembra: text(item, "fechaSiembra"), fechaCosechaEstimada: dateOrNull(item, "fechaCosechaEstimada"), etapa: text(item, "etapa"), estado: text(item, "estado", "Nuevo") },
    }),
    update: (item, id) => ({
      sql: "UPDATE cultivos SET parcela_id = COALESCE((SELECT p.id FROM parcelas p WHERE p.id = :parcela OR p.nombre = :parcela ORDER BY p.nombre LIMIT 1), parcela_id), nombre = :nombre, fecha_siembra = :fechaSiembra, fecha_cosecha_estimada = :fechaCosechaEstimada, etapa = :etapa, estado = :estado WHERE id = :id",
      values: { id, parcela: text(item, "parcela"), nombre: text(item, "nombre"), fechaSiembra: text(item, "fechaSiembra"), fechaCosechaEstimada: dateOrNull(item, "fechaCosechaEstimada"), etapa: text(item, "etapa"), estado: text(item, "estado", "Nuevo") },
    }),
    mapRow: (row) => ({ id: String(row.id), nombre: String(row.nombre), parcela: String(row.parcela), fechaSiembra: mysqlDate(row.fecha_siembra), fechaCosechaEstimada: mysqlDate(row.fecha_cosecha_estimada), etapa: String(row.etapa), estado: String(row.estado) }),
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
        "UPDATE inventario_items SET nombre = :nombre, categoria = :categoria, stock = :stock, unidad = :unidad, stock_minimo = :stockMinimo, costo_unitario_hnl = :costoUnitario, ubicacion = :ubicacion WHERE id = :id",
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
      "SELECT h.id, h.fecha, h.toneladas, h.calidad, COALESCE(c.nombre, '') AS cultivo FROM cosechas h LEFT JOIN cultivos c ON c.id = h.cultivo_id ORDER BY h.fecha DESC",
    insert: (item, empresaId, id) => ({
      sql:
        "INSERT INTO cosechas (id, empresa_id, cultivo_id, fecha, toneladas, calidad) VALUES (:id, :empresaId, (SELECT id FROM cultivos WHERE id = :cultivo OR nombre = :cultivo ORDER BY fecha_siembra DESC LIMIT 1), :fecha, :toneladas, :calidad)",
      values: { id, empresaId, cultivo: text(item, "cultivo"), fecha: text(item, "fecha"), toneladas: num(item, "toneladas"), calidad: text(item, "calidad", "Estandar") },
    }),
    update: (item, id) => ({
      sql: "UPDATE cosechas SET cultivo_id = COALESCE((SELECT c.id FROM cultivos c WHERE c.id = :cultivo OR c.nombre = :cultivo ORDER BY c.fecha_siembra DESC LIMIT 1), cultivo_id), fecha = :fecha, toneladas = :toneladas, calidad = :calidad WHERE id = :id",
      values: { id, cultivo: text(item, "cultivo"), fecha: text(item, "fecha"), toneladas: num(item, "toneladas"), calidad: text(item, "calidad", "Estandar") },
    }),
    mapRow: (row) => ({ id: String(row.id), cultivo: String(row.cultivo), fecha: mysqlDate(row.fecha), toneladas: Number(row.toneladas), calidad: String(row.calidad), estado: "Completada" }),
  },
  empleados: {
    table: "empleados",
    select: "SELECT id, nombre, cargo, salario_mensual_hnl, estado FROM empleados ORDER BY nombre",
    insert: (item, empresaId, id) => ({
      sql: "INSERT INTO empleados (id, empresa_id, nombre, cargo, salario_mensual_hnl, estado) VALUES (:id, :empresaId, :nombre, :cargo, :salarioMensual, :estado)",
      values: { id, empresaId, nombre: text(item, "nombre"), cargo: text(item, "cargo"), salarioMensual: num(item, "salarioMensual"), estado: text(item, "estado", "Activo") },
    }),
    update: (item, id) => ({
      sql: "UPDATE empleados SET nombre = :nombre, cargo = :cargo, salario_mensual_hnl = :salarioMensual, estado = :estado WHERE id = :id",
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
      sql: "UPDATE finanzas_transacciones SET concepto = :concepto, categoria = :categoria, tipo = :tipo, monto_hnl = :monto, fecha = :fecha WHERE id = :id",
      values: { id, concepto: text(item, "concepto"), categoria: text(item, "categoria"), tipo: text(item, "tipo", "Ingreso"), monto: num(item, "monto"), fecha: text(item, "fecha") },
    }),
    mapRow: (row) => ({ id: String(row.id), concepto: String(row.concepto), categoria: String(row.categoria), tipo: String(row.tipo), monto: Number(row.monto_hnl), fecha: mysqlDate(row.fecha) }),
  },
  alertas: {
    table: "alertas",
    select: "SELECT id, tipo, severidad, mensaje, resuelta FROM alertas ORDER BY creada_en DESC",
    insert: (item, empresaId, id) => ({
      sql: "INSERT INTO alertas (id, empresa_id, tipo, severidad, mensaje, resuelta) VALUES (:id, :empresaId, :tipo, :severidad, :mensaje, :resuelta)",
      values: { id, empresaId, tipo: text(item, "tipo"), severidad: text(item, "severidad", "Media"), mensaje: text(item, "mensaje"), resuelta: text(item, "resuelta") === "Resuelta" },
    }),
    update: (item, id) => ({
      sql: "UPDATE alertas SET tipo = :tipo, severidad = :severidad, mensaje = :mensaje, resuelta = :resuelta WHERE id = :id",
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
        "UPDATE reportes SET titulo = :titulo, tipo = :tipo, fecha = :fecha, formato = :formato, destinatario = :destinatario, estado = :estado, descripcion = :descripcion WHERE id = :id",
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
      fecha: mysqlDate(row.fecha),
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

async function empresaId() {
  const session = await readSession();
  return session?.empresaId ?? "";
}

function buildScopedSelectQuery(selectSql: string, empresaIdValue: string) {
  if (!empresaIdValue) return { sql: selectSql, values: {} };
  const prefix = selectSql.includes(" c.")
    ? "c."
    : selectSql.includes(" h.")
    ? "h."
    : "";
  const whereClause = `WHERE ${prefix}empresa_id = :empresaId`;
  if (selectSql.includes("ORDER BY")) {
    return {
      sql: selectSql.replace("ORDER BY", `${whereClause} ORDER BY`),
      values: { empresaId: empresaIdValue },
    };
  }
  return {
    sql: `${selectSql} ${whereClause}`,
    values: { empresaId: empresaIdValue },
  };
}

export async function listResource(resource: ResourceKey) {
  if (!isDatabaseConfigured) return { items: [], dbConfigured: false };
  const config = stores[resource];
  const currentEmpresaId = await empresaId();
  const { sql, values } = buildScopedSelectQuery(config.select, currentEmpresaId);
  const rows = await query<DbRow[]>(sql, values);
  return { items: rows.map(config.mapRow), dbConfigured: true };
}

export async function createResource(resource: ResourceKey, item: ResourceRecord) {
  if (!isDatabaseConfigured) throw new Error("DATABASE_URL no esta configurada.");
  const config = stores[resource];
  const currentEmpresaId = await empresaId();
  const id = item.id || await nextResourceId(resource, item);
  const mutation = config.insert(item, currentEmpresaId, String(id));
  await query<ResultSetHeader>(mutation.sql, mutation.values);
  return { ...item, id: String(id) };
}

export async function updateResource(resource: ResourceKey, id: string, item: ResourceRecord) {
  if (!isDatabaseConfigured) throw new Error("DATABASE_URL no esta configurada.");
  const config = stores[resource];
  const mutation = config.update(item, id);
  await query<ResultSetHeader>(mutation.sql, mutation.values);
  return { ...item, id };
}

export async function deleteResource(resource: ResourceKey, id: string) {
  if (!isDatabaseConfigured) throw new Error("DATABASE_URL no esta configurada.");
  const config = stores[resource];
  await query<ResultSetHeader>(`DELETE FROM ${config.table} WHERE id = :id`, { id });
}
