# Product Requirements Document

## Producto
Sistema de Vacaciones y Avisos de Ausencia: herramienta interna de RH para tres empresas del grupo, cada una con sedes en varios estados.

## Problema
El cálculo de vacaciones y el seguimiento de avisos de ausencia se hacían de forma manual, sin trazabilidad de quién aprobó qué, sin aplicar de forma consistente la reforma "vacaciones dignas" (Art. 76 LFT, vigente desde 2023), y sin una fuente única de verdad sobre antigüedad, saldo de días y motivos de ausencia.

## Usuarios objetivo

| Rol | Código | Quién es | Alcance |
|---|---|---|---|
| Superusuario | `SUPERUSER` | Administración del sistema | Todas las empresas y sedes |
| Usuario | `USER` | Personal de RH | Solo sus sedes (una o varias) |
| Empleado | `EMPLOYEE` | Cualquier trabajador | Solo sus propios datos |

Solo existen estos 3 roles y cada uno puede tener muchos usuarios.

## Funcionalidades

Construidas:
- [x] Catálogo de empresas, departamentos, turnos y empleados (CRUD completo, soft delete).
- [x] Autenticación con JWT, sesiones, bloqueo por intentos fallidos, reseteo de contraseña.
- [x] Reglas de acumulación de vacaciones (`vacation_accrual_rules`) conforme a la reforma 2023.
- [x] Cálculo de días y horas de una solicitud según el turno (`backend/src/lib/request-breakdown.js`).
- [x] Documentación interactiva de la API (Swagger) y colección Bruno.
- [x] Login, shell, kit de componentes, perfil, configuración de apariencia y pantalla de Empleados.

Pendientes:
- [ ] Sedes y alcance por usuario; matriz de permisos por módulo.
- [ ] Flujo de solicitudes y avisos con saldo, festivos y PDF.
- [ ] Generación de periodos por aniversario y recordatorio antes de vencer.
- [ ] Notificaciones en el sistema y por correo.
- [ ] Pantallas restantes del prototipo.

## Organización

- **Empresas.** Cada una guarda razón social, RFC, logo, teléfono y dirección fiscal.

  | Código | Razón social | RFC | Dirección fiscal |
  |---|---|---|---|
  | JOR | JUÁREZ DE ORIENTE S.A. DE C.V. | JOR070518U13 | 4 Norte 8 B5, Col. Centro, Tecamachalco, Puebla, CP. 75480 |
  | THH | TRANSPORTES HIDRO HIDALGUENSES S.A. DE C.V. | THH981218DS0 | Av. Tulancingo, No. 103, San Miguel Vindhó, Tula de Allende, Hidalgo |
  | UMJ | UNIDAD MÉDICA INTEGRAL HIDALGUENSE, C.J. S.A. de C.V. | UMI1007285C1 | Zimapán s/n, Colonia San Miguel Vindhó, Tula de Allende, Hidalgo C.P. 42842 |

- **Sedes.** Una empresa tiene varias sedes, y las sedes no llevan dirección.

  | Empresa | Sedes |
  |---|---|
  | JOR | `JOR_CAMP` Campeche, `JOR_PUEB` Puebla, `JOR_HGO` Hidalgo |
  | THH | `THH_AGS` Aguascalientes, `THH_HGO` Hidalgo, `THH_PUE` Puebla |
  | UMJ | `UMJ_HGO` Hidalgo |

- **Departamentos.** Cada departamento pertenece a una sede.
- **Usuarios de RH.** Un Usuario de RH tiene asignadas una o varias sedes. No ve nada de las demás.
- **Número de socio.** Es el número de empleado.

## Permisos por rol

Esta es la matriz del prototipo, ajustada con lo que respondió RH. **V** ver, **C** crear, **E** editar, **B** borrar o desactivar, **★** acción especial.

| Módulo | Superusuario | Usuario (RH) | Empleado |
|---|---|---|---|
| Dashboard | ★ | ★ | ★ (su resumen) |
| Empleados | V C E B | V C E B (sus sedes) | — |
| Solicitudes | V C E B | V E | V C (las suyas) |
| Aprobaciones | ★ | ★ según sus estados | — |
| Avisos | V C E | V C E | V (los suyos) |
| Calendario | V | V | V (suyo y de su departamento) |
| Días | V E | V E | V (los suyos) |
| Departamentos | V E | V E | — |
| Empresas | V | V | — |
| Turnos | V C E | V E | — |
| Reglas | V E | V E | — |
| Usuarios | V C E B | — | — |
| Roles y permisos | V E | — | — |
| Auditoría | V | — | — |
| Configuración | ✓ | ✓ | ✓ |

