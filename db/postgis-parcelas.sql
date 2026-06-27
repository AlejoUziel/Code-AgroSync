CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS parcelas_geo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  parcela_codigo varchar(36) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  estado varchar(40) NOT NULL,
  hectareas numeric(10,2) NOT NULL,
  centro geography(Point, 4326) NOT NULL,
  poligono geography(Polygon, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcelas_geo_centro ON parcelas_geo USING gist (centro);
CREATE INDEX IF NOT EXISTS idx_parcelas_geo_poligono ON parcelas_geo USING gist (poligono);
