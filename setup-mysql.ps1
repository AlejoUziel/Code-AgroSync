# Script de Configuración de MySQL para AgroSync en Windows
$ErrorActionPreference = "Stop"

Clear-Host
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   Configuración de MySQL para AgroSync      " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# 1. Detectar mysql.exe
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
)

$mysqlPath = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        break
    }
}

if (-not $mysqlPath) {
    Write-Host "[ERROR] No se encontró la instalación de MySQL Server en las rutas estándar." -ForegroundColor Red
    Write-Host "Por favor, verifica si tienes instalado MySQL Server 8.0 u 8.4 en tu sistema." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Se detectó MySQL en: $mysqlPath" -ForegroundColor Cyan
Write-Host ""

# 2. Solicitar contraseña de root
Write-Host "Se requiere acceso de Administrador ('root') de MySQL para crear la base de datos y usuario." -ForegroundColor Yellow
$rootPassword = Read-Host -Prompt "Ingresa la contraseña de 'root' de MySQL"
Write-Host ""

# 3. Probar conexión y crear base de datos/usuario
Write-Host "Conectando a MySQL y ejecutando acceso inicial..." -ForegroundColor Yellow
try {
    # Ejecutar 00-mysql-access.sql como root
    & $mysqlPath -u root "-p$rootPassword" -e "source db/00-mysql-access.sql"
    Write-Host "[OK] Base de datos 'agrosync' y usuario 'agrosync_app' creados o validados." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] No se pudo conectar a MySQL con el usuario root o falló la ejecución del script." -ForegroundColor Red
    Write-Host "Detalle del error: $_" -ForegroundColor DarkRed
    exit 1
}
Write-Host ""

# 4. Cargar esquema de tablas
Write-Host "Cargando esquema de tablas..." -ForegroundColor Yellow
try {
    & $mysqlPath -u agrosync_app -pCambiar_Esta_Clave_2026! -h 127.0.0.1 agrosync -e "source db/mysql-schema.sql"
    Write-Host "[OK] Esquema de tablas cargado correctamente." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error al cargar el esquema de base de datos (mysql-schema.sql)." -ForegroundColor Red
    Write-Host "Detalle del error: $_" -ForegroundColor DarkRed
    exit 1
}
Write-Host ""

# 5. Cargar datos de prueba
Write-Host "Cargando datos de prueba (seed)..." -ForegroundColor Yellow
try {
    & $mysqlPath -u agrosync_app -pCambiar_Esta_Clave_2026! -h 127.0.0.1 agrosync -e "source db/04-seed-roatan.sql"
    Write-Host "[OK] Datos de prueba de Roatán cargados correctamente." -ForegroundColor Green
} catch {
    Write-Host "[WARNING] No se pudo cargar db/04-seed-roatan.sql. Posiblemente los datos ya existen." -ForegroundColor Yellow
}
Write-Host ""

# 6. Cargar scripts relacionales y recodificación
Write-Host "Cargando scripts de optimización y códigos relacionales..." -ForegroundColor Yellow
try {
    & $mysqlPath -u agrosync_app -pCambiar_Esta_Clave_2026! -h 127.0.0.1 agrosync -e "source db/02-short-relational-codes.sql"
    & $mysqlPath -u agrosync_app -pCambiar_Esta_Clave_2026! -h 127.0.0.1 agrosync -e "source db/03-recode-generic-crop-codes.sql"
    Write-Host "[OK] Scripts relacionales de optimización ejecutados con éxito." -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Ocurrió un problema menor al ejecutar los scripts relacionales (02/03)." -ForegroundColor Yellow
}
Write-Host ""

# 7. Crear archivo .env.local si no existe
$envFile = Join-Path $PSScriptRoot ".env.local"
$exampleFile = Join-Path $PSScriptRoot ".env.local.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $exampleFile) {
        Copy-Item $exampleFile $envFile
        Write-Host "[OK] Archivo '.env.local' creado exitosamente a partir del ejemplo." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] No se encontró el archivo '.env.local.example' en la raíz." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[INFO] El archivo '.env.local' ya existe. No se sobrescribió para conservar tus configuraciones actuales." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "¡Configuración completada con éxito!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Por favor:"
Write-Host "1. Detén tu servidor local actual (presiona Ctrl+C en la terminal de 'npm run dev')." -ForegroundColor Yellow
Write-Host "2. Inicia el servidor de nuevo con: npm run dev" -ForegroundColor Yellow
Write-Host "3. Inicia sesión en la plataforma y verifica el estado de persistencia." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green
