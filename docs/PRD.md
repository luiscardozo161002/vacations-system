# Product Requirements Document

## Producto

Sistema de vacaciones y avisos de ausencia para el área de RH de tres empresas del grupo, con sedes en varios estados.

## Problema

| Antes | Con el sistema |
|---|---|
| Cálculo manual de vacaciones | Saldo calculado por antigüedad con el Art. 76 LFT (reforma 2023) |
| Sin rastro de quién aprobó | Auditoría de cada acción |
| Sin fuente única de datos | Antigüedad, saldo y motivos en un solo lugar |

## Roles

| Rol | Código | Alcance |
|---|---|---|
| Superusuario | `SUPERUSER` | Todas las empresas y sedes |
| Usuario (RH) | `USER` | Solo sus sedes |
| Empleado | `EMPLOYEE` | Solo sus datos |

Un rol puede tener muchos usuarios.

## Organización

| Empresa | Código | RFC | Sedes |
|---|---|---|---|
| Juárez de Oriente S.A. de C.V. | JOR | JOR070518U13 | `JOR_CAMP`, `JOR_PUEB`, `JOR_HGO` |
| Transportes Hidro Hidalguenses S.A. de C.V. | THH | THH981218DS0 | `THH_AGS`, `THH_HGO`, `THH_PUE` |
| Unidad Médica Integral Hidalguense, C.J. S.A. de C.V. | UMJ | UMI1007285C1 | `UMJ_HGO` |

- Cada empresa guarda razón social, RFC, logo, teléfono y dirección fiscal. Las sedes no llevan dirección.
- Cada departamento pertenece a una sede.
- Un Usuario de RH ve solo las sedes que tiene asignadas.
- El número de socio es el número de empleado.

## Permisos por rol

**V** ver, **C** crear, **E** editar, **B** borrar o desactivar, **★** acción especial.

| Módulo | Superusuario | Usuario (RH) | Empleado |
|---|---|---|---|
| Dashboard | ★ | ★ | ★ su resumen |
| Empleados | V C E B | V C E B de sus sedes | — |
| Solicitudes | V C E B | V E | V C las suyas |
| Aprobaciones | ★ | ★ según sus estados | — |
| Avisos | V C E | V C E | V los suyos |
| Calendario | V | V | V suyo y de su departamento |
| Días | V E | V E | V los suyos |
| Departamentos | V E | V E | — |
| Empresas | V | V | — |
| Turnos | V C E | V E | — |
| Reglas | V E | V E | — |
| Usuarios | V C E B | — | — |
| Roles y permisos | V E | — | — |
| Auditoría | V | — | — |
| Configuración | ✓ | ✓ | ✓ |

El Superusuario da de alta usuarios, asigna sedes y define qué acciones de revisión (aprobar, rechazar, cancelar) puede hacer cada Usuario de RH. Las tres vienen activadas.

## Reglas de negocio

### Solicitudes y avisos

Viven en la tabla `notices`; las distingue quién las crea.

| | Solicitud | Aviso |
|---|---|---|
| Crea | El empleado, para sí | RH, para un empleado de sus sedes |
| Estado inicial | `pending` | `approved` |
| Resuelve | RH de la sede, un solo nivel | Nace aprobado |
| Pantalla del empleado | Solicitudes | Avisos |

| Transición | Condición |
|---|---|
| `pending` → `approved`, `rejected` o `cancelled` | RH dentro de sus sedes y con la acción permitida; el Empleado solo cancela las suyas |
| `approved` → `cancelled` | Solo si la ausencia no empezó; devuelve el saldo |
| Cualquier otra | `409` |

- **Motivos:** Permiso Personal, Castigo, Onomástico, Comisión De Trabajo, Tiempo Por Tiempo, Natalicio, Deceso y Vacaciones. Todos requieren aprobación cuando son solicitud.
- **Descuento:** solo Vacaciones. Se descuenta al aprobar, o al registrar si es aviso.
- **Captura:** RH busca al empleado por número o nombre y captura fechas u horas. Antes de guardar ve lo que se usa y lo que queda.

### Saldo y periodo

Va de aniversario a aniversario según la fecha de ingreso. Días por antigüedad (Art. 76 LFT):

| Años | 1 | 2 | 3 | 4 | 5 | 6–10 | 11–15 | 16–20 | 21–25 | 26–30 | 31–35 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Días | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28 | 30 | 32 |

| Regla | Detalle |
|---|---|
| Menos de 1 año | Sin saldo; no puede pedir Vacaciones |
| Sin acumulación | Al cumplir años, lo no usado se elimina y se abre el nuevo periodo |
| Pendientes al cerrar | Las solicitudes de Vacaciones pendientes del periodo que cierra se cancelan |
| Recordatorio | Una semana antes del aniversario, con los días restantes |
| Fechas | La solicitud cae completa dentro del periodo abierto |
| Saldo insuficiente | `422` |
| Arranque | RH captura los días que cada empleado ya usó en su periodo vigente |

**Ejemplo.** Ingreso el 3 de julio de 2022:

| Fecha | Qué pasa |
|---|---|
| 3 jul 2026 | Cumple 4 años; periodo del 3 jul 2026 al 2 jul 2027 con 18 días |
| 26 jun 2027 | Recordatorio con los días restantes |
| 3 jul 2027 | Se borra lo no usado y abre el periodo de 5 años con 20 días |
| 29 jun – 7 jul 2027 | Se rechaza por cruzar el aniversario; la parte desde el 3 jul va como otra solicitud |

