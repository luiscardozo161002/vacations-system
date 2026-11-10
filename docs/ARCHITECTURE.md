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
    features/       Un folder por dominio: components/ hooks/ pages/
    lib/            sdk.ts (instancia del SDK), utilidades
```

## Módulos del backend (plugins Hapi, uno por entidad)

company, shifts (con su horario semanal anidado), departments, employees, roles, permissions, role-permissions, users, auth, auth-audit-log, vacation-accrual-rules, vacation-entitlements, reasons, notices.

Cada plugin sigue el mismo patrón: `model.js` (Objection), `schemas.js` (Joi), `fields.js` (columnas expuestas), `service.js` (lógica + queries), `routes.js` (handlers Hapi). Las respuestas de error pasan por un `onPreResponse` global (`lib/error-handler.js`) que traduce errores de Postgres (constraints reales, verificados contra `pg_constraint`) a mensajes legibles.

## Autenticación y autorización

JWT (`@hapi/jwt`) con access token de vida corta (15 min) + refresh token (7 días), contraseñas con `bcryptjs`, bloqueo de cuenta tras 5 intentos fallidos (15 min), tokens de reseteo de contraseña con expiración de 1 hora, y bitácora de auditoría (`auth_audit_log`) para eventos de seguridad. RBAC vía `roles` / `permissions` / `role_permissions`.

## Flujo de datos (ejemplo: listar empleados con un filtro)

1. El usuario cambia un filtro en `EmployeesPage`.
2. El hook `useEmployees` arma los parámetros (memoizados) y llama a `sdk.employees.list(params, { signal })`.
3. `HttpClient.request()` arma la query string, agrega `Authorization: Bearer <token>` si hay sesión, y hace `fetch` con el `AbortSignal` del hook — si el filtro cambia antes de que responda, la petición anterior se cancela.
4. La ruta Hapi valida los query params con Joi, el `service.js` arma la consulta Objection, Postgres responde.
5. El error handler global normaliza cualquier falla (validación, constraint de BD, 404) a `{ error: { code, message } }`.
6. El SDK lo traduce a `SdkHttpError` si la respuesta no fue 2xx; el hook lo expone como `error` al componente.

## Decisiones explícitas

- **Soft delete** en todas las tablas que lo necesitan: nunca se borra una fila, se marca `status = 'inactive'`.
- **Validación en dos capas, a propósito**: Joi valida en el borde HTTP, Objection valida al escribir en BD — no es redundancia accidental, son capas distintas (forma de la petición vs. integridad de datos).
- **El SDK es la única puerta al backend**: el frontend nunca hace `fetch` directo; todo pasa por `@vacations/sdk` para mantener un solo lugar de manejo de errores y auth.
- **Despliegue**: aún no definido (no hay Dockerfile ni CI en el repo); se documenta aquí cuando se decida.