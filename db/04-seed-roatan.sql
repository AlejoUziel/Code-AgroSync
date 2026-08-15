-- AgroSync - Datos de prueba de Roatán (Islas de la Bahía)
-- Para poblar la base de datos MySQL local con las nuevas parcelas y cultivos

USE agrosync;

-- Asegurarse de que la empresa por defecto exista
INSERT IGNORE INTO empresas (id, codigo, nombre, nit, email, telefono, direccion, ciudad, pais, plan, estado, notas)
VALUES ('EMP-001', 'EMP-001', 'AgroSur', 'RTN-AGROSUR-2026', 'contacto@agrosur.com', '+504 2222-1111', 'Colonia Florencia', 'Tegucigalpa', 'Honduras', 'Starter', 'Activa', 'Empresa de prueba');

-- Insertar Parcelas de Roatán (con sus respectivos POINT y POLYGON espaciales SRID 4326)
INSERT IGNORE INTO parcelas (id, empresa_id, nombre, zona, hectareas, estado, centro, poligono)
VALUES 
('P-006', 'EMP-001', 'Roatan-West', 'Islas de la Bahia', 12.50, 'Activa', 
  ST_GeomFromText('POINT(-86.591 16.305)', 4326), 
  ST_GeomFromText('POLYGON((-86.594 16.308,-86.588 16.308,-86.588 16.302,-86.594 16.302,-86.594 16.308))', 4326)),

('P-007', 'EMP-001', 'Roatan-Sandy', 'Islas de la Bahia', 8.40, 'Activa', 
  ST_GeomFromText('POINT(-86.558 16.331)', 4326), 
  ST_GeomFromText('POLYGON((-86.561 16.334,-86.555 16.334,-86.555 16.328,-86.561 16.328,-86.561 16.334))', 4326)),

('P-008', 'EMP-001', 'Roatan-Oak', 'Islas de la Bahia', 5.20, 'En Preparacion', 
  ST_GeomFromText('POINT(-86.368 16.391)', 4326), 
  ST_GeomFromText('POLYGON((-86.371 16.394,-86.365 16.394,-86.365 16.388,-86.371 16.388,-86.371 16.394))', 4326));

-- Insertar Cultivos asociados a las nuevas parcelas (Cocos, Cacao y Vainilla, típicos de la región insular)
INSERT IGNORE INTO cultivos (id, empresa_id, parcela_id, nombre, fecha_siembra, fecha_cosecha_estimada, etapa, estado)
VALUES
('C-004', 'EMP-001', 'P-006', 'Coco Caribeño', '2024-05-10', '2026-09-15', 'Llenado', 'En Progreso'),
('C-005', 'EMP-001', 'P-007', 'Cacao Criollo', '2025-06-20', '2026-12-10', 'Floracion', 'En Progreso'),
('C-006', 'EMP-001', 'P-008', 'Vainilla Planifolia', '2026-01-10', '2027-02-15', 'Vegetativa', 'Nuevo');
