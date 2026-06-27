import type { LatLngExpression } from "leaflet";

export type FieldType = "text" | "number" | "date" | "select" | "textarea";

export type ResourceField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

export type ResourceDefinition = {
  key: ResourceKey;
  title: string;
  subtitle: string;
  entityLabel: string;
  icon: "parcelas" | "cultivos" | "inventario" | "produccion" | "empleados" | "finanzas" | "alertas" | "reportes";
  searchKeys: string[];
  statusKey?: string;
  tableFields: string[];
  fields: ResourceField[];
  seed: ResourceRecord[];
};

export type ResourceRecord = Record<string, string | number | boolean | LatLngExpression[] | undefined> & {
  id: string;
};

export type ResourceKey =
  | "parcelas"
  | "cultivos"
  | "inventario"
  | "cosechas"
  | "empleados"
  | "finanzas"
  | "alertas"
  | "reportes";

export const HONDURAS_CENTER: [number, number] = [14.8, -86.6];
export const HONDURAS_BOUNDS: [[number, number], [number, number]] = [
  [12.95, -89.38],
  [16.55, -83.05],
];

export function isInsideHonduras(lat: number, lng: number) {
  return (
    lat >= HONDURAS_BOUNDS[0][0] &&
    lat <= HONDURAS_BOUNDS[1][0] &&
    lng >= HONDURAS_BOUNDS[0][1] &&
    lng <= HONDURAS_BOUNDS[1][1]
  );
}

export function polygonAround(lat: number, lng: number): [number, number][] {
  const d = 0.018;
  return [
    [lat + d, lng - d],
    [lat + d, lng + d],
    [lat - d, lng + d],
    [lat - d, lng - d],
  ];
}

export function calculateInventoryStatus(stockValue: unknown, stockMinimoValue: unknown) {
  const stock = Number(stockValue ?? 0);
  const stockMinimo = Number(stockMinimoValue ?? 0);
  if (!Number.isFinite(stock) || stock <= 0) return "Agotado";
  if (Number.isFinite(stockMinimo) && stock <= stockMinimo) return "Stock Bajo";
  return "Disponible";
}

