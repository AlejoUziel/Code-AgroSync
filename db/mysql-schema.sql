CREATE DATABASE IF NOT EXISTS agrosync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agrosync;

CREATE TABLE empresas (
  id VARCHAR(36) PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  nit VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(64) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  ciudad VARCHAR(120) NOT NULL,
  pais VARCHAR(120) NOT NULL DEFAULT 'Honduras',
  plan ENUM('Starter','Pro','Enterprise') NOT NULL DEFAULT 'Starter',
  estado ENUM('Activa','Inactiva','Suspendida') NOT NULL DEFAULT 'Activa',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas TEXT NULL
);

CREATE TABLE usuarios (
  id VARCHAR(36) PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  empresa_id VARCHAR(36) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  apellido VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(64) NOT NULL,
  rol ENUM('Administrador','Administrador IT','Gerente de Campo','Supervisor','Operador','Analista','Jornalero') NOT NULL,
  departamento ENUM('AdministradorIT','Administrativo','Operativo','Tecnologico') NOT NULL DEFAULT 'Administrativo',
  estado ENUM('Activo','Inactivo','Suspendido') NOT NULL DEFAULT 'Activo',
  password_hash VARCHAR(255) NOT NULL,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  bloqueado_en DATETIME NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso DATETIME NULL,
  notas TEXT NULL,
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE empleados (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NULL,
  nombre VARCHAR(180) NOT NULL,
  cargo VARCHAR(120) NOT NULL,
  salario_mensual_hnl DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  CONSTRAINT fk_empleados_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_empleados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE parcelas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  zona VARCHAR(120) NOT NULL,
  hectareas DECIMAL(10,2) NOT NULL,
  estado ENUM('Activa','Alerta','En Preparacion','En Descanso') NOT NULL DEFAULT 'Activa',
  centro POINT SRID 4326 NOT NULL,
  poligono POLYGON SRID 4326 NOT NULL,
  SPATIAL INDEX idx_parcelas_centro (centro),
  SPATIAL INDEX idx_parcelas_poligono (poligono),
  CONSTRAINT fk_parcelas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE cultivos (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  parcela_id VARCHAR(36) NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  fecha_siembra DATE NOT NULL,
  fecha_cosecha_estimada DATE NULL,
  etapa VARCHAR(80) NOT NULL,
  estado ENUM('Nuevo','En Progreso','Alerta','Cosechado') NOT NULL DEFAULT 'Nuevo',
  CONSTRAINT fk_cultivos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cultivos_parcela FOREIGN KEY (parcela_id) REFERENCES parcelas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE cosechas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  cultivo_id VARCHAR(36) NOT NULL,
  fecha DATE NOT NULL,
  toneladas DECIMAL(12,2) NOT NULL,
  calidad ENUM('Premium','Estandar','Baja') NOT NULL DEFAULT 'Estandar',
  CONSTRAINT fk_cosechas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cosechas_cultivo FOREIGN KEY (cultivo_id) REFERENCES cultivos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE inventario_items (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  unidad VARCHAR(24) NOT NULL,
  stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
  costo_unitario_hnl DECIMAL(12,2) NOT NULL DEFAULT 0,
  ubicacion VARCHAR(120) NOT NULL,
  CONSTRAINT fk_inventario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE finanzas_transacciones (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  tipo ENUM('Ingreso','Egreso') NOT NULL,
  monto_hnl DECIMAL(14,2) NOT NULL,
  fecha DATE NOT NULL,
  CONSTRAINT fk_finanzas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE alertas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  parcela_id VARCHAR(36) NULL,
  tipo VARCHAR(80) NOT NULL,
  severidad ENUM('Baja','Media','Alta') NOT NULL,
  mensaje VARCHAR(255) NOT NULL,
  resuelta BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alertas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_alertas_parcela FOREIGN KEY (parcela_id) REFERENCES parcelas(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE reportes (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  fecha DATE NOT NULL,
  formato ENUM('PDF','Excel') NOT NULL DEFAULT 'PDF',
  destinatario VARCHAR(255) NULL,
  estado ENUM('Listo','Generando','Enviado') NOT NULL DEFAULT 'Listo',
  descripcion TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reportes_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE comunicacion_envios (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  recurso VARCHAR(40) NOT NULL,
  recurso_id VARCHAR(36) NOT NULL,
  canal ENUM('Correo','WhatsApp','Descarga') NOT NULL,
  destino VARCHAR(255) NULL,
  asunto VARCHAR(180) NULL,
  mensaje TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunicacion_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);
