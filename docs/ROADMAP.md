# Roadmap

Referencia visual y funcional: `C:\Develop\vacations-design-system` (prototipo estático: 14 pantallas, 3 roles). Sustituye a la dirección descrita hoy en `DESIGN_SYSTEM.md`.

Estado al 2026-11-09.

## 1. Estado actual

| Capa | Hecho | Falta frente al diseño |
|---|---|---|
| Backend | 15 plugins CRUD, soft delete, paginación/filtros/sort, Swagger, Bruno, login/refresh/logout/reset con bitácora | Ninguna ruta exige token, sin RBAC aplicado, sin reglas de negocio en avisos, sin cálculo de saldo, sin endpoints de dashboard/calendario |
| SDK | 4 de 15 recursos (health, employees, departments, shifts) | auth, notices, saldos, reglas, usuarios, roles/permisos, auditoría, company; tipos desfasados (`totalPages`, `sort`) |
| Frontend | `EmployeesPage` + formulario | Router, login, shell (sidebar/topbar), tokens del diseño, 13 pantallas |
| Git | `main` = Initial commit · `develop` = 7aa0e72 · `feature/notices` y `refactor/api-collections-management-pfs` sin merge | PRs, tests, CI, Docker |

## 2. Fixes

| Prioridad | Fix |
|---|---|
| 🔴 | La API está abierta: se emiten JWT pero no hay `server.auth.strategy` ni `auth.default` |
| 🔴 | Los usuarios del seed tienen `password_hash` placeholder: no se puede iniciar sesión |
| 🔴 | Aprobar un aviso es un `PATCH` genérico: sin validar transición de estado, `approved_by` viene del cliente |
| 🟠 | `jwtSecret` con valor por defecto (debe fallar en producción) y CORS `origin: ['*']` |
| 🟠 | Login por `username`; el diseño pide correo |
| 🟠 | SDK: `Pagination` sin `totalPages` y params sin `sort` |
| 🟡 | `DESIGN_SYSTEM.md` contradice el diseño nuevo; el frontend usa `--accent: #aa3bff` |
| ✅ | Documentación movida a `/docs` (VM-003) |

## 3. Decisiones de modelo pendientes

| Tema | Diseño | BD actual | Propuesta |
|---|---|---|---|
| Roles | Superusuario / Usuario / Empleado | ADMIN / HR / EMPLOYEE | Renombrar a `SUPERUSER / USER / EMPLOYEE` |
| Permisos | Matriz 14 módulos × view/create/update/delete/special | 7 códigos planos | Sembrar como `modulo:accion` y validar con scopes de Hapi en el JWT |
| Empresa / sedes | 1 empresa con N sucursales; Usuario ve solo sus sedes | Cada fila de `company` = empresa + estado | Tabla `branches` (empresa 1→N sedes), `departments.branch_id`, `user_branches` (multi-tenant) |
| Solicitudes vs Avisos | Pantallas separadas | Una tabla `notices` | Una tabla, filtro `?kind=vacation\|absence` según `reasons.affects_vacation_balance` |
| Horas | Saldo en días y horas según turno | `vacation_entitlements` solo `used_days` | Agregar `used_hours`; renombrar `remaining_days/hours` a `days_taken/hours_taken` |
| "Estados que puede revisar" | Checkbox por usuario | No existe | Confirmar con producto; si aplica, columna `text[]` en `users` |
| Correo del empleado | Visible en perfil | Solo en `users` | `employees.email` nullable |
| Auditoría | Eventos de negocio | Solo login | Generalizar a `audit_log` con `result` |

## 4. Estrategia de ramas

Git Flow ligero: `main` (releases con tag) ← `develop` (integración) ← `feature/*`, `fix/*`, `chore/*`. Todo entra por PR a `develop` con squash.

Cimientos en ramas horizontales; features como cortes verticales (backend + SDK + pantalla en la misma rama).

### Fase 0 — Consolidar

- `refactor/api-collections-management-pfs` → `develop` (incluye `feature/notices`), con el fix de tipos del SDK antes del merge. Borrar `feature/notices` después.