export const resourceDefinitions: Record<ResourceKey, ResourceDefinition> = {
  parcelas: {
    key: "parcelas",
    title: "Gestion de Parcelas",
    subtitle: "Operativo · Parcelas geolocalizadas en Honduras",
    entityLabel: "Parcela",
    icon: "parcelas",
    searchKeys: ["nombre", "zona", "cultivo", "estado"],
    statusKey: "estado",
    tableFields: ["nombre", "zona", "cultivo", "hectareas", "lat", "lng", "estado"],
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "zona", label: "Zona", type: "text", required: true },
      { key: "cultivo", label: "Cultivo", type: "text", required: true },
      { key: "hectareas", label: "Hectareas", type: "number", required: true },
      { key: "lat", label: "Latitud Honduras", type: "number", required: true },
      { key: "lng", label: "Longitud Honduras", type: "number", required: true },
      { key: "estado", label: "Estado", type: "select", required: true, options: ["Activa", "Alerta", "En Preparacion", "En Descanso"] },
    ],
    seed: [
      { id: "P-001", nombre: "Norte-08", zona: "Francisco Morazan", cultivo: "Maiz", hectareas: 42.5, lat: 14.069, lng: -87.179, estado: "Activa" },
      { id: "P-002", nombre: "Valle-12", zona: "Comayagua", cultivo: "Frijol", hectareas: 38, lat: 14.46, lng: -87.65, estado: "Alerta" },
      { id: "P-003", nombre: "Sur-03", zona: "Choluteca", cultivo: "Sorgo", hectareas: 61.2, lat: 13.31, lng: -87.18, estado: "Activa" },
      { id: "P-004", nombre: "Atlantico-04", zona: "Atlantida", cultivo: "Palma", hectareas: 54.1, lat: 15.78, lng: -86.79, estado: "Activa" },
      { id: "P-005", nombre: "Occidente-01", zona: "Copan", cultivo: "Cafe", hectareas: 33.7, lat: 14.84, lng: -89.15, estado: "En Descanso" },
    ],
  },
  cultivos: {
    key: "cultivos",
    title: "Gestion de Cultivos",
    subtitle: "Operativo · Siembras y cosechas estimadas",
    entityLabel: "Cultivo",
    icon: "cultivos",
    searchKeys: ["nombre", "parcela", "etapa", "estado"],
    statusKey: "estado",
    tableFields: ["nombre", "parcela", "fechaSiembra", "fechaCosechaEstimada", "etapa", "estado"],
    fields: [
      { key: "nombre", label: "Cultivo", type: "text", required: true },
      { key: "parcela", label: "Parcela", type: "text", required: true },
      { key: "fechaSiembra", label: "Fecha siembra", type: "date", required: true },
      { key: "fechaCosechaEstimada", label: "Cosecha estimada", type: "date" },
      { key: "etapa", label: "Etapa", type: "select", required: true, options: ["Siembra", "Vegetativa", "Floracion", "Llenado", "Maduracion"] },
      { key: "estado", label: "Estado", type: "select", required: true, options: ["Nuevo", "En Progreso", "Alerta", "Cosechado"] },
    ],
    seed: [
      { id: "C-001", nombre: "Maiz Amarillo H-507", parcela: "Norte-08", fechaSiembra: "2026-01-15", fechaCosechaEstimada: "2026-07-20", etapa: "Floracion", estado: "En Progreso" },
      { id: "C-002", nombre: "Frijol Rojo", parcela: "Valle-12", fechaSiembra: "2026-02-01", fechaCosechaEstimada: "2026-06-05", etapa: "Llenado", estado: "Alerta" },
      { id: "C-003", nombre: "Cafe Lempira", parcela: "Occidente-01", fechaSiembra: "2026-03-10", fechaCosechaEstimada: "2026-11-12", etapa: "Vegetativa", estado: "En Progreso" },
    ],
  },
  inventario: {
    key: "inventario",
    title: "Inventario Agricola",
    subtitle: "Operativo · Insumos y materiales",
    entityLabel: "Item",
    icon: "inventario",
    searchKeys: ["nombre", "categoria", "ubicacion", "estado"],
    statusKey: "estado",
    tableFields: ["nombre", "categoria", "stock", "unidad", "stockMinimo", "ubicacion", "estado"],
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "categoria", label: "Categoria", type: "select", required: true, options: ["Fertilizante", "Agroquimico", "Semilla", "Combustible", "Herramienta"] },
      { key: "stock", label: "Stock", type: "number", required: true },
      { key: "unidad", label: "Unidad", type: "text", required: true },
      { key: "stockMinimo", label: "Stock minimo", type: "number", required: true },
      { key: "costoUnitario", label: "Costo unitario HNL", type: "number" },
      { key: "ubicacion", label: "Ubicacion", type: "text", required: true },
    ],
    seed: [
      { id: "INV-001", nombre: "Fertilizante NPK 20-20-20", categoria: "Fertilizante", stock: 4800, unidad: "kg", stockMinimo: 1000, costoUnitario: 18, ubicacion: "Bodega Tegucigalpa", estado: "Disponible" },
      { id: "INV-002", nombre: "Herbicida Glifosato 480SL", categoria: "Agroquimico", stock: 280, unidad: "lt", stockMinimo: 300, costoUnitario: 210, ubicacion: "Bodega Comayagua", estado: "Stock Bajo" },
      { id: "INV-003", nombre: "Semilla Maiz H-507", categoria: "Semilla", stock: 15000, unidad: "kg", stockMinimo: 2000, costoUnitario: 42, ubicacion: "Silo 1", estado: "Disponible" },
    ],
  },
  cosechas: {
    key: "cosechas",
    title: "Produccion y Cosecha",
    subtitle: "Operativo · Registros de cosecha y rendimiento",
    entityLabel: "Cosecha",
    icon: "produccion",
    searchKeys: ["cultivo", "fecha", "calidad", "estado"],
    statusKey: "estado",
    tableFields: ["cultivo", "fecha", "toneladas", "calidad", "estado"],
    fields: [
      { key: "cultivo", label: "Cultivo", type: "text", required: true },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "toneladas", label: "Toneladas", type: "number", required: true },
      { key: "calidad", label: "Calidad", type: "select", required: true, options: ["Premium", "Estandar", "Baja"] },
      { key: "estado", label: "Estado", type: "select", required: true, options: ["Programada", "En Proceso", "Completada"] },
    ],
    seed: [
      { id: "H-001", cultivo: "Norte-08 / Maiz H-507", fecha: "2026-06-02", toneladas: 320.4, calidad: "Premium", estado: "Completada" },
      { id: "H-002", cultivo: "Sur-03 / Sorgo", fecha: "2026-06-04", toneladas: 180.2, calidad: "Estandar", estado: "Completada" },
    ],
  },
  empleados: {
    key: "empleados",
    title: "Gestion de Empleados",
    subtitle: "Administrativo · Nomina agricola",
    entityLabel: "Empleado",
    icon: "empleados",
    searchKeys: ["nombre", "cargo", "estado"],
    statusKey: "estado",
    tableFields: ["nombre", "cargo", "salarioMensual", "estado"],
    fields: [
      { key: "nombre", label: "Nombre completo", type: "text", required: true },
      { key: "cargo", label: "Cargo", type: "text", required: true },
      { key: "salarioMensual", label: "Salario mensual HNL", type: "number", required: true },
      { key: "estado", label: "Estado", type: "select", required: true, options: ["Activo", "Inactivo"] },
    ],
    seed: [
      { id: "E-001", nombre: "Roberto Mendez", cargo: "Jefe de Campo", salarioMensual: 8500, estado: "Activo" },
      { id: "E-002", nombre: "Sofia Torres", cargo: "Agronoma", salarioMensual: 12000, estado: "Activo" },
    ],
  },
  finanzas: {
    key: "finanzas",
    title: "Finanzas",
    subtitle: "Administrativo · Ingresos y egresos",
    entityLabel: "Transaccion",
    icon: "finanzas",
    searchKeys: ["concepto", "categoria", "tipo"],
    statusKey: "tipo",
    tableFields: ["concepto", "categoria", "tipo", "monto", "fecha"],
    fields: [
      { key: "concepto", label: "Concepto", type: "text", required: true },
      { key: "categoria", label: "Categoria", type: "text", required: true },
      { key: "tipo", label: "Tipo", type: "select", required: true, options: ["Ingreso", "Egreso"] },
      { key: "monto", label: "Monto HNL", type: "number", required: true },
      { key: "fecha", label: "Fecha", type: "date", required: true },
    ],
    seed: [
      { id: "T-001", concepto: "Venta Cosecha Maiz - Norte-08", categoria: "Venta", tipo: "Ingreso", monto: 128400, fecha: "2026-06-02" },
      { id: "T-002", concepto: "Fertilizante NPK", categoria: "Insumos", tipo: "Egreso", monto: 24800, fecha: "2026-06-01" },
    ],
  },
  alertas: {
    key: "alertas",
    title: "Notificaciones y Alertas",
    subtitle: "Tecnologico · Centro de notificaciones",
    entityLabel: "Alerta",
    icon: "alertas",
    searchKeys: ["tipo", "severidad", "mensaje", "zona"],
    statusKey: "severidad",
    tableFields: ["tipo", "severidad", "mensaje", "zona", "resuelta"],
    fields: [
      { key: "tipo", label: "Tipo", type: "text", required: true },
      { key: "severidad", label: "Severidad", type: "select", required: true, options: ["Baja", "Media", "Alta"] },
      { key: "mensaje", label: "Mensaje", type: "textarea", required: true },
      { key: "zona", label: "Zona", type: "text" },
      { key: "resuelta", label: "Estado", type: "select", required: true, options: ["Pendiente", "Resuelta"] },
    ],
    seed: [
      { id: "A-001", tipo: "Plaga", severidad: "Alta", mensaje: "Plaga detectada en parcela Valle-12.", zona: "Comayagua", resuelta: "Pendiente" },
      { id: "A-002", tipo: "Inventario", severidad: "Media", mensaje: "Stock bajo de herbicida.", zona: "Bodega Comayagua", resuelta: "Pendiente" },
    ],
  },
  reportes: {
    key: "reportes",
    title: "Reportes",
    subtitle: "Tecnologico · Informes, PDF, correo y descarga",
    entityLabel: "Reporte",
    icon: "reportes",
    searchKeys: ["titulo", "tipo", "formato", "estado", "destinatario"],
    statusKey: "estado",
    tableFields: ["titulo", "tipo", "fecha", "formato", "destinatario", "estado"],
    fields: [
      { key: "titulo", label: "Titulo", type: "text", required: true },
      { key: "tipo", label: "Tipo", type: "select", required: true, options: ["Produccion", "Inventario", "Finanzas", "Rendimiento", "RRHH", "Alertas"] },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "formato", label: "Formato", type: "select", required: true, options: ["PDF", "Excel"] },
      { key: "destinatario", label: "Correo destino", type: "text" },
      { key: "estado", label: "Estado", type: "select", required: true, options: ["Listo", "Generando", "Enviado"] },
      { key: "descripcion", label: "Descripcion", type: "textarea" },
    ],
    seed: [
      { id: "R-001", titulo: "Produccion Mensual Honduras", tipo: "Produccion", fecha: "2026-06-01", formato: "PDF", destinatario: "gerencia@empresa.hn", estado: "Listo", descripcion: "Toneladas por parcela y rendimiento." },
      { id: "R-002", titulo: "Inventario Agricola", tipo: "Inventario", fecha: "2026-06-15", formato: "PDF", destinatario: "bodega@empresa.hn", estado: "Listo", descripcion: "Stock actual, minimos y alertas." },
    ],
  },
};
