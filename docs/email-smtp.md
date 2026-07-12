# Configuracion de Correo SMTP

AgroSync puede enviar correos desde el servidor usando SMTP. Si estas variables no estan configuradas, el sistema registra la comunicacion y abre el cliente de correo del equipo como respaldo.

## Variables requeridas

Agrega estos valores en `.env.local` para desarrollo o en las variables del servidor en produccion:

```env
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario@dominio.com
SMTP_PASS=clave_o_app_password
SMTP_FROM="AgroSync <usuario@dominio.com>"
```

## Proveedores comunes

| Proveedor | Host | Puerto | Secure |
|---|---|---:|---|
| Gmail | `smtp.gmail.com` | `587` | `false` |
| Outlook | `smtp.office365.com` | `587` | `false` |
| Hostinger | `smtp.hostinger.com` | `465` | `true` |

Para Gmail y Outlook normalmente se requiere una clave de aplicacion o una configuracion SMTP habilitada.

## Comportamiento

- Si `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS` existen, el correo se envia directamente.
- Si SMTP no esta configurado, se abre un `mailto:` para usar el cliente de correo local.
- Todos los intentos quedan registrados en `comunicacion_envios` cuando MySQL esta activo.
