# Requisitos del producto

Define el propósito, los usuarios, las capacidades y las reglas de negocio del Sistema de Vacaciones.

[Arquitectura](ARCHITECTURE.md) · [Sistema de diseño](DESIGN_SYSTEM.md) · [Roadmap](ROADMAP.md)

## Objetivo

Centralizar la gestión de vacaciones y avisos de ausencia de Recursos Humanos para las empresas del grupo. El sistema debe calcular el consumo según el turno y la antigüedad, mantener el saldo del periodo y registrar quién realiza cada acción.

El producto atiende tres necesidades operativas.

- Consultar datos del empleado, antigüedad y saldo desde un mismo lugar.
- Resolver solicitudes con trazabilidad de la decisión.
- Mantener visibles las ausencias de cada sede y los documentos aprobados.

## Usuarios y alcance

| Usuario | Código | Alcance |
| --- | --- | --- |
| Superusuario | `SUPERUSER` | Empresas, sedes y administración del sistema |
| Recursos Humanos | `USER` | Empleados y operaciones de sus sedes asignadas |
| Empleado | `EMPLOYEE` | Datos, solicitudes, avisos y saldo propios |

La organización se estructura por empresa, sede, departamento y empleado. La operación inicial contempla JOR, THH y UMJ. Un usuario de Recursos Humanos puede atender varias sedes.

Cada empresa registra sus datos fiscales y de contacto. Cada empleado tiene un número de socio o empleado, fecha de ingreso, departamento y turno. Las asignaciones de sede determinan el acceso de Recursos Humanos.

## Capacidades

| Área | Resultado esperado |
| --- | --- |
| Organización y empleados | Gestionar empresas, sedes, departamentos, turnos y empleados |
| Solicitudes y avisos | Capturar ausencias, previsualizar el consumo y resolver solicitudes |
| Saldos y reglas | Consultar días y horas disponibles y administrar reglas por antigüedad |
| Calendario y dashboard | Consultar ausencias, pendientes e indicadores según el alcance |
| Documentos | Descargar el aviso aprobado en PDF y exportar empleados a CSV |
| Administración | Gestionar usuarios, permisos y eventos de auditoría |
| Cuenta y apariencia | Cambiar datos de perfil, contraseña y preferencias visuales |

### Permisos iniciales

El Superusuario administra los permisos por rol y las acciones de revisión de cada usuario de Recursos Humanos.

| Operación | Recursos Humanos | Empleado |
| --- | --- | --- |
| Empleados | Crear, consultar, editar y dar de baja en sus sedes | Consultar su perfil |
| Solicitudes | Consultar, editar y resolver según acciones permitidas | Crear, consultar y cancelar las pendientes propias |
| Avisos | Registrar, consultar y editar dentro de las reglas del flujo | Consultar los propios |
| Saldo | Consultar y ajustar en sus sedes | Consultar el propio |
| Departamentos | Consultar y editar en sus sedes | Consultar el calendario compartido |
| Empresas | Consultar las correspondientes a sus sedes | Acceso mediante sus documentos |
| Turnos y reglas | Consultar y editar | Uso al calcular sus ausencias |
| Usuarios, permisos y auditoría | Administración del Superusuario | Acceso a su cuenta |

## Reglas de negocio

### Solicitudes y avisos

Una solicitud la crea el empleado para sí mismo y nace pendiente. Un aviso lo registra Recursos Humanos para un empleado de su alcance y nace aprobado.

| Estado actual | Acción permitida | Resultado |
| --- | --- | --- |
| Pendiente | Aprobar por un revisor autorizado | Aprobada y descuento del saldo cuando corresponde |
| Pendiente | Rechazar por un revisor autorizado | Rechazada |
| Pendiente | Cancelar por el empleado propietario o un revisor autorizado | Cancelada |
| Aprobada | Cancelar por un revisor antes del inicio de la ausencia | Cancelada y devolución del consumo |
| Rechazada o cancelada | Consultar | Conserva el historial |

Recursos Humanos captura al empleado, motivo, fechas u horas y observaciones. La previsualización muestra el consumo y el saldo resultante. Las fechas y el motivo se editan mientras la ausencia está pendiente.

Los motivos iniciales son Permiso Personal, Castigo, Onomástico, Comisión De Trabajo, Tiempo Por Tiempo, Natalicio, Deceso y Vacaciones. El motivo determina si la ausencia afecta el saldo.

### Saldo y periodo

El periodo va de aniversario a aniversario según la fecha de ingreso. Las reglas iniciales de antigüedad del proyecto se basan en el artículo 76 de la LFT.

