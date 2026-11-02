# Sistema de Vacaciones

Monorepo con npm workspaces, compuesto por tres paquetes:

- **`backend/`** — API en Hapi.js con PostgreSQL.
- **`sdk/`** — SDK cliente para consume la API.
- **`frontend/`** — APP de React que consume el SDK.

## Requisitos

- Node.js 20+ y npm 10+
- PostgreSQL 

## Instalación

Desde la raíz del repo (instala y enlaza los tres paquetes):

```bash
npm install
```

## Backend

### 1. Crear la base de datos

```bash
createdb vacations_db
```

### 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

En PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Editar `backend/.env` con los datos de conexión a PostgreSQL:

| Variable      | Descripción                   | Default         |
|---------------|--------------------------------|------------------|
| `NODE_ENV`    | Entorno de ejecución            | `development`    |
| `HOST`        | Host donde escucha la API       | `0.0.0.0`        |
| `PORT`        | Puerto donde escucha la API     | `3000`           |
| `DB_HOST`     | Host de PostgreSQL              | `localhost`      |
| `DB_PORT`     | Puerto de PostgreSQL            | `5432`           |
| `DB_NAME`     | Nombre de la base de datos      | `vacations_db`   |
| `DB_USER`     | Usuario de PostgreSQL           | `postgres`       |
| `DB_PASSWORD` | Password de ese usuario         | *(sin default)*  |
| `JWT_SECRET`  | Firma los access token (JWT) de `POST /api/v1/auth/login` | `dev-secret-change-me-in-production` (**cambiar en producción**) |

### 3. Correr las migraciones

```bash
npm run migrate --workspace=backend
```

### 4. Cargar datos de prueba

```bash
npm run seed --workspace=backend
```

Carga datos dummy (empresas, departamentos, turnos, empleados, usuarios, vacaciones y avisos). Se puede correr tantas veces como se quiera.

### 5. Levantar el servidor

```bash
npm run dev --workspace=backend
```

Queda disponible en `http://localhost:3000` (o el `HOST`/`PORT` configurado).

### Comandos del backend

| Comando                                                 | Qué hace                                  |
|----------------------------------------------------------|---------------------------------------------|
| `npm run dev --workspace=backend`                        | Levanta la API con reinicio automático      |
| `npm run start --workspace=backend`                      | Levanta la API sin reinicio automático      |
| `npm run migrate --workspace=backend`                    | Aplica las migraciones pendientes           |
| `npm run migrate:rollback --workspace=backend`           | Revierte el último batch de migraciones     |
| `npm run migrate:rollback --workspace=backend -- --all`  | Revierte todas las migraciones              |
| `npm run migrate:make --workspace=backend -- <nombre>`   | Crea un archivo de migración vacío          |
| `npm run seed --workspace=backend`                       | Borra e inserta los datos de prueba         |
| `npm run lint --workspace=backend`                       | Corre ESLint sobre el backend               |

(Estos comandos también se pueden correr parado dentro de `backend/`, sin el flag `--workspace=backend`.)

### Endpoints disponibles

Todos los recursos siguen el mismo esquema CRUD con paginación en el listado (`GET /`, `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}`). `DELETE` siempre hace un borrado físico (elimina el registro); si otra tabla todavía lo referencia por una foreign key, responde `409 RELATED_RECORDS` en vez de borrarlo.

