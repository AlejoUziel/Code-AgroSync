# Simulacro PITR de AgroSync

## Objetivo

Validar mensualmente que una restauración puntual de PostgreSQL/Neon conserva migraciones, integridad referencial y datos esenciales sin tocar producción.

## Procedimiento

1. En Neon, seleccione la rama de producción y cree una rama restaurada al instante objetivo. Nunca restaure sobre la rama productiva.
2. Copie la cadena de conexión de sólo lectura de la rama restaurada a `PITR_RESTORED_DATABASE_URL`.
3. Mantenga la conexión administrativa productiva únicamente en `DATABASE_URL_UNPOOLED`.
4. Defina `PITR_TARGET_TIMESTAMP` en ISO-8601 y ejecute `npm run db:drill:pitr`.
5. Verifique resultado `aprobado`, RTO, RPO, conteos, duplicados y huérfanos.
6. Consulte `continuidad_simulacros` para la evidencia persistida.
7. Elimine la rama restaurada sólo después de guardar el informe del proveedor.

## Criterios de aceptación

- La base restaurada es diferente de producción.
- Todas las migraciones registradas tienen checksum.
- No existen membresías huérfanas ni correos duplicados.
- Los conteos de tablas críticas son legibles.
- RTO y RPO quedan registrados.

La creación del punto de restauración depende del plan y controles del proveedor Neon. El script verifica la restauración; no obtiene permisos para modificar la infraestructura.