| Antigüedad cumplida | Días del periodo |
| --- | --- |
| 1 año | 12 |
| 2 años | 14 |
| 3 años | 16 |
| 4 años | 18 |
| 5 años | 20 |
| 6 a 10 años | 22 |
| 11 a 15 años | 24 |
| 16 a 20 años | 26 |
| 21 a 25 años | 28 |
| 26 a 30 años | 30 |
| 31 a 35 años | 32 |

- El derecho a solicitar vacaciones requiere al menos un año de antigüedad y un periodo vigente.
- La ausencia debe quedar completa dentro del periodo abierto y disponer de saldo suficiente.
- Las solicitudes pendientes reservan una intención. El descuento ocurre al aprobarlas.
- Los avisos de vacaciones registrados por Recursos Humanos descuentan al guardarse.
- Al vencer el periodo, el remanente deja de estar disponible y se cancelan las solicitudes de vacaciones pendientes del periodo anterior.
- Al abrir el siguiente periodo, se asignan los días de la regla correspondiente.
- La puesta en operación requiere conciliar con Recursos Humanos los días ya utilizados.

Por ejemplo, un ingreso el 3 de julio de 2022 abre su periodo de cuatro años del 3 de julio de 2026 al 2 de julio de 2027 con 18 días. Una ausencia que cruce el aniversario requiere solicitudes para los periodos correspondientes.

### Jornada y festivos

El cálculo usa el horario del turno. Un día completo equivale a una jornada y las fracciones de jornada se expresan en horas. Las horas fuera del turno, los descansos y los festivos configurados se excluyen del consumo.

El calendario inicial contempla los descansos anuales del artículo 74 de la LFT y la fecha de transmisión del Poder Ejecutivo Federal cada seis años a partir de 2024. Una petición compuesta únicamente por descansos o festivos se rechaza.

### Calendario compartido

Recursos Humanos ve las ausencias de sus sedes. El empleado ve las propias y las de su departamento cuando está habilitada la opción de compartir calendario. Esta opción comienza activada y Recursos Humanos puede modificarla.

### Cuentas y acceso

Dar de alta un empleado con correo crea su cuenta. La contraseña temporal vence según la vigencia configurada y el empleado debe cambiarla al ingresar. Una temporal vencida impide iniciar sesión y requiere que Recursos Humanos reenvíe el acceso.

Cambiar o restablecer la contraseña invalida las sesiones de renovación anteriores. Las cuentas inactivas rechazan la recuperación. Mientras la entrega por correo esté pendiente, Recursos Humanos recibe la temporal para entregarla al empleado.

### Notificaciones y documentos

El empleado recibe avisos dentro del sistema cuando se resuelve una ausencia, cuando Recursos Humanos registra un aviso y cuando abre o está próximo a vencer su periodo. Recursos Humanos consulta las solicitudes pendientes de sus sedes.

La entrega por correo es una capacidad pendiente. Su alcance y dependencias están en el [roadmap](ROADMAP.md#integraciones-y-puesta-en-operación).

El PDF aprobado utiliza tamaño carta con dos copias. Incluye datos de la empresa y del empleado, motivo, periodo de ausencia, consumo, saldo disponible, observaciones y espacios para firmas. El empleado y Recursos Humanos pueden descargarlo dentro de su alcance.

## Criterios de aceptación

- Cada rol consulta y modifica únicamente los registros permitidos por sus permisos y alcance.
- La previsualización, el descuento y la devolución producen saldos consistentes para días y horas.
- Dos aprobaciones concurrentes conservan la integridad del estado y del saldo.
- Las acciones auditadas conservan usuario, resultado y contexto de la petición.
- El PDF corresponde a una ausencia aprobada y a la empresa del empleado.
- Recursos Humanos valida los flujos de alta, solicitud, aprobación, cancelación y cierre de periodo antes de la puesta en operación.

## Indicadores de éxito

| Indicador | Medición |
| --- | --- |
| Tiempo de resolución | Tiempo entre la solicitud y su aprobación o rechazo |
| Trazabilidad | Proporción de resoluciones con responsable y fecha |
| Exactitud del saldo | Discrepancias detectadas al conciliar con Recursos Humanos |
| Adopción | Proporción de empleados activos que usan el sistema |

Las metas y la línea base se definirán con Recursos Humanos durante la aceptación.

## Referencias

La estructura del PRD organiza objetivos, usuarios, capacidades y criterios de aceptación siguiendo la guía de requisitos de producto de Atlassian. Las reglas funcionales proceden de la especificación del proyecto. [Guía de PRD](https://www.atlassian.com/agile/product-management/requirements)