- **Estados que puede revisar.** El Superusuario marca, para cada Usuario de RH, qué acciones puede hacer: aprobar, rechazar y cancelar. Las tres vienen activadas por defecto.
- **Administración.** El Superusuario da de alta usuarios y les asigna empresa, sedes y estados. También administra roles, permisos y auditoría.

## Reglas de negocio

### Solicitudes y avisos

Las dos cosas viven en la tabla `notices`; lo que las distingue es quién las crea.

| | Solicitud | Aviso |
|---|---|---|
| Quién la crea | El empleado, para sí mismo | RH, para un empleado de sus sedes |
| Estado inicial | `pending` | `approved` |
| Quién la resuelve | RH de la sede del empleado, en un solo nivel | Nace aprobado |
| Pantalla del empleado | Solicitudes | Avisos |

- **Motivos.** Son Permiso Personal, Castigo, Onomástico, Comisión De Trabajo, Tiempo Por Tiempo, Natalicio, Deceso y Vacaciones. Todos requieren aprobación cuando son solicitud.
- **Qué descuenta.** Solo el motivo **Vacaciones** descuenta saldo, y lo hace en el momento en que queda aprobado. Un aviso de Vacaciones descuenta al registrarse.
- **Cómo registra RH un aviso.** Busca al empleado por número o por nombre y captura un rango de fechas o un rango de horas, por ejemplo de 13:00 a 16:00. Antes de guardar ve los días y horas que se van a usar y los que quedan. El empleado ve los mismos datos al crear su solicitud.
- **Transiciones permitidas:**
  - `pending → approved | rejected | cancelled`
  - `approved → cancelled`, solo si la ausencia todavía no empieza; si descontó saldo, el saldo se devuelve.
  - Cualquier otra transición responde 409.
- **Quién resuelve.** RH aprueba, rechaza o cancela solo dentro de sus sedes y solo con los estados que tiene permitidos.

### Saldo y periodo

- **Periodo.** Va de aniversario a aniversario según la fecha de ingreso. Los días que corresponden salen de la tabla del Art. 76 LFT:

  | Años cumplidos | 1 | 2 | 3 | 4 | 5 | 6–10 | 11–15 | 16–20 | 21–25 | 26–30 | 31–35 |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | Días | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28 | 30 | 32 |

- **Menos de 1 año.** Sin saldo; no puede pedir Vacaciones.
- **No hay acumulación.** Al cumplir años, lo que no se usó se elimina y se abre el nuevo periodo con los días de la nueva antigüedad. Las solicitudes de Vacaciones que siguen pendientes del periodo que cierra se cancelan.
- **Recordatorio.** Una semana antes del aniversario, el empleado recibe un aviso con los días que le quedan, para que los use antes de que venzan.
- **Fechas dentro del periodo.** Una solicitud tiene que caer completa dentro del periodo abierto: no puede cruzar el aniversario ni pedir fechas del periodo siguiente.
- **Saldo insuficiente.** Si una solicitud o un aviso de Vacaciones excede el saldo, se bloquea con 422.
- **Arranque del sistema.** RH captura cuántos días usó ya cada empleado en su periodo vigente.

**Ejemplo.** Un empleado entró el 3 de julio de 2022.

- El 3 de julio de 2026 cumple 4 años: su periodo va del 3 de julio de 2026 al 2 de julio de 2027 y le corresponden 18 días.
- El 26 de junio de 2027 recibe el recordatorio con los días que le quedan.
- El 3 de julio de 2027 se le borra lo que no usó y se abre el periodo de 5 años, con 20 días.
- Una solicitud del 29 de junio al 7 de julio de 2027 se rechaza porque cruza el aniversario. La parte desde el 3 de julio se pide como otra solicitud.

### Días y horas