### Días y horas

| Regla | Detalle |
|---|---|
| Días hábiles | Solo los laborables del turno; no se descuentan descansos del turno ni festivos |
| Un día | Equivale a la jornada del turno; en Oficinas (lun–vie, 07:00 a 16:00) son 9 horas |
| Por horas | Permitido: de 13:00 a 16:00 en Oficinas descuenta 3 horas |
| Ejemplo de RH | Del 16 oct al 19 dic 2025 con turno lun–sáb son 55 días: sin domingos ni el 17 de noviembre |

### Festivos

Obligatorios del Art. 74 LFT, calculados por año:

- 1 de enero, primer lunes de febrero, tercer lunes de marzo, 1 de mayo, 16 de septiembre, tercer lunes de noviembre y 25 de diciembre.
- 1 de octubre cada seis años por el cambio del Poder Ejecutivo Federal (siguiente: 2030).

Se muestran en el calendario y no se descuentan. Si todos los días pedidos son festivos se rechaza, para cualquier rol.

### Calendario

| Rol | Ve |
|---|---|
| Empleado | Sus ausencias y las de su departamento, si este las comparte |
| RH | Todo lo de sus sedes |

Cada departamento tiene la opción de compartir ausencias; viene activada y RH la puede apagar.

### Aviso de ausencia (PDF)

Se descarga una vez aprobado, por el empleado y por RH.

| Parte | Contenido |
|---|---|
| Hoja | Carta, dos copias iguales separadas por línea punteada |
| Encabezado | Logo, razón social, dirección fiscal, RFC, teléfono y fax de la empresa; "AVISO DE AUSENCIA" con `NO.` igual al id y la fecha de solicitud |
| Empleado | No. Trab., Nombre, Departamento y Encargado ("RECURSOS HUMANOS") |
| Motivo | Un renglón de días y otro de horas, solo los que apliquen |
| Leyenda | Días y horas restantes del periodo |
| Obs. | Observaciones, si hay |
| Firmas | Recursos Humanos, Enc. Departamento e Interesado |

Hasta que haya teléfono por empresa se usa el mismo para las tres (`PDF_DEFAULT_PHONE`).

### Notificaciones

Llegan dentro del sistema y por correo con Resend.

| Para | Evento |
|---|---|
| Empleado | Aprobaron, rechazaron o cancelaron su solicitud |
| Empleado | RH le registró un aviso |
| Empleado | Recordatorio una semana antes del aniversario |
| Empleado | Se abrió su nuevo periodo |
| RH de la sede | Llegó una solicitud nueva |

### Cuentas de empleados

| Paso | Regla |
|---|---|
| Alta | RH da de alta al empleado con correo y el sistema crea su cuenta |
| Contraseña temporal | Válida 1 mes; si no se cambia, se elimina y no puede entrar |
| Reactivación | El empleado acude a RH, que reenvía el acceso |
| Sin Resend | La API devuelve la temporal a RH para entregarla en mano |

### Convenciones de la API

Todo listado soporta paginación (`page`, `pageSize`), orden (`sort=campo` o `sort=-campo`) y filtros propios.

## Pantallas

| Pantalla | Quién | Qué hace |
|---|---|---|
| Dashboard | Todos | Indicadores, próximas ausencias, actividad y, para el Empleado, su saldo |
| Empleados | RH | Búsqueda, perfil con saldo e historial, alta, baja, acceso y exportación CSV |
| Solicitudes | Todos | Lista, cálculo en vivo, aprobar, rechazar o cancelar y descarga de PDF |
| Avisos | RH, Empleado | RH registra avisos aprobados; el Empleado ve los suyos |
| Calendario | Todos | Vista mensual con ausencias y festivos |
| Días | Todos | Saldo del periodo, con días y horas disponibles |
| Departamentos | RH | Tarjetas con responsable, empleados y calendario compartido |
| Empresas | RH | Datos fiscales, sedes y empleados |
| Turnos y horarios | RH | Editor por bloques de días |
| Reglas de acumulación | RH | Antigüedad y días de la LFT; rechaza rangos cruzados |
| Usuarios | Superusuario | Alta, sedes, acciones de revisión y desactivación |
| Roles y permisos | Superusuario | Matriz de módulos contra roles |
| Auditoría | Superusuario | Eventos con filtro por resultado y búsqueda |
| Configuración | Todos | Apariencia y perfil |

Menú por rol:

| Rol | Módulos |
|---|---|
| Superusuario | Todos |
| Usuario | Todos menos Usuarios, Roles y permisos, y Auditoría |
| Empleado | Dashboard, Solicitudes, Calendario, Días, Avisos y Configuración |

Entrar por URL a un módulo prohibido lleva al primer módulo permitido. La configuración del menú está en `frontend/src/app/navigation.ts`.

## Métricas de éxito

| Métrica | Medida |
|---|---|
| Tiempo de resolución | De solicitada a aprobada o rechazada |
| Trazabilidad | % de solicitudes y avisos con quién aprobó y cuándo |
| Cálculo de saldo | Reducción de discrepancias frente al método manual |
| Adopción | % de empleados activos con al menos un aviso en el sistema |
