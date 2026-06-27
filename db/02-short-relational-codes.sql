USE agrosync;

START TRANSACTION;

CREATE TEMPORARY TABLE tmp_id_map (
  table_name VARCHAR(64) NOT NULL,
  old_id VARCHAR(36) NOT NULL,
  new_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (table_name, old_id),
  UNIQUE KEY uq_tmp_id_map_new (table_name, new_id)
);

INSERT INTO tmp_id_map (table_name, old_id, new_id)
SELECT 'empresas', id, CONCAT('EMP-', LPAD(offsets.last_number + ROW_NUMBER() OVER (ORDER BY fecha_registro, nombre), 3, '0'))
FROM empresas
JOIN (
  SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(id, '-', -1) AS UNSIGNED)), 0) AS last_number
  FROM empresas
  WHERE id REGEXP '^EMP-[0-9]{3}$'
) offsets
WHERE id NOT REGEXP '^EMP-[0-9]{3}$';

UPDATE empresas e
JOIN tmp_id_map m ON m.table_name = 'empresas' AND m.old_id = e.id
SET e.id = m.new_id;

DELETE FROM tmp_id_map;

INSERT INTO tmp_id_map (table_name, old_id, new_id)
SELECT 'parcelas', old_id, CONCAT('PAR-', src.crop_code, '-', LPAD(COALESCE(offsets.last_number, 0) + ROW_NUMBER() OVER (PARTITION BY src.crop_code ORDER BY src.nombre), 3, '0'))
FROM (
  SELECT
    p.id AS old_id,
    p.nombre,
    CASE
      WHEN LOWER(COALESCE(c.nombre, p.nombre)) LIKE '%maiz%' THEN 'MAI'
      WHEN LOWER(COALESCE(c.nombre, p.nombre)) LIKE '%cafe%' THEN 'CAF'
      WHEN LOWER(COALESCE(c.nombre, p.nombre)) LIKE '%frijol%' THEN 'FRI'
      WHEN LOWER(COALESCE(c.nombre, p.nombre)) LIKE '%sorgo%' THEN 'SOR'
      WHEN LOWER(COALESCE(c.nombre, p.nombre)) LIKE '%palma%' THEN 'PAL'
      WHEN LOWER(COALESCE(c.nombre, p.nombre)) LIKE '%arroz%' THEN 'ARR'
      ELSE COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(COALESCE(c.nombre, p.nombre), '[^[:alnum:]]', ''), 3)), ''), 'GEN')
    END AS crop_code
  FROM parcelas p
  LEFT JOIN (
    SELECT parcela_id, MIN(nombre) AS nombre
    FROM cultivos
    GROUP BY parcela_id
  ) c ON c.parcela_id = p.id
  WHERE p.id NOT REGEXP '^PAR-[A-Z0-9]{3}-[0-9]{3}$'
) src
LEFT JOIN (
  SELECT
    SUBSTRING_INDEX(SUBSTRING_INDEX(id, '-', 2), '-', -1) AS crop_code,
    MAX(CAST(SUBSTRING_INDEX(id, '-', -1) AS UNSIGNED)) AS last_number
  FROM parcelas
  WHERE id REGEXP '^PAR-[A-Z0-9]{3}-[0-9]{3}$'
  GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(id, '-', 2), '-', -1)
) offsets ON offsets.crop_code = src.crop_code;

UPDATE parcelas p
JOIN tmp_id_map m ON m.table_name = 'parcelas' AND m.old_id = p.id
SET p.id = m.new_id;

DELETE FROM tmp_id_map;

