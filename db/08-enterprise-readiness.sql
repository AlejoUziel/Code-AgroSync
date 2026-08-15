ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_pending_secret_encrypted TEXT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_recovery_codes_hashes JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_confirmado_en TIMESTAMPTZ NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_last_used_step BIGINT NULL;

CREATE TABLE IF NOT EXISTS auth_mfa_challenges (
  id_hash VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ NULL,
  intentos INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_mfa_challenges_usuario
  ON auth_mfa_challenges (usuario_id, expira_en DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_invitaciones_activas_empresa_email
  ON invitaciones (empresa_id, email_hash)
  WHERE aceptada_en IS NULL AND revocada_en IS NULL;

ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS proveedor_price_id VARCHAR(120) NULL;
ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS cancelar_fin_periodo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS periodo_inicia_en TIMESTAMPTZ NULL;
ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS trial_finaliza_en TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS billing_eventos (
  proveedor VARCHAR(30) NOT NULL,
  evento_id VARCHAR(160) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  procesado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payload_hash VARCHAR(64) NOT NULL,
  PRIMARY KEY (proveedor, evento_id)
);

CREATE TABLE IF NOT EXISTS continuidad_simulacros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('PITR','LOGICAL_RESTORE')),
  entorno VARCHAR(30) NOT NULL,
  punto_objetivo TIMESTAMPTZ NULL,
  iniciado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizado_en TIMESTAMPTZ NULL,
  resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('iniciado','aprobado','fallido')),
  rto_segundos INTEGER NULL,
  rpo_segundos INTEGER NULL,
  evidencia JSONB NULL
);

CREATE INDEX IF NOT EXISTS idx_continuidad_simulacros_fecha
  ON continuidad_simulacros (iniciado_en DESC);

CREATE TABLE IF NOT EXISTS email_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id VARCHAR(36) NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE SET NULL,
  destinatario_hash VARCHAR(64) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  proveedor_message_id VARCHAR(200) NULL,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('enviado','fallido')),
  error_codigo VARCHAR(80) NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_envios_empresa_fecha
  ON email_envios (empresa_id, creado_en DESC);

INSERT INTO derechos (empresa_id, feature_key, limite, fuente)
SELECT id, 'usuarios', CASE LOWER(plan) WHEN 'starter' THEN 5 WHEN 'pro' THEN 25 ELSE NULL END, 'plan'
FROM empresas
ON CONFLICT (empresa_id, feature_key) DO UPDATE
SET limite = EXCLUDED.limite, fuente = EXCLUDED.fuente, actualizada_en = CURRENT_TIMESTAMP;

INSERT INTO derechos (empresa_id, feature_key, limite, fuente)
SELECT id, 'parcelas', CASE LOWER(plan) WHEN 'starter' THEN 10 WHEN 'pro' THEN 100 ELSE NULL END, 'plan'
FROM empresas
ON CONFLICT (empresa_id, feature_key) DO UPDATE
SET limite = EXCLUDED.limite, fuente = EXCLUDED.fuente, actualizada_en = CURRENT_TIMESTAMP;

INSERT INTO derechos (empresa_id, feature_key, limite, fuente)
SELECT id, 'reportes_pdf', CASE LOWER(plan) WHEN 'starter' THEN 10 WHEN 'pro' THEN 100 ELSE NULL END, 'plan'
FROM empresas
ON CONFLICT (empresa_id, feature_key) DO UPDATE
SET limite = EXCLUDED.limite, fuente = EXCLUDED.fuente, actualizada_en = CURRENT_TIMESTAMP;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['invitaciones','suscripciones','derechos']
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

