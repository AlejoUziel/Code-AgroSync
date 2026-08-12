CREATE OR REPLACE FUNCTION notify_agrosync_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  record_id text;
  company_id text;
BEGIN
  record_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END;
  IF TG_TABLE_NAME = 'empresas' THEN
    company_id := record_id;
  ELSIF TG_OP = 'DELETE' THEN
    company_id := OLD.empresa_id::text;
  ELSE
    company_id := NEW.empresa_id::text;
  END IF;
  PERFORM pg_notify(
    'agrosync_changes',
    json_build_object('table', TG_TABLE_NAME, 'operation', TG_OP, 'id', record_id, 'companyId', company_id)::text
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'empresas', 'usuarios', 'empleados', 'parcelas', 'cultivos', 'cosechas',
    'inventario_items', 'finanzas_transacciones', 'alertas', 'reportes',
    'comunicacion_envios'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS agrosync_notify_change ON %I', table_name);
      EXECUTE format(
        'CREATE TRIGGER agrosync_notify_change AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION notify_agrosync_change()',
        table_name
      );
    END IF;
  END LOOP;
END;
$$;
