USE agrosync;

START TRANSACTION;

UPDATE parcelas p
JOIN cultivos c ON c.parcela_id = p.id
SET p.id = CONCAT('PAR-', COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(c.nombre, '[^[:alnum:]]', ''), 3)), ''), 'GEN'), '-', SUBSTRING_INDEX(p.id, '-', -1))
WHERE p.id REGEXP '^PAR-GEN-[0-9]{3}$';

UPDATE cultivos
SET id = CONCAT('CUL-', COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(nombre, '[^[:alnum:]]', ''), 3)), ''), 'GEN'), '-', SUBSTRING_INDEX(id, '-', -1))
WHERE id REGEXP '^CUL-GEN-[0-9]{3}$';

UPDATE cosechas h
JOIN cultivos c ON c.id = h.cultivo_id
SET h.id = CONCAT('COS-', COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(c.nombre, '[^[:alnum:]]', ''), 3)), ''), 'GEN'), '-', SUBSTRING_INDEX(h.id, '-', -1))
WHERE h.id REGEXP '^COS-GEN-[0-9]{3}$';

COMMIT;
