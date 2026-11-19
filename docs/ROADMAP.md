# Roadmap

Prioriza la evolución del producto y define cómo comprobar cada entrega.

[Producto](PRD.md) · [Arquitectura](ARCHITECTURE.md) · [Sistema de diseño](DESIGN_SYSTEM.md)

Revisión del 18 de noviembre de 2026.

## Estado del producto

| Área | Situación en el repositorio |
| --- | --- |
| Acceso | JWT, renovación de sesión, RBAC y alcance por sede |
| Organización | Empresas, sedes, departamentos, turnos y empleados |
| Ausencias | Solicitudes, avisos, cálculo de saldo, calendario y PDF |
| Periodos | Generación por aniversario y recordatorios |
| Seguimiento | Auditoría, dashboard y notificaciones internas |
| Clientes | SDK TypeScript e interfaz React por módulos |
| Calidad | Pruebas por paquete y pipeline de integración continua |

La aceptación operativa depende de la revisión de Recursos Humanos y de la preparación del entorno de producción.

## Siguiente entrega

| Orden | Trabajo | Resultado verificable |
| --- | --- | --- |
| 1 | Consolidar el SDK | Recursos y tipos coherentes, renovación de sesión y errores cubiertos por pruebas |
| 2 | Consolidar el frontend | Consumo consistente del SDK, formularios reutilizables y pruebas de flujos principales |
| 3 | Reforzar seguridad e integridad | Cerrar los pendientes de la siguiente sección |
| 4 | Preparar la puesta en operación | Entrega de correo, entorno de producción y aceptación con Recursos Humanos |

## Seguridad e integridad

### Prioridad alta

| Pendiente | Criterio de cierre |
| --- | --- |
| Revocación y contraseña temporal | La API comprueba el estado de cuenta y sesión. Mientras esté pendiente el cambio de contraseña, permite las operaciones necesarias para completarlo |
| Intentos de login concurrentes | El incremento y el bloqueo por cuenta son atómicos y tienen pruebas concurrentes |
| Recuperación y cambio de correo | La recuperación cuenta con entrega y límite de intentos. El correo nuevo se verifica antes de usarse para recuperar acceso |
| Reglas de acumulación concurrentes | PostgreSQL garantiza rangos de antigüedad disjuntos por año. El conflicto se traduce a un error de negocio |

La validación de revocación debe cubrir un access token emitido antes de la baja, del reenvío de acceso y del cambio de permisos. El límite por IP deberá compartirse si el despliegue utiliza varias instancias.

### Prioridad media

| Pendiente | Criterio de cierre |
| --- | --- |
| Metadatos de auditoría | Cada evento declara campos auditables y límites de tamaño. Las pruebas incluyen entradas anidadas con secretos |
| Paginación estable | Los ordenamientos tienen desempate por clave primaria y conservan el resultado entre páginas |
| Rendimiento de listados | Las consultas por sede y fecha se miden antes de añadir índices |

## Integraciones y puesta en operación

| Trabajo | Dependencia | Criterio de cierre |
| --- | --- | --- |
| Correo con Resend | Integración, credenciales y remitente autorizado | Recuperación y notificaciones entregadas en el entorno de aceptación |
| Entorno de producción | Hosting, dominio y proxy definidos | Despliegue documentado y acceso a la API verificado a través del proxy |
| Carga inicial | Método de carga y datos de Recursos Humanos | Empleados, fechas de ingreso y saldos conciliados |
| Aceptación de Recursos Humanos | Datos iniciales y entorno disponible | Flujos del PRD revisados y observaciones resueltas |

El envío por correo requiere implementación. La elección de Resend está prevista en la planificación del proyecto.

## Criterios de entrega

- Cada paquete afectado pasa sus pruebas y las comprobaciones del pipeline.
- Un cambio de contrato conserva la compatibilidad entre backend, SDK y frontend.
- Los cambios de esquema incluyen migraciones y verificación sobre PostgreSQL.
- Los cambios visuales revisan temas, navegación por teclado y tamaños de pantalla.
- Las reglas, los estados de avance y sus documentos se actualizan en el mismo cambio.

El flujo de integración usa pull requests hacia `develop` y releases etiquetados desde `main`. El historial y el seguimiento de cambios concretos se conservan en Git y en sus pull requests.

## Referencias

El roadmap organiza resultados, prioridades y dependencias según las guías de planificación de producto de Atlassian. El orden refleja la planificación existente del proyecto. [Guía de roadmaps](https://www.atlassian.com/agile/product-management/product-roadmaps)
