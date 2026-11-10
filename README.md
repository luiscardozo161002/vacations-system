# Sistema de Vacaciones

Monorepo con npm workspaces, compuesto por tres paquetes:

- **`backend/`** — API en Hapi.js con PostgreSQL.
- **`sdk/`** — SDK cliente para consume la API.
- **`frontend/`** — APP de React que consume el SDK.

## Documentación

| Documento | Contenido |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Producto, usuarios, funcionalidades y reglas de negocio |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Capas, estructura del monorepo, auth y decisiones técnicas |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colores, tipografía y componentes del frontend |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Estado actual, fixes pendientes y plan de ramas |

## Requisitos

- Node.js 20+ y npm 10+
- PostgreSQL 17, ya sea con Docker o instalado localmente

## Instalación

Desde la raíz del repo (instala y enlaza los tres paquetes):

```bash
npm install
```

## Backend

### Arranque rápido con Docker

```bash
cp backend/.env.example backend/.env
```

```bash
docker compose --env-file backend/.env up -d
```

```bash
npm run migrate --workspace=backend
```

```bash
npm run seed --workspace=backend
```

```bash
npm run dev --workspace=backend
```

El contenedor toma la base, el usuario, la contraseña y el puerto de `backend/.env`, así que la API y Postgres siempre usan las mismas credenciales. Los datos se guardan en el volumen `pgdata` y sobreviven a `docker compose down`; para empezar desde cero, `docker compose down -v`. Si ya tienes un Postgres local en el 5432, cambia `DB_PORT` en `backend/.env` (por ejemplo a `5433`) antes de levantar el contenedor.

Los pasos de abajo son el arranque sin Docker, o el detalle de cada comando.

### 1. Configurar variables de entorno

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
| `JWT_SECRET`  | Firma los access token (JWT) de `POST /api/v1/auth/login` | `dev-secret-change-me-in-production`. Con `NODE_ENV=production` la API no arranca si falta o si se deja este valor |
| `CORS_ORIGINS` | Orígenes del navegador que pueden llamar a la API, separados por coma | `http://localhost:5173` (el frontend de Vite) |

### 2. Crear la base de datos (solo sin Docker)

```bash
createdb vacations_db
```

### 3. Correr las migraciones

```bash
npm run migrate --workspace=backend
```

### 4. Cargar datos de prueba

```bash
npm run seed --workspace=backend
```

Carga datos dummy (empresas, departamentos, turnos, empleados, usuarios, vacaciones y avisos). **Borra antes todo lo que haya en la base**, así que se puede correr tantas veces como se quiera, pero no conserva datos capturados a mano. Se niega a correr con `NODE_ENV=production`.

Usuarios de prueba (todos con la contraseña `Vacaciones2026!`, solo para desarrollo):

| Usuario     | Correo                  | Rol      | Empleado vinculado      |
|-------------|-------------------------|----------|--------------------------|
| `sysadmin`  | sysadmin@grupo-jo.com   | ADMIN    | —                        |
| `r.jimenez` | r.jimenez@thh.com.mx    | HR       | Roberto Jimenez Cruz     |
| `j.navarro` | j.navarro@jo.com.mx     | EMPLOYEE | Jorge Luis Navarro       |
| `j.perez`   | j.perez@jo.com.mx       | EMPLOYEE | Juan Perez Lopez         |

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

