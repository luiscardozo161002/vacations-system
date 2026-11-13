# Arquitectura

## Visión general del sistema

```
Usuario (navegador)
  ↓
Frontend React (Vite) — features/*/{components,hooks,pages}
  ↓ usa
SDK TypeScript (@vacations/sdk) — HttpClient con fetch + AbortSignal, Bearer y refresh automático
  ↓ HTTP/JSON
API Hapi.js — validación Joi, un plugin por entidad
  ↓ Objection.js / Knex
PostgreSQL
```

Sin servicios externos: no hay proveedor de autenticación, pagos, correo ni analítica de terceros — login, sesiones y RBAC son propios, implementados en el plugin `auth`.

## Estructura del monorepo (npm workspaces)

```
docs/              Documentación del sistema (este archivo, PRD, Design System, Roadmap)
backend/
  src/
    config/        Variables de entorno
    db/             Conexión Knex, migraciones, seeds
    lib/            Utilidades compartidas (app-error, error-handler, password, list-query)
    plugins/        Un plugin Hapi por entidad (model + schemas + fields + service + routes)
    doc/bruno/      Colección Bruno para probar la API manualmente
sdk/
  src/
    core/           HttpClient (transporte) y SdkHttpError
    resources/      Una clase por entidad (Employees, Departments, Shifts, ...)
    types/          Tipos compartidos (Pagination, Paginated<T>)
frontend/
  src/
    app/            Shell (sidebar y topbar), navegación con permisos y pantallas pendientes
    components/     Piezas compartidas (Icon)
    features/       Un folder por dominio: components/ hooks/ pages/
    lib/            sdk.ts (instancia del SDK), sesión, tema, utilidades
    styles.css      Copia idéntica del styles.css del prototipo
```

## Módulos del backend (plugins Hapi, uno por entidad)

company, branches, shifts (con su horario semanal anidado), departments, employees, roles, permissions, role-permissions, users, auth, auth-audit-log, vacation-accrual-rules, vacation-entitlements, reasons, notices.

Cada plugin sigue el mismo patrón: `model.js` (Objection), `schemas.js` (Joi), `fields.js` (columnas expuestas), `service.js` (lógica + queries), `routes.js` (handlers Hapi). Las respuestas de error pasan por un `onPreResponse` global (`lib/error-handler.js`) que traduce errores de Postgres (constraints reales, verificados contra `pg_constraint`) a mensajes legibles. Todos los mensajes salen en español:

- **Validación:** usa `lib/validation-messages.js` y responde `400 VALIDATION_ERROR`, por ejemplo "El campo department_id es obligatorio".
- **Errores de Hapi:** salen con su propio código: `UNAUTHORIZED`, `NOT_FOUND`, `INVALID_JSON`, etc.

## Empresas, sedes y alcance de datos

```
company 1─N branches 1─N departments 1─N employees
users N─N branches (user_branches)
```

- `company` guarda la empresa: razón social, RFC, logo, teléfono y dirección fiscal (`location`).
- `branches` guarda la sede (código, nombre y estado) y pertenece a una empresa. Cada departamento cuelga de una sede (`departments.branch_id`).
- `user_branches` dice qué sedes atiende cada Usuario de RH. El Superusuario las asigna con `PUT /users/{id}/branches`.
- **Alcance:**
  - Superusuario ve todo.
  - Usuario ve solo lo que cuelga de sus sedes.
  - Empleado ve solo lo suyo (`employee_id` del token).
  - Leer, editar o borrar un registro fuera del alcance responde 404. Apuntar a un departamento, sede o empleado fuera del alcance al crear o editar responde 422.
- **Cómo se aplica:**
  - El access token lleva `role` y `branch_ids`; un cambio de sedes se aplica en el siguiente token.
  - Cada ruta convierte las credenciales con `scopeFrom` (`backend/src/lib/data-scope.js`).
  - Los repositorios filtran con `inBranches`, `inCompanies`, `inDepartments` o `forEmployees`, y los servicios validan referencias con `allowsBranch`, `allowsDepartment` y `allowsEmployee`.
  - Turnos, motivos y reglas son catálogos globales y no se filtran.

## Flujo de solicitudes y avisos

