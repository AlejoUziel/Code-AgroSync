CREATE SEQUENCE IF NOT EXISTS agrosync_parcelas_id_seq;
CREATE SEQUENCE IF NOT EXISTS agrosync_cultivos_id_seq;
CREATE SEQUENCE IF NOT EXISTS agrosync_inventario_id_seq;
CREATE SEQUENCE IF NOT EXISTS agrosync_cosechas_id_seq;
CREATE SEQUENCE IF NOT EXISTS agrosync_empleados_id_seq;
CREATE SEQUENCE IF NOT EXISTS agrosync_finanzas_id_seq;
CREATE SEQUENCE IF NOT EXISTS agrosync_alertas_id_seq;
CREATE SEQUENCE IF NOT EXISTS agrosync_reportes_id_seq;

SELECT setval(
  'agrosync_parcelas_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM parcelas), 0), 1),
  EXISTS (SELECT 1 FROM parcelas WHERE id ~ '\d+$')
);
SELECT setval(
  'agrosync_cultivos_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM cultivos), 0), 1),
  EXISTS (SELECT 1 FROM cultivos WHERE id ~ '\d+$')
);
SELECT setval(
  'agrosync_inventario_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM inventario_items), 0), 1),
  EXISTS (SELECT 1 FROM inventario_items WHERE id ~ '\d+$')
);
SELECT setval(
  'agrosync_cosechas_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM cosechas), 0), 1),
  EXISTS (SELECT 1 FROM cosechas WHERE id ~ '\d+$')
);
SELECT setval(
  'agrosync_empleados_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM empleados), 0), 1),
  EXISTS (SELECT 1 FROM empleados WHERE id ~ '\d+$')
);
SELECT setval(
  'agrosync_finanzas_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM finanzas_transacciones), 0), 1),
  EXISTS (SELECT 1 FROM finanzas_transacciones WHERE id ~ '\d+$')
);
SELECT setval(
  'agrosync_alertas_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM alertas), 0), 1),
  EXISTS (SELECT 1 FROM alertas WHERE id ~ '\d+$')
);
SELECT setval(
  'agrosync_reportes_id_seq',
  GREATEST(COALESCE((SELECT MAX((regexp_match(id, '(\d+)$'))[1]::BIGINT) FROM reportes), 0), 1),
  EXISTS (SELECT 1 FROM reportes WHERE id ~ '\d+$')
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agrosync_app') THEN
    GRANT USAGE, SELECT ON SEQUENCE
      agrosync_parcelas_id_seq,
      agrosync_cultivos_id_seq,
      agrosync_inventario_id_seq,
      agrosync_cosechas_id_seq,
      agrosync_empleados_id_seq,
      agrosync_finanzas_id_seq,
      agrosync_alertas_id_seq,
      agrosync_reportes_id_seq
    TO agrosync_app;
  END IF;
END;
$$;