| Recurso                            | Base                                  | Notas                                                         |
|-------------------------------------|-----------------------------------------|------------------------------------------------------------------|
| Health check                        | `GET /api/v1/health`                    |                                                                     |
| Empresas                            | `/api/v1/companies`                     |                                                                    |
| Departamentos                       | `/api/v1/departments`                   |                                                                    |
| Turnos                              | `/api/v1/shifts`                        |                                                                    |
| Horarios de turno                   | `/api/v1/shift-schedules`               |                                                                    |
| Empleados                           | `/api/v1/employees`                     |                                                                    |
| Roles                               | `/api/v1/roles`                         |                                                                    |
| Permisos                            | `/api/v1/permissions`                   |                                                                    |
| Permisos por rol                    | `/api/v1/role-permissions`              | solo `GET`/`POST`/`DELETE`; clave compuesta `{roleId}/{permissionId}` en vez de un id propio |
| Reglas de acumulación de vacaciones | `/api/v1/vacation-accrual-rules`        |                                                                    |
| Saldos de vacaciones                | `/api/v1/vacation-entitlements`         | `remaining_days` es una columna generada por Postgres (no se envía en el body) |
| Motivos de aviso                    | `/api/v1/reasons`                       |                                                                    |
| Avisos de ausencia                  | `/api/v1/notices`                       |                                                                    |
| Usuarios                            | `/api/v1/users`                         | nunca devuelve `password_hash`; ver [Autenticación](#autenticación) |

Varios de estos recursos (`companies`, `departments`, `shifts`, `employees`, `roles`, `vacation-accrual-rules`) todavía tienen una columna `status` (`active`/`inactive`) editable por `PATCH`, para desactivar un registro sin borrarlo — pero `DELETE` ya no la usa, borra directamente.

Todas las respuestas de error tienen la misma forma:

```json
{ "error": { "code": "ALGUN_CODIGO", "message": "..." } }
```

La colección de [Bruno](https://www.usebruno.com/) en [`backend/src/doc/bruno/`](backend/src/doc/bruno/) tiene un request de ejemplo por cada endpoint, con los campos requeridos y los códigos de error de cada uno.

### Autenticación

Las otras tres tablas de este dominio (`user_sessions`, `password_reset_tokens`, `auth_audit_log`) a propósito no tienen un CRUD genérico — login, refresh, logout y reset de contraseña necesitan su propia lógica, no un `POST`/`PATCH` abierto:

| Acción                        | Endpoint                                    |
|---------------------------------|------------------------------------------------|
| Login                            | `POST /api/v1/auth/login`                       |
| Refrescar sesión                 | `POST /api/v1/auth/refresh`                     |
| Logout                           | `POST /api/v1/auth/logout`                      |
| Pedir reset de contraseña        | `POST /api/v1/auth/password-reset/request`      |
| Confirmar reset de contraseña    | `POST /api/v1/auth/password-reset/confirm`      |
| Log de auditoría (solo lectura)  | `GET /api/v1/auth-audit-log`, `GET /api/v1/auth-audit-log/{id}` |

Cómo funciona:

- **Login** valida usuario/contraseña (bcrypt) y devuelve un **access token** (JWT, dura 15 minutos, firmado con `JWT_SECRET`) y un **refresh token** (opaco, dura 7 días; solo se guarda su hash en `user_sessions`, nunca el valor original).
- **Refresh** cambia un refresh token válido por un access token nuevo y **rota** el refresh token (revoca el usado, entrega uno nuevo): si alguien reutiliza uno viejo, falla con `401 INVALID_REFRESH_TOKEN`.
- Tras **5 intentos fallidos** de login seguidos, la cuenta queda `status: 'locked'` por 15 minutos (`423 ACCOUNT_LOCKED`); se desbloquea sola al expirar ese tiempo, o antes si se completa un reset de contraseña.
- **Password reset** responde siempre el mismo mensaje exista o no el correo, para no revelar qué correos están registrados. Como todavía no hay envío de email, fuera de `NODE_ENV=production` la respuesta de `request` incluye el token en texto plano (`devToken`) para poder probar el flujo — en producción eso se reemplaza por un correo real y la respuesta nunca lo expone. Confirmar el reset revoca todas las sesiones activas del usuario.
- Todo evento relevante (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `TOKEN_REFRESH`, `LOGOUT`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`) queda registrado en `auth_audit_log`, consultable pero no editable por la API.

**Lo que falta a propósito:** ningún endpoint de este backend (ni los de autenticación ni los demás recursos) valida todavía el access token ni los permisos del rol — no hay ningún middleware que lo exija. Login/refresh emiten y rotan el JWT, pero usarlo para proteger rutas es un paso aparte, todavía pendiente.

## SDK

Se compila antes de poder usarse desde el frontend:

```bash
npm run build --workspace=sdk
```

Durante el desarrollo conviene dejarlo en modo watch:

```bash
npm run dev --workspace=sdk
```

## Frontend

```bash
npm run dev --workspace=frontend
```

El frontend ya declara `@vacations/sdk` como dependencia (resuelta como paquete local del workspace, sin publicarlo a ningún registro), pero todavía no lo usa en ningún componente.

## Próximos pasos

- Proteger rutas validando el access token (JWT) y el rol/permisos de quien llama — hoy ningún endpoint lo exige (ver [Autenticación](#autenticación)).
- Agregar los recursos correspondientes en el SDK (incluyendo login/refresh/logout).
- Conectar el frontend al SDK.
