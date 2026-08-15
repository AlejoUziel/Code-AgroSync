CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SEQUENCE IF NOT EXISTS empresas_codigo_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS usuarios_codigo_seq START WITH 1;

CREATE TABLE IF NOT EXISTS empresas (
  id VARCHAR(36) PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE DEFAULT ('EMP-' || LPAD(nextval('empresas_codigo_seq')::TEXT, 3, '0')),
  nombre VARCHAR(255) NOT NULL,
  nit VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(64) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  ciudad VARCHAR(120) NOT NULL,
  pais VARCHAR(120) NOT NULL DEFAULT 'Honduras',
  plan VARCHAR(20) NOT NULL DEFAULT 'Starter' CHECK (plan IN ('Starter','Pro','Enterprise')),
  estado VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa','Inactiva','Suspendida')),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas TEXT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE DEFAULT ('USR-' || LPAD(nextval('usuarios_codigo_seq')::TEXT, 3, '0')),
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  nombre VARCHAR(120) NOT NULL,
  apellido VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(64) NOT NULL,
  rol VARCHAR(40) NOT NULL CHECK (rol IN ('Administrador','Administrador IT','Gerente de Campo','Supervisor','Operador','Analista','Jornalero')),
  departamento VARCHAR(30) NOT NULL DEFAULT 'Administrativo' CHECK (departamento IN ('AdministradorIT','Administrativo','Operativo','Tecnologico')),
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo','Suspendido')),
  password_hash VARCHAR(255) NOT NULL,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_en TIMESTAMPTZ NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMPTZ NULL,
  session_version INTEGER NOT NULL DEFAULT 1,
  notas TEXT NULL
);

CREATE TABLE IF NOT EXISTS empleados (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  usuario_id VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  nombre VARCHAR(180) NOT NULL,
  cargo VARCHAR(120) NOT NULL,
  salario_mensual_hnl NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo'))
);

CREATE TABLE IF NOT EXISTS parcelas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  nombre VARCHAR(120) NOT NULL,
  zona VARCHAR(120) NOT NULL,
  hectareas NUMERIC(10,2) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa','Alerta','En Preparacion','En Descanso')),
  centro geometry(Point,4326) NOT NULL,
  poligono geometry(Polygon,4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parcelas_centro ON parcelas USING GIST (centro);
CREATE INDEX IF NOT EXISTS idx_parcelas_poligono ON parcelas USING GIST (poligono);

CREATE TABLE IF NOT EXISTS cultivos (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  parcela_id VARCHAR(36) NOT NULL REFERENCES parcelas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  nombre VARCHAR(180) NOT NULL,
  fecha_siembra DATE NOT NULL,
  fecha_cosecha_estimada DATE NULL,
  etapa VARCHAR(80) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo','En Progreso','Alerta','Cosechado'))
);

CREATE TABLE IF NOT EXISTS cosechas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  cultivo_id VARCHAR(36) NOT NULL REFERENCES cultivos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  toneladas NUMERIC(12,2) NOT NULL,
  calidad VARCHAR(20) NOT NULL DEFAULT 'Estandar' CHECK (calidad IN ('Premium','Estandar','Baja'))
);

CREATE TABLE IF NOT EXISTS inventario_items (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  nombre VARCHAR(180) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidad VARCHAR(24) NOT NULL,
  stock_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
  costo_unitario_hnl NUMERIC(12,2) NOT NULL DEFAULT 0,
  ubicacion VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS finanzas_transacciones (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  concepto VARCHAR(255) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Ingreso','Egreso')),
  monto_hnl NUMERIC(14,2) NOT NULL,
  fecha DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS alertas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  parcela_id VARCHAR(36) NULL REFERENCES parcelas(id) ON UPDATE CASCADE ON DELETE SET NULL,
  tipo VARCHAR(80) NOT NULL,
  severidad VARCHAR(20) NOT NULL CHECK (severidad IN ('Baja','Media','Alta')),
  mensaje VARCHAR(255) NOT NULL,
  resuelta BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reportes (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  titulo VARCHAR(180) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  fecha DATE NOT NULL,
  formato VARCHAR(20) NOT NULL DEFAULT 'PDF' CHECK (formato IN ('PDF','Excel')),
  destinatario VARCHAR(255) NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Listo' CHECK (estado IN ('Listo','Generando','Enviado')),
  descripcion TEXT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comunicacion_envios (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  recurso VARCHAR(40) NOT NULL,
  recurso_id VARCHAR(36) NOT NULL,
  canal VARCHAR(20) NOT NULL CHECK (canal IN ('Correo','WhatsApp','Descarga')),
  destino VARCHAR(255) NULL,
  asunto VARCHAR(180) NULL,
  mensaje TEXT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Endurecimiento de seguridad, trazabilidad e integridad para instalaciones nuevas y existentes.
ALTER TABLE parcelas ADD COLUMN IF NOT EXISTS cultivo VARCHAR(180) NOT NULL DEFAULT 'Sin cultivo';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'Completada';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cosechas_estado_check') THEN
    ALTER TABLE cosechas ADD CONSTRAINT cosechas_estado_check CHECK (estado IN ('Programada','En Proceso','Completada'));
  END IF;
END;
$$;

ALTER TABLE parcelas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE parcelas ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE cultivos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE cultivos ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE finanzas_transacciones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE finanzas_transacciones ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id BIGSERIAL PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  usuario_id VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  recurso VARCHAR(40) NOT NULL,
  registro_id VARCHAR(36) NOT NULL,
  accion VARCHAR(12) NOT NULL CHECK (accion IN ('CREATE','UPDATE','DELETE')),
  datos_anteriores JSONB NULL,
  datos_nuevos JSONB NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash VARCHAR(64) PRIMARY KEY,
  intentos INTEGER NOT NULL DEFAULT 0,
  ventana_iniciada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bloqueado_hasta TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios (empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sesion_activa ON usuarios (id, session_version) WHERE estado = 'Activo';

UPDATE parcelas p
SET cultivo = (
  SELECT c.nombre
  FROM cultivos c
  WHERE c.parcela_id = p.id AND c.deleted_at IS NULL
  ORDER BY c.fecha_siembra DESC, c.id DESC
  LIMIT 1
)
WHERE p.cultivo = 'Sin cultivo'
  AND EXISTS (SELECT 1 FROM cultivos c WHERE c.parcela_id = p.id AND c.deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_empleados_empresa_activos ON empleados (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_parcelas_empresa_activas ON parcelas (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cultivos_empresa_activos ON cultivos (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cosechas_empresa_activas ON cosechas (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventario_empresa_activo ON inventario_items (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finanzas_empresa_activas ON finanzas_transacciones (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alertas_empresa_activas ON alertas (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reportes_empresa_activos ON reportes (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa_fecha ON auditoria_eventos (empresa_id, creado_en DESC);
