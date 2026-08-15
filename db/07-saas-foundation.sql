CREATE TABLE IF NOT EXISTS membresias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  rol VARCHAR(40) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Invitada','Activa','Suspendida','Revocada')),
  invitado_por VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, empresa_id)
);

INSERT INTO membresias (usuario_id, empresa_id, rol, estado)
SELECT id, empresa_id, rol, 'Activa'
FROM usuarios
ON CONFLICT (usuario_id, empresa_id) DO UPDATE SET rol = EXCLUDED.rol, estado = 'Activa';

CREATE OR REPLACE FUNCTION sincronizar_membresia_usuario()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.empresa_id <> NEW.empresa_id THEN
    UPDATE membresias SET estado = 'Revocada', actualizada_en = CURRENT_TIMESTAMP
    WHERE usuario_id = NEW.id AND empresa_id = OLD.empresa_id;
  END IF;
  INSERT INTO membresias (usuario_id, empresa_id, rol, estado)
  VALUES (NEW.id, NEW.empresa_id, CASE WHEN NEW.rol = 'Administrador' THEN 'admin' ELSE 'member' END, CASE WHEN NEW.estado = 'Activo' THEN 'Activa' ELSE 'Suspendida' END)
  ON CONFLICT (usuario_id, empresa_id) DO UPDATE
    SET rol = EXCLUDED.rol, estado = EXCLUDED.estado, actualizada_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS usuarios_membresia_after_write ON usuarios;
CREATE TRIGGER usuarios_membresia_after_write
AFTER INSERT OR UPDATE OF empresa_id, rol, estado ON usuarios
FOR EACH ROW EXECUTE FUNCTION sincronizar_membresia_usuario();

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado_en TIMESTAMPTZ NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS platform_role VARCHAR(30) NOT NULL DEFAULT 'none';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_habilitado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_secret_encrypted TEXT NULL;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug VARCHAR(120) NULL;

UPDATE usuarios SET email_verificado_en = COALESCE(email_verificado_en, fecha_creacion, CURRENT_TIMESTAMP);
UPDATE usuarios SET platform_role = 'platform_admin' WHERE rol = 'Administrador IT' AND platform_role = 'none';
UPDATE empresas SET slug = LOWER(REPLACE(codigo, '-', '')) WHERE slug IS NULL;

CREATE OR REPLACE FUNCTION asignar_slug_empresa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR BTRIM(NEW.slug) = '' THEN
    NEW.slug := TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(NEW.nombre), '[^a-z0-9]+', '-', 'g')) || '-' || LOWER(SUBSTRING(NEW.id FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS empresas_slug_before_write ON empresas;
CREATE TRIGGER empresas_slug_before_write
BEFORE INSERT OR UPDATE OF nombre, slug ON empresas
FOR EACH ROW EXECUTE FUNCTION asignar_slug_empresa();

ALTER TABLE empresas ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_platform_role_check') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_platform_role_check CHECK (platform_role IN ('none','platform_support','platform_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empresas_slug_key') THEN
    ALTER TABLE empresas ADD CONSTRAINT empresas_slug_key UNIQUE (slug);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  email_destino VARCHAR(255) NOT NULL,
  email_hash VARCHAR(64) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  rol VARCHAR(40) NOT NULL,
  departamento VARCHAR(30) NOT NULL,
  invitado_por VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  expira_en TIMESTAMPTZ NOT NULL,
  aceptada_en TIMESTAMPTZ NULL,
  revocada_en TIMESTAMPTZ NULL,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_empresa_estado ON invitaciones (empresa_id, expira_en DESC);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email_hash ON invitaciones (email_hash);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  tipo VARCHAR(24) NOT NULL CHECK (tipo IN ('email_verification','password_reset')),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_usuario_tipo ON auth_tokens (usuario_id, tipo, expira_en DESC);

CREATE TABLE IF NOT EXISTS sesiones (
  id_hash VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_agent_hash VARCHAR(64) NULL,
  ip_hash VARCHAR(64) NULL,
  dispositivo VARCHAR(120) NULL,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_uso_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_en TIMESTAMPTZ NOT NULL,
  revocada_en TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_activas ON sesiones (usuario_id, expira_en DESC) WHERE revocada_en IS NULL;

CREATE TABLE IF NOT EXISTS eventos_seguridad (
  id BIGSERIAL PRIMARY KEY,
  empresa_id VARCHAR(36) NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE SET NULL,
  actor_usuario_id VARCHAR(36) NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  accion VARCHAR(80) NOT NULL,
  objetivo_tipo VARCHAR(50) NULL,
  objetivo_id VARCHAR(36) NULL,
  resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('exito','rechazado','error')),
  trace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  ip_hash VARCHAR(64) NULL,
  metadata JSONB NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_seguridad_empresa_fecha ON eventos_seguridad (empresa_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_seguridad_actor_fecha ON eventos_seguridad (actor_usuario_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS outbox_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id VARCHAR(36) NOT NULL,
  tema VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  publicado_en TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_empresa_fecha ON outbox_eventos (empresa_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS planes (
  id VARCHAR(30) PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO planes (id, nombre) VALUES ('starter','Starter'),('pro','Pro'),('enterprise','Enterprise') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id VARCHAR(36) NOT NULL UNIQUE REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  plan_id VARCHAR(30) NOT NULL REFERENCES planes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  proveedor VARCHAR(30) NULL,
  proveedor_cliente_id VARCHAR(120) NULL,
  proveedor_suscripcion_id VARCHAR(120) NULL UNIQUE,
  estado VARCHAR(30) NOT NULL DEFAULT 'trialing',
  periodo_finaliza_en TIMESTAMPTZ NULL,
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO suscripciones (empresa_id, plan_id, estado)
SELECT id, LOWER(plan), 'active' FROM empresas
ON CONFLICT (empresa_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS derechos (
  empresa_id VARCHAR(36) NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  feature_key VARCHAR(80) NOT NULL,
  limite INTEGER NULL,
  fuente VARCHAR(30) NOT NULL DEFAULT 'plan',
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (empresa_id, feature_key)
);

CREATE OR REPLACE FUNCTION agrosync_tenant_id()
RETURNS VARCHAR
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_empresa_id', true), '')::VARCHAR
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'empleados','parcelas','cultivos','cosechas','inventario_items','finanzas_transacciones',
    'alertas','reportes','comunicacion_envios','auditoria_eventos'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS agrosync_tenant_policy ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY agrosync_tenant_policy ON %I USING (empresa_id = agrosync_tenant_id()) WITH CHECK (empresa_id = agrosync_tenant_id())',
      table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION notify_agrosync_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  record_id TEXT;
  company_id TEXT;
  event_id UUID;
  event_payload JSONB;
BEGIN
  record_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT ELSE NEW.id::TEXT END;
  IF TG_TABLE_NAME = 'empresas' THEN
    company_id := record_id;
  ELSIF TG_OP = 'DELETE' THEN
    company_id := OLD.empresa_id::TEXT;
  ELSE
    company_id := NEW.empresa_id::TEXT;
  END IF;
  event_id := gen_random_uuid();
  event_payload := jsonb_build_object(
    'eventId', event_id,
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'id', record_id,
    'companyId', company_id
  );
  INSERT INTO outbox_eventos (id, empresa_id, tema, payload, publicado_en)
  VALUES (event_id, company_id, 'resource.changed', event_payload, CURRENT_TIMESTAMP);
  PERFORM pg_notify('agrosync_changes', event_payload::TEXT);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
