# Sistema de Vacaciones

Vacaciones y avisos de ausencia para RH. Monorepo con npm workspaces.

| Paquete | Contenido |
|---|---|
| `backend/` | API Hapi.js con PostgreSQL |
| `sdk/` | Cliente TypeScript de la API |
| `frontend/` | Aplicación React que consume el SDK |

## Documentación

| Documento | Contenido |
|---|---|
| [PRD](docs/PRD.md) | Producto, roles, reglas de negocio y pantallas |
| [Arquitectura](docs/ARCHITECTURE.md) | Capas, módulos, autenticación y decisiones |
| [Design System](docs/DESIGN_SYSTEM.md) | Reglas de interfaz y componentes |
| [Roadmap](docs/ROADMAP.md) | Estado y prioridades |

## Requisitos

- Node.js 24
- PostgreSQL 17, con Docker o instalado

## Arranque rápido

```bash
npm ci --legacy-peer-deps
cp backend/.env.example backend/.env
docker compose --env-file backend/.env up -d
npm run migrate --workspace=backend
npm run seed --workspace=backend
npm run build --workspace=sdk
npm run dev --workspace=backend
npm run dev --workspace=frontend
```

| Servicio | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/documentation |
| Frontend | http://localhost:5173 |

- Sin Docker: `createdb vacations_db` en lugar de `docker compose`.
- Si el puerto 5432 está ocupado, cambia `DB_PORT` en `backend/.env` antes de levantar el contenedor.
- Los datos viven en el volumen `pgdata`; `docker compose down -v` empieza de cero.
- Si la API responde 500 tras bajar cambios, falta una migración.

## Configuración

Todas las variables están en [`backend/.env.example`](backend/.env.example), cada una con su descripción y valor por defecto. Los schemas se validan al arrancar en [`config/index.js`](backend/src/config/index.js).

| Variable | Regla |
|---|---|
| `DB_NAME`, `DB_USER`, `JWT_SECRET` | Obligatorias |
| `JWT_SECRET` | Con `NODE_ENV=production`, al menos 32 caracteres |
| `TRUSTED_PROXIES` | IPs de los proxies delante de la API; vacía si no hay proxy |

Una variable inválida detiene el arranque y nombra la variable.

## Datos de prueba

`npm run seed --workspace=backend` borra la base y carga empresas, sedes, empleados, usuarios, vacaciones y avisos. No corre con `NODE_ENV=production`.

Contraseña de todos: `Vacaciones2026!`. Solo para desarrollo.

| Usuario | Correo | Rol | Empleado |
|---|---|---|---|
| `sysadmin` | sysadmin@grupo-jo.com | SUPERUSER | — |
| `r.jimenez` | r.jimenez@thh.com.mx | USER | Roberto Jimenez Cruz |
| `j.navarro` | j.navarro@jo.com.mx | EMPLOYEE | Jorge Luis Navarro |
| `j.perez` | j.perez@jo.com.mx | EMPLOYEE | Juan Perez Lopez |

