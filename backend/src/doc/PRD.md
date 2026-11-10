# Product Requirements Document

## Producto
Sistema de Vacaciones y Avisos de Ausencia — herramienta interna de RH para Cooperativa Juárez SCL, con soporte multi-empresa (vía la entidad `company`) por si se adopta en más de una organización.

## Problema
El cálculo de vacaciones y el seguimiento de avisos de ausencia se hacían de forma manual, sin trazabilidad de quién aprobó qué, sin aplicar de forma consistente la reforma "vacaciones dignas" (Art. 76 LFT, vigente desde 2023), y sin una fuente única de verdad sobre antigüedad, saldo de días y motivos de ausencia.

## Usuarios objetivo
- **RH / Administración** — da de alta empresas, departamentos, turnos y empleados; gestiona usuarios y roles.
- **Jefes de departamento** — aprueban o rechazan avisos de ausencia de su equipo.
- **Empleados** — consultan su saldo de vacaciones y solicitan avisos de ausencia.

## Funcionalidades

Construidas:
- [x] Catálogo de empresas, departamentos, turnos y empleados (CRUD completo, soft delete).
- [x] Autenticación con JWT, sesiones, bloqueo por intentos fallidos, reseteo de contraseña.
- [x] RBAC: roles y permisos asignables.
- [x] Reglas de acumulación de vacaciones (`vacation_accrual_rules`) conforme a la reforma 2023.
- [x] Documentación interactiva de la API (Swagger) y colección Bruno.
- [x] Pantalla de frontend de Empleados.

En construcción / pendiente:
- [ ] Endpoints de negocio del módulo de avisos (`notices`): solicitud, aprobación/rechazo, saldo restante.
- [ ] Pantallas de frontend para Departamentos, Turnos y Avisos.
- [ ] Reportes: resumen de avisos por motivo/estatus, bitácora de auditoría visible en UI.

## Reglas de negocio clave

- La antigüedad y los días de vacaciones que le corresponden a cada empleado se calculan contra `vacation_accrual_rules` según su fecha de ingreso (reforma "vacaciones dignas", Art. 76 LFT).
- Un aviso de ausencia (`notice`) tiene estatus `pending → approved | rejected`, o `cancelled`; solo los avisos `approved` descuentan del saldo.
- Las 10 consultas documentadas al final de `vacations_db_postgresql.sql` (raíz del repo) son la especificación de referencia para estos cálculos hasta que queden implementadas como endpoints.
- Todo endpoint de listado soporta paginación (`page`/`pageSize`, con `totalPages` en la respuesta), filtros por query param propios de cada recurso, y orden (`sort=campo` o `sort=-campo` para descendente). La lógica compartida vive en `backend/src/lib/list-query.js`.

## Métricas de éxito

- Tiempo para resolver un aviso de ausencia (de solicitado a aprobado/rechazado).
- % de avisos con trazabilidad completa (quién aprobó, cuándo).
- Reducción de discrepancias en el cálculo de saldo de vacaciones frente al método manual anterior.
- % de empleados activos con al menos un aviso registrado en el sistema.