- **Tipo de registro.** `notices.kind` dice si es una solicitud (`request`, la crea el empleado y nace `pending`) o un aviso (`notice`, lo registra RH y nace `approved`). Lo decide el servidor según si el token tiene `notices:create`. `created_by`, `approved_by` y `approved_at` salen del token y del reloj del servidor, nunca del cliente.
- **Cambios de estado.** Solo con `POST /notices/{id}/approve | reject | cancel`, y `PATCH` ya no toca el estado. Cada acción es un `UPDATE … WHERE status IN (…)`, así que dos peticiones simultáneas no pueden aplicar dos transiciones; si no cambia ninguna fila, responde 409 `INVALID_TRANSITION`.
- **Quién puede.** `users.review_actions` guarda qué acciones puede hacer cada Usuario de RH (por defecto las tres); sin la acción, responde 403 `REVIEW_ACTION_FORBIDDEN`. El Empleado solo cancela sus solicitudes pendientes.

## Saldo de vacaciones

- **Cálculo.** `lib/request-breakdown.js` (puro) calcula días, horas y días de descanso de un rango según el horario del turno. `lib/balance.js` convierte días y horas a horas totales y de regreso. Un día equivale a la jornada del turno.
- **Evaluación.** `plugins/notices/balance.js` revisa una solicitud contra el periodo vigente (`vacation_entitlements` con `period_start <= hoy <= period_end`). La usan `POST /notices/preview`, que responde 200 con `error` si algo no se cumple, y el alta, la edición y la aprobación, que responden 422 con el mismo código.
- **Descuento.** Se descuenta al aprobar una solicitud de Vacaciones, o al registrar un aviso de Vacaciones de RH, y se devuelve al cancelar una aprobada. Cada movimiento ocurre en la misma transacción que el cambio de estado y bloquea la fila del saldo (`SELECT … FOR UPDATE`), así que dos operaciones simultáneas no pueden pasarse del saldo.
- **Qué guarda cada aviso.** `days_taken`, `hours_taken` y el `entitlement_id` del que descontó. El saldo guarda `used_days` y `used_hours`; cuando las horas suman una jornada, pasan a días.
- **Festivos.** `lib/holidays.js` calcula los descansos obligatorios del Art. 74 LFT de cada año, sin tabla que mantener. Los lunes movibles se calculan por año, y el 1 de octubre se agrega cada 6 años desde 2024. El cálculo de una solicitud no los descuenta, y pedir solo festivos responde 422 `MANDATORY_REST_DAY`.
- **Calendario.** `GET /calendar?from&to` (máximo 62 días) devuelve en una sola llamada las ausencias aprobadas y pendientes del alcance del usuario y los festivos del rango. El Empleado ve las suyas y, si su departamento tiene `calendar_shared`, también las de sus compañeros.
- **PDF.** `plugins/notices/pdf.js` arma con PDFKit el aviso en el formato de RH (dos copias en una hoja carta). Solo se genera para avisos aprobados y dentro del alcance. Mientras no haya teléfono por empresa, usa el que dio RH para las tres. La fecha de solicitud se toma en horario de Ciudad de México.
- **Periodos.** `lib/periods.js` calcula el periodo vigente de aniversario a aniversario. `plugins/vacation-entitlements/rollover.js` es idempotente:
  - vence lo que ya terminó (lo no usado se pierde);
  - abre el periodo vigente con la regla de la antigüedad;
  - cancela solicitudes de Vacaciones pendientes de periodos anteriores;
  - avisa al abrir el periodo y una semana antes de que venza.

  Lo corre el servidor al arrancar y cada 24 horas (no con `NODE_ENV=test`), y el Superusuario con `POST /vacation-entitlements/generate`. Si un empleado falla, queda en `skipped` y el resto sigue.
- **Notificaciones.** La tabla `notifications` guarda una fila por usuario, tipo y referencia, así que repetir un aviso no lo duplica. `GET /me/notifications` y `POST /me/notifications/read` alimentan la campana de la topbar. El envío por correo (VM-054) leerá esa misma tabla.
  - **Resoluciones:** al aprobar, rechazar o cancelar una solicitud, o cuando RH registra un aviso, el empleado recibe una notificación (`request_approved`, `notice_approved`…), salvo si fue él mismo quien hizo la acción (`plugins/notices/notifications.js`).
  - **Pendientes:** quien tiene `approvals:review` recibe además `pending` con el total y las 10 solicitudes o avisos pendientes más antiguos de sus sedes. Se calculan al consultar, no se guardan.
- **Dashboard.** `GET /dashboard/summary` (requiere `employees:view`) junta en una sola llamada los indicadores, las próximas ausencias, el conteo por departamento y la actividad reciente, siempre dentro del alcance. `GET /dashboard/me` usa solo el `employee_id` del token, aunque el usuario sea de RH.
- **Fechas.** `pg` devuelve las columnas `DATE` como texto `YYYY-MM-DD` y las `NUMERIC` como número (`src/db/index.js`), para no depender de la zona horaria del servidor.

## Autenticación y autorización

