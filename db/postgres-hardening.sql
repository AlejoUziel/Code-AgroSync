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
