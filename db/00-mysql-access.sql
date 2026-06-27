-- AgroSync SaaS - acceso inicial MySQL
-- Ejecutar con un usuario administrador de MySQL, por ejemplo:
-- mysql -u root -p < db/00-mysql-access.sql

CREATE DATABASE IF NOT EXISTS agrosync
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'agrosync_app'@'localhost'
  IDENTIFIED BY 'Cambiar_Esta_Clave_2026!';

CREATE USER IF NOT EXISTS 'agrosync_app'@'127.0.0.1'
  IDENTIFIED BY 'Cambiar_Esta_Clave_2026!';

GRANT ALL PRIVILEGES ON agrosync.* TO 'agrosync_app'@'localhost';
GRANT ALL PRIVILEGES ON agrosync.* TO 'agrosync_app'@'127.0.0.1';

FLUSH PRIVILEGES;
