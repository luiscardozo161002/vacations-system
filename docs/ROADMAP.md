# Roadmap técnico

Revisión del backend del 17 de noviembre de 2026. Las reglas del producto y el diseño de interfaz viven en el [PRD](PRD.md) y el [sistema de diseño](DESIGN_SYSTEM.md).

## Estado actual

La API aplica JWT, RBAC y alcance por sede o empleado. El flujo de solicitudes incluye transiciones de estado, cálculo de saldo, generación de periodos, auditoría, calendario, dashboard y notificaciones. El SDK integra estos recursos y CI valida el backend, el SDK y el frontend. El entorno local usa PostgreSQL con Docker Compose o una instalación propia.

La primera revisión hizo atómica la rotación de tokens y los cambios de contraseña, unificó la validación de fechas de la API y parametrizó el rango del dashboard. Las convenciones para extender esos cambios están en [Arquitectura](ARCHITECTURE.md#consultas-y-transacciones).

## Prioridades del backend

| Prioridad | Hallazgo | Propuesta y criterio de aceptación |
| --- | --- | --- |
| P1 | El JWT conserva los permisos hasta vencer y Hapi acepta un token firmado aunque la cuenta haya cambiado de estado. El requisito de cambiar la contraseña temporal se aplica en el frontend. | Comprobar en la API el estado de la cuenta y de la sesión. Mientras esté pendiente el cambio de contraseña, permitir solo las operaciones de perfil y cambio de contraseña necesarias para completar el flujo. Cubrir baja, reenvío de acceso y cambio de permisos con un JWT emitido antes del cambio. |
| P1 | El login calcula intentos fallidos con una lectura y una escritura separadas. El límite por IP vive en memoria y solo cuenta `INVALID_CREDENTIALS`. | Registrar el incremento y el bloqueo de forma atómica y volver a comprobar el estado y las credenciales antes de emitir una sesión. Si el despliegue usa varias réplicas, compartir el límite por IP. Verificar intentos concurrentes y límites detrás de un proxy confiable. |
| P1 | El restablecimiento genera códigos y el correo de producción está pendiente. El perfil puede cambiar el correo usado para recuperar la cuenta. | Integrar la entrega, limitar los intentos de solicitud y confirmación, y verificar la titularidad del nuevo correo antes de usarlo para recuperación. Validar respuestas genéricas y el riesgo de exposición de códigos en entornos publicados. |
| P1 | El servicio de reglas comprueba solapamientos de antigüedad antes de escribir. Dos cambios simultáneos pueden superar esa validación. | Garantizar en PostgreSQL que las reglas activas del mismo año tengan rangos disjuntos. Migrar tras comprobar datos existentes. Ante un conflicto concurrente, una operación debe devolver `409 RULE_OVERLAP`. |
| P2 | La auditoría de negocio registra campos de la petición con una exclusión parcial de secretos. | Declarar los campos auditables por operación y limitar el tamaño de los metadatos. Verificar que entradas inválidas y campos anidados dejen fuera secretos y datos personales ajenos al evento. |
| P2 | La carga CSV guarda empleados, saldos y accesos en etapas distintas. Un fallo intermedio puede dejar cambios persistidos y cortar el reporte. | Definir la unidad de reintento, reutilizar las validaciones que correspondan y reportar el resultado de cada fila. Probar una falla de saldo o de acceso y la corrección al reintentar el mismo archivo. |
| P2 | Hay consultas de lectura en servicios de dashboard, calendario y notificaciones. La paginación usa ordenamientos que pueden tener empates. | Extraer por módulo las consultas que se comparten o conviene probar de forma aislada. Añadir la clave primaria como desempate al paginar. Medir los listados por sede y fecha con `EXPLAIN (ANALYZE, BUFFERS)` sobre consultas de lectura antes de elegir índices compuestos. |

## Estrategia de entrega

`main` recibe releases etiquetados y `develop` integra ramas `feature/*`, `fix/*` y `chore/*` mediante pull requests. Para cambios de backend, reproduce el fallo con una prueba del contrato HTTP o de concurrencia, ejecuta el lint y valida la suite contra PostgreSQL 17. Cuando cambie un contrato HTTP, incluye el SDK y el frontend en el mismo cambio.