`r.jimenez` atiende solo `THH_HGO` y ve 8 de los 12 empleados.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev --workspace=backend` | API con reinicio automático |
| `npm run start --workspace=backend` | API sin reinicio |
| `npm run migrate --workspace=backend` | Aplica migraciones |
| `npm run migrate:rollback --workspace=backend` | Revierte el último batch (`-- --all` revierte todo) |
| `npm run migrate:make --workspace=backend -- <nombre>` | Crea una migración |
| `npm run seed --workspace=backend` | Borra e inserta los datos de prueba |
| `npm run lint --workspace=backend` | ESLint del backend |
| `npm test --workspace=backend` | Pruebas del backend |
| `npm run build --workspace=sdk` | Compila el SDK (`dev` en modo watch) |
| `npm test --workspace=sdk` | Pruebas del SDK |
| `npm run dev --workspace=frontend` | Frontend con Vite |
| `npm test --workspace=frontend` | Pruebas del frontend |

## Pruebas

| Paquete | Herramienta | Notas |
|---|---|---|
| Backend | `node:test` y `server.inject` | Usa `vacations_test`; `TEST_DB_NAME` debe terminar en `_test`; los archivos corren uno por uno |
| SDK | `node:test` | Simula `fetch`; no necesita la API |
| Frontend | Vitest, jsdom y Testing Library | Simula el SDK |

El usuario de PostgreSQL necesita permiso para crear la base y acceso a `postgres`. Cada ejecución del backend aplica las migraciones y reemplaza los datos de prueba.

## Integración continua

[`ci.yml`](.github/workflows/ci.yml) corre en cada pull request y en cada push a `develop` y `main`, con PostgreSQL 17:

1. Lint del backend y del frontend
2. Build y pruebas del SDK
3. Typecheck y build del frontend
4. Pruebas del frontend y del backend

Para bloquear merges con CI en rojo, activa la protección de ramas en `develop` y `main` con el check `build-and-test`.

## API

| Herramienta | Uso |
|---|---|
| Swagger | `/documentation` y `/swagger.json`, generados desde los schemas Joi |
| [Bruno](backend/src/doc/bruno/) | Un request por endpoint; corre **Auth → Login** y las demás heredan el token |

- Todo requiere `Authorization: Bearer <accessToken>`, salvo `/health`, `/auth/*` públicas y Swagger.
- Los errores tienen una sola forma: `{ "error": { "code": "...", "message": "..." } }`.
- `hapi-swagger` declara Joi 17 como peer y la API usa Joi 18, por eso se instala con `--legacy-peer-deps`. Al actualizar cualquiera, comprueba que `GET /swagger.json` responda 200.

## SDK

```ts
const sdk = new VacationsSdk({
  baseUrl: 'http://localhost:3000',
  storage: myStorage,
  onSessionExpired: () => navigate('/login'),
});

await sdk.auth.login({ email, password });
const page = await sdk.employees.list({ status: ['active'], page: 1 });
```

| Tema | Detalle |
|---|---|
| Recursos | `auth`, `health`, `companies`, `branches`, `departments`, `employees`, `shifts`, `notices`, `reasons`, `vacationEntitlements`, `accrualRules`, `users`, `roles`, `permissions`, `rolePermissions`, `auditLog`, `calendar`, `dashboard`, `notifications` |
| CRUD | Los catálogos heredan de `CrudResource`: `list`, `get`, `create`, `update`, `remove` |
| Sesión | En un `401` renueva con el refresh token y reintenta una vez; si falla, borra los tokens y llama `onSessionExpired` |
| Tokens | En memoria por defecto; `storage` con `get()` y `set()` los guarda en otro lugar |

## Proxy local con NGINX (Windows)

[`nginx/development.conf`](nginx/development.conf) publica la API en `127.0.0.1:8080` y la reenvía a Hapi en `127.0.0.1:3000`. NGINX reemplaza `X-Forwarded-For` y se conecta desde `127.0.0.2`.

| Archivo | Valores |
|---|---|
| `backend/.env` | `HOST=127.0.0.1`, `PORT=3000`, `TRUSTED_PROXIES=127.0.0.2` |
| `frontend/.env` | `VITE_API_BASE_URL=http://127.0.0.1:8080` |

Extrae [NGINX para Windows](https://nginx.org/en/download.html) en `.nginx` y, en PowerShell, ajusta la versión:

```powershell
$nginxRoot = (Resolve-Path .\.nginx\nginx-1.31.8).Path.Replace('\', '/')
$nginxConfig = (Resolve-Path .\nginx\development.conf).Path.Replace('\', '/')
& "$nginxRoot/nginx.exe" -p "$nginxRoot/" -c $nginxConfig -t
Start-Process -FilePath "$nginxRoot/nginx.exe" -WorkingDirectory $nginxRoot `
  -ArgumentList '-c', ('"{0}"' -f $nginxConfig) -WindowStyle Hidden
Invoke-RestMethod http://127.0.0.1:8080/api/v1/health
```

Para detenerlo: `& "$nginxRoot/nginx.exe" -p "$nginxRoot/" -c $nginxConfig -s quit`.
