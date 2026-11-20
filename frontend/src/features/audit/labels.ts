import type { AuditLogEntry } from '@vacations/sdk';

export const SESSION_MODULE = 'session';

export const MODULE_LABELS: Record<string, string> = {
  [SESSION_MODULE]: 'Sesión',
  notice: 'Ausencias',
  employee: 'Empleados',
  department: 'Departamentos',
  shift: 'Turnos',
  vacation_entitlement: 'Días de vacaciones',
  accrual_rule: 'Reglas de acumulación',
  user: 'Usuarios',
  role: 'Permisos',
};

export const EVENT_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Inició sesión',
  LOGIN_FAILED: 'Intentó iniciar sesión',
  LOGOUT: 'Cerró sesión',
  TOKEN_REFRESH: 'Renovó la sesión',
  PASSWORD_RESET_REQUESTED: 'Solicitó restablecer su contraseña',
  PASSWORD_RESET_COMPLETED: 'Restableció su contraseña',
  PASSWORD_CHANGED: 'Cambió su contraseña',
  NOTICE_CREATED: 'Registró una ausencia',
  NOTICE_UPDATED: 'Editó una ausencia',
  NOTICE_APPROVED: 'Aprobó una ausencia',
  NOTICE_REJECTED: 'Rechazó una ausencia',
  NOTICE_CANCELLED: 'Canceló una ausencia',
  EMPLOYEE_CREATED: 'Dio de alta un empleado',
  EMPLOYEE_UPDATED: 'Editó un empleado',
  EMPLOYEE_DEACTIVATED: 'Dio de baja un empleado',
  EMPLOYEE_ACCESS_GRANTED: 'Envió acceso a un empleado',
  EMPLOYEES_EXPORTED: 'Exportó empleados a CSV',
  DEPARTMENT_CREATED: 'Creó un departamento',
  DEPARTMENT_UPDATED: 'Editó un departamento',
  DEPARTMENT_DEACTIVATED: 'Desactivó un departamento',
  SHIFT_CREATED: 'Creó un turno',
  SHIFT_UPDATED: 'Editó un turno',
  SHIFT_DEACTIVATED: 'Desactivó un turno',
  SHIFT_SCHEDULE_REPLACED: 'Cambió el horario de un turno',
  PERIODS_GENERATED: 'Generó los periodos de vacaciones',
  RULE_CREATED: 'Creó una regla de acumulación',
  RULE_UPDATED: 'Editó una regla de acumulación',
  RULE_DEACTIVATED: 'Desactivó una regla de acumulación',
  USER_CREATED: 'Creó un usuario',
  USER_UPDATED: 'Editó un usuario',
  USER_DEACTIVATED: 'Desactivó un usuario',
  USER_BRANCHES_CHANGED: 'Cambió las sedes de un usuario',
  PERMISSION_GRANTED: 'Otorgó un permiso',
  PERMISSION_REVOKED: 'Quitó un permiso',
};

export const FIELD_LABELS: Record<string, string> = {
  code: 'Código',
  branch_id: 'Sede',
  calendar_shared: 'Calendario compartido',
  employee_name: 'Nombre',
  employee_number: 'Número de empleado',
  department_id: 'Departamento',
  department_name: 'Nombre del departamento',
  shift_id: 'Turno',
  shift_name: 'Nombre del turno',
  start_date: 'Fecha de ingreso',
  email: 'Correo',
  username: 'Usuario',
  role_id: 'Rol',
  permission_id: 'Permiso',
  reason_id: 'Motivo',
  absence_start_date: 'Primer día',
  absence_end_date: 'Último día',
  absence_start_time: 'Hora de inicio',
  absence_end_time: 'Hora de fin',
  skip_saturdays: 'Sin contemplar sábados',
  remarks: 'Comentarios',
  years_from: 'Antigüedad desde (años)',
  years_to: 'Antigüedad hasta (años)',
  vacation_days: 'Días otorgados',
  status: 'Estado',
  search: 'Búsqueda',
};

export const moduleOf = (entry: AuditLogEntry) => entry.entity ?? SESSION_MODULE;

export const moduleLabel = (entry: AuditLogEntry) => MODULE_LABELS[moduleOf(entry)] ?? moduleOf(entry);

export const eventLabel = (entry: AuditLogEntry) => EVENT_LABELS[entry.event_type] ?? entry.event_type;

export const targetLabel = (entry: AuditLogEntry) =>
  entry.target_name ?? (entry.entity && entry.entity_id ? `#${entry.entity_id}` : null);

export const formatChangeValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
