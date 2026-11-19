# Roadmap

Revisión del 18 de noviembre de 2026. Producto en el [PRD](PRD.md), diseño en el [Design System](DESIGN_SYSTEM.md) y técnica en la [Arquitectura](ARCHITECTURE.md).

## Estado

| Área | Estado |
|---|---|
| Autenticación, RBAC y alcance por sede | Hecho |
| Catálogos: empresas, sedes, departamentos, turnos, empleados, reglas | Hecho |
| Solicitudes y avisos con saldo, festivos y PDF | Hecho |
| Periodos por aniversario y recordatorios | Hecho |
| Notificaciones dentro del sistema | Hecho |
| Auditoría, calendario y dashboard | Hecho |
| SDK, 14 pantallas del frontend y CI | Hecho |
| Configuración por variables de entorno con schema | Hecho |
| Correo con Resend | Pendiente: credenciales |
| Hosting y proxy de producción | Pendiente: definir |
| Pruebas de aceptación con RH | Pendiente |
| Carga inicial de empleados | Bloqueado: método y archivo de RH |

## Prioridades del backend

| Prioridad | Hallazgo | Criterio de aceptación |
|---|---|---|
| P1 | El JWT conserva permisos hasta vencer; el cambio de contraseña temporal solo se exige en el frontend | La API comprueba cuenta y sesión; con cambio pendiente solo permite perfil y contraseña. Pruebas con un JWT anterior a una baja, un reenvío de acceso y un cambio de permisos |
| P1 | El login lee y escribe los intentos fallidos por separado; el límite por IP vive en memoria | Incremento y bloqueo atómicos; límite compartido si hay varias réplicas. Pruebas de concurrencia y de proxy confiable |
| P1 | El restablecimiento genera códigos sin correo; el perfil puede cambiar el correo de recuperación | Entrega por correo, límite de intentos y verificación del correo nuevo |
| P1 | Dos cambios simultáneos pueden solapar reglas de acumulación | Restricción en PostgreSQL con rangos disjuntos por año; el conflicto responde `409 RULE_OVERLAP` |
| P2 | La auditoría excluye secretos solo en el primer nivel | Campos auditables por operación, tamaño de metadatos limitado y pruebas con campos anidados |
| P2 | Los listados paginan con ordenamientos que pueden empatar | Clave primaria como desempate; medir con `EXPLAIN (ANALYZE, BUFFERS)` antes de crear índices |

## Siguiente

| Orden | Trabajo |
|---|---|
| 1 | Refactor del SDK |
| 2 | Refactor del frontend |
| 3 | Prioridades P1 del backend |
| 4 | Resend, hosting y pruebas con RH |

## Entrega

- `main` recibe releases etiquetados; `develop` integra ramas `feature/*`, `fix/*` y `chore/*` por pull request.
- Un cambio de backend lleva una prueba del contrato HTTP o de concurrencia, lint y la suite contra PostgreSQL 17.
- Si cambia un contrato HTTP, el mismo cambio incluye el SDK y el frontend.
