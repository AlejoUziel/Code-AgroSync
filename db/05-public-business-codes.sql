CREATE SEQUENCE IF NOT EXISTS empresas_codigo_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS usuarios_codigo_seq START WITH 1;

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);

UPDATE empresas
SET codigo = id
WHERE codigo IS NULL AND id ~ '^EMP-[0-9]{3,}$';

UPDATE usuarios
SET codigo = id
WHERE codigo IS NULL AND id ~ '^USR-[0-9]{3,}$';

DO $$
DECLARE
  ultimo BIGINT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(codigo FROM '[0-9]+$')::BIGINT), 0)
  INTO ultimo
  FROM empresas
  WHERE codigo ~ '^EMP-[0-9]{3,}$';
  PERFORM setval('empresas_codigo_seq', GREATEST(ultimo, 1), ultimo > 0);
END;
$$;

DO $$
DECLARE
  ultimo BIGINT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(codigo FROM '[0-9]+$')::BIGINT), 0)
  INTO ultimo
  FROM usuarios
  WHERE codigo ~ '^USR-[0-9]{3,}$';
  PERFORM setval('usuarios_codigo_seq', GREATEST(ultimo, 1), ultimo > 0);
END;
$$;

UPDATE empresas
SET codigo = 'EMP-' || LPAD(nextval('empresas_codigo_seq')::TEXT, 3, '0')
WHERE codigo IS NULL;

UPDATE usuarios
SET codigo = 'USR-' || LPAD(nextval('usuarios_codigo_seq')::TEXT, 3, '0')
WHERE codigo IS NULL;

ALTER TABLE empresas
  ALTER COLUMN codigo SET DEFAULT ('EMP-' || LPAD(nextval('empresas_codigo_seq')::TEXT, 3, '0')),
  ALTER COLUMN codigo SET NOT NULL;

ALTER TABLE usuarios
  ALTER COLUMN codigo SET DEFAULT ('USR-' || LPAD(nextval('usuarios_codigo_seq')::TEXT, 3, '0')),
  ALTER COLUMN codigo SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empresas_codigo_key') THEN
    ALTER TABLE empresas ADD CONSTRAINT empresas_codigo_key UNIQUE (codigo);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_codigo_key') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_codigo_key UNIQUE (codigo);
  END IF;
END;
$$;
