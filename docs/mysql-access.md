# Acceso MySQL y carga de base de datos

Este proyecto usa MySQL por medio de la variable `DATABASE_URL`. Cuando esta variable esta configurada, los usuarios, empresas, parcelas, cultivos, alertas, reportes y demas submodulos se guardan en la base de datos automaticamente.

## Archivos incluidos

- `db/00-mysql-access.sql`: crea la base `agrosync`, el usuario `agrosync_app` y los permisos.
- `db/mysql-schema.sql`: crea las tablas, llaves foraneas, campos geoespaciales y relaciones del sistema.
- `.env.local.example`: ejemplo de conexion que debe copiarse como `.env.local`.

## Instalacion local

Ejecutar desde la carpeta del proyecto:

```powershell
mysql -u root -p < db/00-mysql-access.sql
mysql -u agrosync_app -p agrosync < db/mysql-schema.sql
Copy-Item .env.local.example .env.local
```

Luego editar `.env.local` y cambiar:

- `DATABASE_URL`: usuario, clave, host, puerto y base de datos.
- `SESSION_SECRET`: valor aleatorio de 32 caracteres o mas.
- `ADMIN_GENERAL_PASSWORD`: clave usada para validar cambios sensibles de usuario/configuracion.

## Cadena de conexion

Formato:

```text
mysql://usuario:clave@host:puerto/base_de_datos
```

Ejemplo local:

```text
mysql://agrosync_app:Cambiar_Esta_Clave_2026!@127.0.0.1:3306/agrosync
```

## Verificacion rapida

```powershell
mysql -u agrosync_app -p -e "SHOW DATABASES;"
mysql -u agrosync_app -p agrosync -e "SHOW TABLES;"
```

Si `DATABASE_URL` no existe o no es valida, la plataforma no puede persistir usuarios reales en MySQL. En ese caso el login mostrara mensajes de configuracion y los modulos asociados a base de datos no guardaran informacion permanente.