### Fase 1 — Seguridad

| Rama | Alcance |
|---|---|
| `fix/seed-real-credentials` | Hashes bcrypt reales, un usuario de prueba por rol |
| `feature/auth-guard` | Estrategia JWT + `auth.default` (públicas: health, login, refresh, reset, swagger); login por correo; `GET/PATCH /auth/me`, `POST /auth/me/password`; secreto obligatorio en prod; CORS desde `.env` |
| `feature/rbac-matrix` | Migración de roles y permisos `modulo:accion`; scopes en token; `scope` por ruta |
| `feature/branch-scoping` | `branches`, `user_branches`, migración de `company`; queries filtradas por sedes del usuario y, para Empleado, por su `employee_id` |

### Fase 2 — Dominio de vacaciones

| Rama | Alcance |
|---|---|
| `feature/notices-workflow` | `POST /notices/{id}/approve \| reject \| cancel` con máquina de estados; `approved_by` desde el token; motivos sin aprobación se aprueban solos; filtros `kind`, `from`/`to` |
| `feature/balance-engine` | Cálculo días/horas por turno en `backend/src/lib` con tests; `POST /notices/preview`; descuento al aprobar y devolución al cancelar en transacción; 422 si excede saldo o antigüedad < 1 año |
| `feature/entitlements-accrual` | `POST /vacation-entitlements/generate` idempotente; confirmar con RH periodo por aniversario (LFT) vs año calendario |
| `feature/dashboard-api` | `/dashboard/summary`, `/calendar?from&to`, `search` en empleados, conteos en departamentos, `/me/notifications` |
| `feature/audit-business-events` | Registrar aprobaciones, bajas y cambios de reglas con usuario y resultado |

### Fase 3 — Base del frontend

| Rama | Alcance |
|---|---|
| `feature/app-design-tokens` | Portar `styles.css` del prototipo (Inter, botón negro, `data-theme`, badges, drawer, dialog, toast); reescribir `DESIGN_SYSTEM.md` |
| `feature/sdk-auth-session` | Recurso `auth`, almacenamiento de token, refresh automático en 401 (una petición a la vez) |
| `feature/app-shell-auth` | React Router, login y recuperación de contraseña, `AuthProvider`, sidebar por grupos, topbar, guard por permiso, perfil |
| `feature/app-ui-kit` | Drawer, Dialog, Toast, DataTable con paginación, SearchSelect, StatusBadge, StatCard, EmptyState |

Evaluar TanStack Query en esta fase (caché, invalidación tras aprobar, estados de carga) antes de construir las 13 pantallas.

### Fase 4 — Pantallas

1. `feature/employees-screen` — rediseño con drawer de perfil, saldo e historial
2. `feature/vacation-requests` — Solicitudes con cálculo en vivo y aprobar/rechazar
3. `feature/absence-notices` — Avisos
4. `feature/balances-and-calendar` — Días y Calendario
5. `feature/dashboards` — admin y empleado
6. `feature/organization-screens` — Departamentos, Empresas, Turnos (bloques → `shift_schedules`), Reglas
7. `feature/admin-screens` — Usuarios, Roles y permisos, Auditoría
8. `feature/topbar-search-notifications`, `feature/settings-screen`

Release v0.1.0 (`develop` → `main`) al terminar los puntos 1 a 5.

### Fase 5 — Calidad (en paralelo desde la Fase 1)

- `chore/tests` — `server.inject` en rutas, unit tests del motor de saldo primero, SDK con `fetch` simulado, Vitest + RTL en flujos de aprobación.
- `chore/ci` — GitHub Actions en PR a `develop`: eslint, oxlint, typecheck, build del SDK, tests.
- `chore/docker-dev` — `docker-compose` con Postgres y `.env.example` completo.

## 5. Orden de ataque

Fase 0 → `fix/seed-real-credentials` → `feature/auth-guard`. Antes de `feature/rbac-matrix` y `feature/branch-scoping` se resuelven las decisiones de la sección 3 (en especial sedes y "estados que puede revisar").
