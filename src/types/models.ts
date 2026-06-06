/**
 * AgroSync Data Models
 * These TypeScript interfaces mirror the MySQL schema that will be used in production.
 *
 * MySQL migration note:
 *   - Replace useLocalDB hooks with fetch() calls to your REST/GraphQL API
 *   - All IDs will become AUTO_INCREMENT INT or UUID in MySQL
 *   - Timestamps become DATETIME columns
 */

export type PlanTipo = "Starter" | "Pro" | "Enterprise";
export type EstadoEmpresa = "Activa" | "Inactiva" | "Suspendida";
export type RolUsuario =
  | "Administrador"
  | "Gerente de Campo"
  | "Supervisor"
  | "Operador"
  | "Analista"
  | "Jornalero";
export type EstadoUsuario = "Activo" | "Inactivo" | "Suspendido";

// ─── Empresa ──────────────────────────────────────────────────────────────────
// MySQL: CREATE TABLE empresas (id VARCHAR(36) PRIMARY KEY, nombre VARCHAR(255), ...)
export interface Empresa {
  id: string;
  nombre: string;
  nit: string;          // NIT / RUC / RFC
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  pais: string;
  plan: PlanTipo;
  estado: EstadoEmpresa;
  fechaRegistro: string;  // ISO 8601 — MySQL DATETIME
  totalUsuarios?: number;
  totalParcelas?: number;
  notas?: string;
}

// ─── Usuario ──────────────────────────────────────────────────────────────────
// MySQL: CREATE TABLE usuarios (id VARCHAR(36) PRIMARY KEY, empresa_id VARCHAR(36) REFERENCES empresas(id), ...)
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: RolUsuario;
  empresaId: string;     // FK → empresas.id
  estado: EstadoUsuario;
  fechaCreacion: string; // ISO 8601 — MySQL DATETIME
  ultimoAcceso?: string;
  notas?: string;
}

// ─── Seed Data (Demo) ─────────────────────────────────────────────────────────
export const seedEmpresas: Empresa[] = [
  {
    id: "EMP-001",
    nombre: "AgroSur S.A.",
    nit: "900-123-456-7",
    email: "contacto@agrosur.com",
    telefono: "+57 601 234 5678",
    direccion: "Av. Principal 1200, Piso 3",
    ciudad: "Bogotá",
    pais: "Colombia",
    plan: "Enterprise",
    estado: "Activa",
    fechaRegistro: "2024-01-15T08:00:00.000Z",
    totalUsuarios: 48,
    totalParcelas: 22,
    notas: "Cliente premium desde 2024. Contrato anual renovado.",
  },
  {
    id: "EMP-002",
    nombre: "Finca El Progreso",
    nit: "800-987-654-3",
    email: "admin@elprogreso.com",
    telefono: "+57 312 456 7890",
    direccion: "Vereda El Carmen, Km 12",
    ciudad: "Medellín",
    pais: "Colombia",
    plan: "Pro",
    estado: "Activa",
    fechaRegistro: "2024-03-20T10:30:00.000Z",
    totalUsuarios: 12,
    totalParcelas: 8,
    notas: "",
  },
  {
    id: "EMP-003",
    nombre: "Cooperativa Verde",
    nit: "700-456-123-9",
    email: "info@cooperativaverde.com",
    telefono: "+57 315 789 0123",
    direccion: "Calle 45 # 22-10",
    ciudad: "Cali",
    pais: "Colombia",
    plan: "Pro",
    estado: "Activa",
    fechaRegistro: "2024-06-01T09:00:00.000Z",
    totalUsuarios: 31,
    totalParcelas: 17,
    notas: "",
  },
  {
    id: "EMP-004",
    nombre: "Hacienda Los Pinos",
    nit: "650-321-789-1",
    email: "gerencia@lospinos.com",
    telefono: "+57 320 123 4567",
    direccion: "Finca Los Pinos, Vereda Alta",
    ciudad: "Manizales",
    pais: "Colombia",
    plan: "Starter",
    estado: "Inactiva",
    fechaRegistro: "2025-01-10T11:00:00.000Z",
    totalUsuarios: 5,
    totalParcelas: 3,
    notas: "Cuenta en pausa por revisión de contrato.",
  },
];

export const seedUsuarios: Usuario[] = [
  {
    id: "USR-001",
    nombre: "Juan",
    apellido: "Martínez",
    email: "juan@agrosur.com",
    telefono: "+57 312 111 2222",
    rol: "Administrador",
    empresaId: "EMP-001",
    estado: "Activo",
    fechaCreacion: "2024-01-15T08:00:00.000Z",
    ultimoAcceso: new Date().toISOString(),
    notas: "Administrador principal de AgroSur.",
  },
  {
    id: "USR-002",
    nombre: "María",
    apellido: "López",
    email: "maria@elprogreso.com",
    telefono: "+57 315 222 3333",
    rol: "Gerente de Campo",
    empresaId: "EMP-002",
    estado: "Activo",
    fechaCreacion: "2024-03-20T10:30:00.000Z",
    ultimoAcceso: new Date(Date.now() - 3600000).toISOString(),
    notas: "",
  },
  {
    id: "USR-003",
    nombre: "Carlos",
    apellido: "Rodríguez",
    email: "carlos@agrosur.com",
    telefono: "+57 318 333 4444",
    rol: "Operador",
    empresaId: "EMP-001",
    estado: "Activo",
    fechaCreacion: "2024-02-10T09:00:00.000Z",
    ultimoAcceso: new Date(Date.now() - 86400000).toISOString(),
    notas: "",
  },
  {
    id: "USR-004",
    nombre: "Ana",
    apellido: "García",
    email: "ana@cooperativaverde.com",
    telefono: "+57 320 444 5555",
    rol: "Analista",
    empresaId: "EMP-003",
    estado: "Inactivo",
    fechaCreacion: "2024-06-01T09:00:00.000Z",
    ultimoAcceso: new Date(Date.now() - 432000000).toISOString(),
    notas: "Usuario inactivo temporalmente.",
  },
  {
    id: "USR-005",
    nombre: "Pedro",
    apellido: "Sánchez",
    email: "pedro@elprogreso.com",
    telefono: "+57 316 555 6666",
    rol: "Supervisor",
    empresaId: "EMP-002",
    estado: "Activo",
    fechaCreacion: "2024-04-05T08:00:00.000Z",
    ultimoAcceso: new Date().toISOString(),
    notas: "",
  },
];

