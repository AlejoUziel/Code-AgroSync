# Despliegue AgroSync

## Frontend en Vercel

1. Conecta el repositorio en Vercel.
2. Configura estas variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_FRONTEND_URL`
3. Usa los scripts existentes:
   - Build: `npm run build`
   - Start: Vercel lo administra automaticamente para Next.js.

## Backend en VPS Ubuntu o Hostinger

La app usa Route Handlers de Next.js para la capa backend ligera. Para una separacion completa, mueve `src/lib/db.ts`, acciones y rutas `api` a un servicio Node.js/Express o NestJS en el VPS y conserva el frontend en Vercel.

Recomendado en Ubuntu:

1. Instalar Node.js LTS y MySQL 8.
2. Crear base y usuario:
   - `mysql -u root -p < db/mysql-schema.sql`
3. Configurar `.env` con `DATABASE_URL`.
4. Ejecutar:
   - `npm ci`
   - `npm run build`
   - `npm run start`
5. Publicar con Nginx como reverse proxy y HTTPS.

## Parcelas, mapas y geodatos

- La UI usa Leaflet y OpenStreetMap.
- MySQL guarda `POINT` y `POLYGON` con SRID 4326 en `parcelas`.
- Si el proyecto requiere PostGIS estrictamente para geoprocesamiento avanzado, usa `db/postgis-parcelas.sql` en PostgreSQL/PostGIS y sincroniza esos IDs con MySQL.