- **Días hábiles.** Solo cuentan los días laborables del turno del empleado. Los días de descanso del turno y los festivos de la ley no se descuentan.
- **Un día equivale a la jornada del turno.** Con Oficinas (lunes a viernes, 07:00 a 16:00) un día son 9 horas. Las horas sueltas se juntan en días: 2 días de 10:00 a 14:00 en Oficinas = 8 horas.
- **Vacaciones por horas.** Se permiten: de 13:00 a 16:00 en Oficinas descuenta 3 horas.
- **Ejemplo real de RH.** Del 16 de octubre al 19 de diciembre de 2025, con turno de lunes a sábado, son 55 días: no cuentan los domingos ni el 17 de noviembre.

### Festivos

- **Cuáles son.** Los obligatorios del Art. 74 LFT, calculados por el sistema para cada año:
  - 1 de enero, primer lunes de febrero, tercer lunes de marzo, 1 de mayo, 16 de septiembre, tercer lunes de noviembre y 25 de diciembre;
  - el 1 de octubre de cada seis años, cuando hay cambio del Poder Ejecutivo Federal (siguiente: 2030).
- **Calendario.** Los festivos se muestran ahí.
- **En un rango.** Si un rango incluye un festivo, ese día no se descuenta.
- **Solo festivos.** Si todos los días pedidos son festivos, se rechaza para cualquier rol con el mensaje "Ese día no se puede porque es descanso obligatorio por la Ley Federal del Trabajo".

### Calendario

- **Empleado.** Ve sus ausencias y las de su departamento.
- **Ausencias del departamento.** Cada departamento tiene una opción para mostrarlas a sus empleados; viene activada por defecto y RH la puede apagar.
- **RH.** Ve todo lo de sus sedes.

### Formato de aviso de ausencia (PDF)

- **Cuándo se descarga.** Una vez aprobado, lo descargan el empleado (desde su solicitud o aviso) y RH (desde el registro).
- **Hoja.** Lleva dos copias iguales separadas por una línea punteada.
- **Encabezado.**
  - Datos de la empresa del empleado: logo, razón social, dirección fiscal, RFC, teléfono y fax.
  - "AVISO DE AUSENCIA" con `NO.` igual al ID del aviso, y la fecha de solicitud.
- **Datos del empleado.** No. Trab., Nombre, Departamento y Encargado; Encargado dice "RECURSOS HUMANOS".
- **Motivo, con un renglón por tipo.**
  - `DÍAS Del 01-Noviembre-2026 al 03-Noviembre-2026, Número de Días: 3`
  - `HORAS de las 13:00 a las 14:00 hrs, Número de Horas: 1`
  - Si solo hay días u horas, sale solo ese renglón.
- **Leyenda.** Días y horas restantes del periodo.
- **Obs.** Las observaciones del aviso, si las hay.
- **Firmas.** Tres líneas para firmar en papel: Recursos Humanos, Enc. Departamento e Interesado.
- **Teléfono.** Por ahora es el mismo para las tres empresas, `01-773-78-50497 / 504-98 / 500-09, FAX 506-22`. Después pasa a un dato por empresa.

### Notificaciones

- **Canales.** Todas llegan dentro del sistema y al correo del usuario, enviadas con Resend.
- **Al empleado:**
  - le aprobaron, rechazaron o cancelaron una solicitud;
  - RH le registró un aviso;
  - recordatorio una semana antes del aniversario;
  - se abrió su nuevo periodo.
- **A RH de la sede:** llegó una solicitud nueva.

### Cuentas de empleados

- **Alta.** Cuando RH da de alta un empleado con su correo, el sistema crea su cuenta de Empleado.
  - Le manda por correo una contraseña temporal válida 1 mes.
  - El empleado debe cambiarla en ese mes. Si no lo hace, la temporal se elimina y no puede entrar.
- **Reactivación.** El empleado acude a RH, que le reenvía un correo para confirmar su dirección y definir su contraseña.

### Convenciones de la API

Todo endpoint de listado soporta paginación (`page`/`pageSize`, con `totalPages` en la respuesta), filtros por query param propios de cada recurso, y orden (`sort=campo` o `sort=-campo` para descendente). La lógica compartida vive en `backend/src/lib/list-query.js`.

## Métricas de éxito

- Tiempo para resolver una solicitud (de solicitada a aprobada o rechazada).
- % de solicitudes y avisos con trazabilidad completa (quién aprobó, cuándo).
- Reducción de discrepancias en el cálculo de saldo de vacaciones frente al método manual anterior.
- % de empleados activos con al menos un aviso registrado en el sistema.