Todos los recursos siguen el mismo esquema CRUD con paginación en el listado (`GET /`, `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}`) y baja lógica: `DELETE` pone `status = 'inactive'`, nunca borra el registro (salvo `notices`, que usa `'cancelled'` en vez de `'inactive'`, porque ese es su propio enum de estado).

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
| Permisos por rol                    | `/api/v1/role-permissions`              | solo `GET`/`POST`/`DELETE` (clave compuesta `{roleId}/{permissionId}`, sin campos propios que editar); volver a asignar un permiso desactivado lo reactiva, no da 409 |
| Reglas de acumulación de vacaciones | `/api/v1/vacation-accrual-rules`        |                                                                    |
| Saldos de vacaciones                | `/api/v1/vacation-entitlements`         | `remaining_days` es una columna generada por Postgres (no se envía en el body) |
| Motivos de aviso                    | `/api/v1/reasons`                       |                                                                    |
| Avisos de ausencia                  | `/api/v1/notices`                       | `DELETE` pone `status = 'cancelled'`, no `'inactive'`            |
| Usuarios                            | `/api/v1/users`                         | nunca devuelve `password_hash`; ver [Autenticación](#autenticación) |

Todas las respuestas de error tienen la misma forma:

```json
{ "error": { "code": "ALGUN_CODIGO", "message": "..." } }
```

La colección de [Bruno](https://www.usebruno.com/) en [`backend/src/doc/bruno/`](backend/src/doc/bruno/) tiene un request de ejemplo por cada endpoint, con los campos requeridos y los códigos de error de cada uno. Para usarla: elegir el entorno **Local**, correr **Auth → Login** (guarda el token en la variable `accessToken`) y después cualquier otra petición; todas las protegidas heredan `Bearer {{accessToken}}` de la configuración de la colección. Cuando el token vence (15 min), correr **Auth → Refresh**.

#### Documentación interactiva (Swagger)

Con el servidor corriendo, `http://localhost:3000/documentation` muestra todos los endpoints en Swagger UI (agrupados por recurso, con "Try it out" para probarlos desde el navegador) y `http://localhost:3000/swagger.json` expone el spec OpenAPI 2.0 crudo. Se genera automaticamente a partir de los mismos schemas de Joi que ya validan cada ruta ([hapi-swagger](https://github.com/hapi-swagger/hapi-swagger), registrado en [server.js](backend/src/server.js) junto con `@hapi/inert` y `@hapi/vision`, que son requisito de hapi-swagger) — no hay que mantener la documentacion aparte ni duplicar los schemas.

**Nota de compatibilidad:** `hapi-swagger@17.3.2` declara `peerDependencies: { joi: "17.x" }`, pero el proyecto usa `joi@^18.3.1`. Se instalo igual (`--legacy-peer-deps`) porque hapi-swagger no trae su propio Joi: solo llama a `.describe()` sobre los schemas que ya existen, y esa API no cambio entre Joi 17 y 18 — se probo endpoint por endpoint y todos generan su definicion correctamente. Si una actualizacion futura de Joi rompe esto, el error va a aparecer como un schema vacio o un 500 al pedir `/swagger.json`, no al arrancar el servidor.

### Autenticación

Las otras tres tablas de este dominio (`user_sessions`, `password_reset_tokens`, `auth_audit_log`) a propósito no tienen un CRUD genérico — login, refresh, logout y reset de contraseña necesitan su propia lógica, no un `POST`/`PATCH` abierto:

| Acción                        | Endpoint                                    |
|---------------------------------|------------------------------------------------|
| Login (con `email` o `username`) | `POST /api/v1/auth/login`                       |
| Usuario actual                   | `GET /api/v1/auth/me`                           |
| Editar username o correo         | `PATCH /api/v1/auth/me`                         |
| Cambiar contraseña               | `POST /api/v1/auth/me/password`                 |
| Refrescar sesión                 | `POST /api/v1/auth/refresh`                     |
| Logout                           | `POST /api/v1/auth/logout`                      |
| Pedir reset de contraseña        | `POST /api/v1/auth/password-reset/request`      |
| Confirmar reset de contraseña    | `POST /api/v1/auth/password-reset/confirm`      |
| Log de auditoría (solo lectura)  | `GET /api/v1/auth-audit-log`, `GET /api/v1/auth-audit-log/{id}` |

Cómo funciona:

- **Usuario actual:** `GET /auth/me` devuelve el usuario con su rol, su empleado vinculado (o `null`) y la lista de códigos de permiso activos del rol. Cambiar la contraseña pide la actual, revoca todas las sesiones del usuario y devuelve tokens nuevos para la sesión que hizo el cambio.
- **Login** recibe `email` o `username` (uno de los dos, no ambos), valida la contraseña (bcrypt) y devuelve un **access token** (JWT, dura 15 minutos, firmado con `JWT_SECRET`) y un **refresh token** (opaco, dura 7 días; solo se guarda su hash en `user_sessions`, nunca el valor original).
- **Refresh** cambia un refresh token válido por un access token nuevo y **rota** el refresh token (revoca el usado, entrega uno nuevo): si alguien reutiliza uno viejo, falla con `401 INVALID_REFRESH_TOKEN`.
- Desde una misma IP se permiten **20 logins fallidos cada 15 minutos**; después responde `429` (incluso con la contraseña correcta) hasta que pasa la ventana. Los logins correctos no cuentan, para no bloquear a una oficina que sale a internet por una sola IP. El contador vive en memoria: se reinicia al reiniciar la API y, detrás de un proxy, todas las peticiones llegan con la IP del proxy (se ajusta al desplegar).
- Tras **5 intentos fallidos** de login seguidos, la cuenta queda `status: 'locked'` por 15 minutos (`423 ACCOUNT_LOCKED`); se desbloquea sola al expirar ese tiempo, o antes si se completa un reset de contraseña.
- **Password reset** responde siempre el mismo mensaje exista o no el correo, para no revelar qué correos están registrados. Como todavía no hay envío de email, fuera de `NODE_ENV=production` la respuesta de `request` incluye el token en texto plano (`devToken`) para poder probar el flujo — en producción eso se reemplaza por un correo real y la respuesta nunca lo expone. Confirmar el reset revoca todas las sesiones activas del usuario.
- Todo evento relevante (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `TOKEN_REFRESH`, `LOGOUT`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`) queda registrado en `auth_audit_log`, consultable pero no editable por la API.

**Rutas protegidas:** todas las rutas exigen `Authorization: Bearer <accessToken>`, salvo `GET /api/v1/health`, las 5 de `/api/v1/auth/*` y la documentación de Swagger. Sin token, con un token vencido o con una firma inválida responden `401`. El token lleva `user_id`, `role_id`, `employee_id` y `username`. En Swagger, el botón **Authorize** recibe `Bearer <accessToken>`.

**Todavía no se revisan permisos por rol:** cualquier usuario con sesión puede llamar a cualquier ruta. Eso entra con el RBAC (VM-013).

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

El plan completo por ticket está en [docs/ROADMAP.md](docs/ROADMAP.md).