JWT (`@hapi/jwt`) con access token de vida corta (15 min) + refresh token (7 días), contraseñas con `bcryptjs`, bloqueo de cuenta tras 5 intentos fallidos (15 min), tokens de reseteo de contraseña con expiración de 1 hora, y bitácora de auditoría (`auth_audit_log`) para eventos de seguridad.

RBAC vía `roles` / `permissions` / `role_permissions`.

- **Roles:** `SUPERUSER`, `USER` y `EMPLOYEE`.
- **Permisos:** tienen la forma `modulo:accion` (`employees:view`, `approvals:review`…). La migración `rbac_matrix` siembra la matriz del PRD.
- **Token:** el access token lleva los permisos del rol en `scope`. Cada ruta los pide con `auth: requires('modulo:accion')` (`backend/src/lib/permissions.js`); si pide varios, basta con tener uno.
- **Sin permiso:** la ruta responde 403 `FORBIDDEN`.
- **Cambios:** si se cambian los permisos de un rol, se aplican en el siguiente token, en un máximo de 15 minutos.

Cuentas de empleado con contraseña temporal (`backend/src/lib/temporary-password.js`, `plugins/employees/access.js`):

- **Alta:** `POST /employees` con `email` crea, en la misma transacción, el usuario con rol `EMPLOYEE`. El usuario sale de la parte local del correo (`j.perez`, `j.perez2` si ya existe).
- **Temporal:** 10 caracteres sin ambiguos, `must_change_password = true` y vence en un mes (`temporary_password_expires_at`). La respuesta trae `temporary_password` para que RH la entregue mientras no haya correo.
- **Login:** con la temporal vencida responde 403 `TEMPORARY_PASSWORD_EXPIRED`. Si sigue vigente, el login y `/auth/me` traen `must_change_password` y el frontend obliga a cambiarla antes de entrar.
- **Cambio:** cambiar o restablecer la contraseña limpia ambos campos.
- **Reenvío:** `POST /employees/{id}/access` (permiso `employees:update`, dentro de las sedes de RH) crea la cuenta si falta (pide `email`) o emite una temporal nueva, desbloquea la cuenta y cierra sus sesiones. No toca cuentas administrativas (409 `ACCOUNT_NOT_EMPLOYEE`) ni empleados de baja (409 `EMPLOYEE_INACTIVE`).

## Flujo de datos (ejemplo: listar empleados con un filtro)

1. El usuario cambia un filtro en `EmployeesPage`.
2. El hook `useEmployees` arma los parámetros (memoizados) y llama a `sdk.employees.list(params, { signal })`.
3. `HttpClient.request()` arma la query string, agrega `Authorization: Bearer <token>` si hay sesión, y hace `fetch` con el `AbortSignal` del hook — si el filtro cambia antes de que responda, la petición anterior se cancela.
4. La ruta Hapi valida los query params con Joi, el `service.js` arma la consulta Objection, Postgres responde.
5. El error handler global normaliza cualquier falla (validación, constraint de BD, 404) a `{ error: { code, message } }`.
6. El SDK lo traduce a `SdkHttpError` si la respuesta no fue 2xx. TanStack Query guarda la respuesta en caché con su clave (`['employees', params]`) y el hook expone `data`, `loading` y `error` al componente.

## Decisiones explícitas

- **Esquema**: las migraciones de Knex (`backend/src/db/migrations`) son la única fuente del esquema y los datos de prueba viven en `backend/src/db/seeds`. El script SQL original, convertido de SQL Server, ya no se usa y se retiró del repo.
- **Soft delete** en todas las tablas que lo necesitan: nunca se borra una fila, se marca `status = 'inactive'`.
- **Validación en dos capas, a propósito**: Joi valida en el borde HTTP, Objection valida al escribir en BD — no es redundancia accidental, son capas distintas (forma de la petición vs. integridad de datos).
- **El SDK es la única puerta al backend**: el frontend nunca hace `fetch` directo; todo pasa por `@vacations/sdk` para mantener un solo lugar de manejo de errores y auth.
- **Caché y estado en el frontend**: los datos de la API viven en TanStack Query; los filtros y la página, en la URL; lo demás, en `useState` o en el contexto de sesión. No hay un store global. Tras cualquier cambio se refresca lo que está en pantalla (`refreshData`) en lugar de invalidar recurso por recurso, porque una aprobación toca solicitudes, saldos, calendario, dashboard y campana a la vez.
- **Estilos**: se sigue el `styles.css` del prototipo tal cual; no se usan Tailwind ni librerías de componentes.
- **Despliegue**: aún no definido (no hay Dockerfile ni CI en el repo); se documenta aquí cuando se decida.