INSERT INTO tmp_id_map (table_name, old_id, new_id)
SELECT 'cultivos', old_id, CONCAT('CUL-', src.crop_code, '-', LPAD(COALESCE(offsets.last_number, 0) + ROW_NUMBER() OVER (PARTITION BY src.crop_code ORDER BY src.fecha_siembra, src.nombre), 3, '0'))
FROM (
  SELECT
    id AS old_id,
    nombre,
    fecha_siembra,
    CASE
      WHEN LOWER(nombre) LIKE '%maiz%' THEN 'MAI'
      WHEN LOWER(nombre) LIKE '%cafe%' THEN 'CAF'
      WHEN LOWER(nombre) LIKE '%frijol%' THEN 'FRI'
      WHEN LOWER(nombre) LIKE '%sorgo%' THEN 'SOR'
      WHEN LOWER(nombre) LIKE '%palma%' THEN 'PAL'
      WHEN LOWER(nombre) LIKE '%arroz%' THEN 'ARR'
      ELSE COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(nombre, '[^[:alnum:]]', ''), 3)), ''), 'GEN')
    END AS crop_code
  FROM cultivos
  WHERE id NOT REGEXP '^CUL-[A-Z0-9]{3}-[0-9]{3}$'
) src
LEFT JOIN (
  SELECT
    SUBSTRING_INDEX(SUBSTRING_INDEX(id, '-', 2), '-', -1) AS crop_code,
    MAX(CAST(SUBSTRING_INDEX(id, '-', -1) AS UNSIGNED)) AS last_number
  FROM cultivos
  WHERE id REGEXP '^CUL-[A-Z0-9]{3}-[0-9]{3}$'
  GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(id, '-', 2), '-', -1)
) offsets ON offsets.crop_code = src.crop_code;

UPDATE cultivos c
JOIN tmp_id_map m ON m.table_name = 'cultivos' AND m.old_id = c.id
SET c.id = m.new_id;

DELETE FROM tmp_id_map;

INSERT INTO tmp_id_map (table_name, old_id, new_id)
SELECT 'cosechas', old_id, CONCAT('COS-', src.crop_code, '-', LPAD(COALESCE(offsets.last_number, 0) + ROW_NUMBER() OVER (PARTITION BY src.crop_code ORDER BY src.fecha, src.old_id), 3, '0'))
FROM (
  SELECT
    h.id AS old_id,
    h.fecha,
    CASE
      WHEN LOWER(COALESCE(c.nombre, h.id)) LIKE '%maiz%' THEN 'MAI'
      WHEN LOWER(COALESCE(c.nombre, h.id)) LIKE '%cafe%' THEN 'CAF'
      WHEN LOWER(COALESCE(c.nombre, h.id)) LIKE '%frijol%' THEN 'FRI'
      WHEN LOWER(COALESCE(c.nombre, h.id)) LIKE '%sorgo%' THEN 'SOR'
      WHEN LOWER(COALESCE(c.nombre, h.id)) LIKE '%palma%' THEN 'PAL'
      WHEN LOWER(COALESCE(c.nombre, h.id)) LIKE '%arroz%' THEN 'ARR'
      ELSE COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(COALESCE(c.nombre, h.id), '[^[:alnum:]]', ''), 3)), ''), 'GEN')
    END AS crop_code
  FROM cosechas h
  LEFT JOIN cultivos c ON c.id = h.cultivo_id
  WHERE h.id NOT REGEXP '^COS-[A-Z0-9]{3}-[0-9]{3}$'
) src
LEFT JOIN (
  SELECT
    SUBSTRING_INDEX(SUBSTRING_INDEX(id, '-', 2), '-', -1) AS crop_code,
    MAX(CAST(SUBSTRING_INDEX(id, '-', -1) AS UNSIGNED)) AS last_number
  FROM cosechas
  WHERE id REGEXP '^COS-[A-Z0-9]{3}-[0-9]{3}$'
  GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(id, '-', 2), '-', -1)
) offsets ON offsets.crop_code = src.crop_code;

UPDATE cosechas h
JOIN tmp_id_map m ON m.table_name = 'cosechas' AND m.old_id = h.id
SET h.id = m.new_id;

DROP TEMPORARY TABLE tmp_id_map;

COMMIT;
