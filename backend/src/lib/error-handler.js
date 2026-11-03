'use strict';

const { ValidationError } = require('objection');
const { AppError } = require('./app-error');

const BUSINESS_STATUS = {
  NOT_FOUND: 404,
  EMPLOYEE_NOT_FOUND: 404,
  EMPLOYEE_FORBIDDEN: 403,
  DEPARTMENT_NOT_FOUND: 404,
  SHIFT_NOT_FOUND: 404,
  COMPANY_NOT_FOUND: 404,
  REASON_NOT_FOUND: 404,
  ROLE_NOT_FOUND: 404,
  PERMISSION_NOT_FOUND: 404,
  ROLE_PERMISSION_NOT_FOUND: 404,
  SHIFT_SCHEDULE_NOT_FOUND: 404,
  VACATION_RULE_NOT_FOUND: 404,
  VACATION_ENTITLEMENT_NOT_FOUND: 404,
  NOTICE_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  AUTH_LOG_NOT_FOUND: 404,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_LOCKED: 423,
  ACCOUNT_INACTIVE: 403,
  INVALID_REFRESH_TOKEN: 401,
  INVALID_RESET_TOKEN: 401,
};

const DB_ERRORS = {
  employees_employee_number_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'EMPLOYEE_NUMBER_EXISTS',
    message: 'El numero de empleado ya esta registrado',
  },
  employees_department_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_DEPARTMENT',
    message: 'El departamento no existe',
  },
  employees_shift_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_SHIFT',
    message: 'El turno no existe',
  },
  uq_departments_company_code: {
    sqlstate: '23505',
    status: 409,
    code: 'DEPARTMENT_CODE_EXISTS',
    message: 'Ya existe un departamento con ese codigo en esa empresa',
  },
  departments_company_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_COMPANY',
    message: 'La empresa no existe',
  },
  fk_departments_manager: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_MANAGER',
    message: 'El empleado asignado como responsable no existe',
  },
  shifts_code_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'SHIFT_CODE_EXISTS',
    message: 'Ya existe un turno con ese codigo',
  },
  company_folio_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'COMPANY_FOLIO_EXISTS',
    message: 'Ya existe una empresa con ese folio',
  },
  company_rfc_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'COMPANY_RFC_EXISTS',
    message: 'Ya existe una empresa con ese RFC',
  },
  reasons_description_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'REASON_DESCRIPTION_EXISTS',
    message: 'Ya existe un motivo con esa descripcion',
  },
  roles_role_code_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'ROLE_CODE_EXISTS',
    message: 'Ya existe un rol con ese codigo',
  },
  permissions_permission_code_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'PERMISSION_CODE_EXISTS',
    message: 'Ya existe un permiso con ese codigo',
  },
  role_permissions_role_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_ROLE',
    message: 'El rol no existe',
  },
  role_permissions_permission_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_PERMISSION',
    message: 'El permiso no existe',
  },
  shift_schedules_shift_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_SHIFT',
    message: 'El turno no existe',
  },
  uq_shift_schedules: {
    sqlstate: '23505',
    status: 409,
    code: 'SHIFT_SCHEDULE_EXISTS',
    message: 'Ya existe un horario para ese turno en ese dia',
  },
  vacation_entitlements_employee_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_EMPLOYEE',
    message: 'El empleado no existe',
  },
  vacation_entitlements_rule_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_RULE',
    message: 'La regla de acumulacion no existe',
  },
  uq_vacation_entitlements: {
    sqlstate: '23505',
    status: 409,
    code: 'VACATION_ENTITLEMENT_EXISTS',
    message: 'Ya existe un saldo de vacaciones para ese empleado en ese periodo',
  },
  notices_employee_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_EMPLOYEE',
    message: 'El empleado no existe',
  },
  notices_reason_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_REASON',
    message: 'El motivo no existe',
  },
  notices_approved_by_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_APPROVER',
    message: 'El usuario que aprueba no existe',
  },
  users_username_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'USERNAME_EXISTS',
    message: 'Ese nombre de usuario ya esta en uso',
  },
  users_email_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'EMAIL_EXISTS',
    message: 'Ese correo ya esta en uso',
  },
  users_employee_id_unique: {
    sqlstate: '23505',
    status: 409,
    code: 'USER_ALREADY_LINKED',
    message: 'Ese empleado ya tiene un usuario asociado',
  },
  users_role_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_ROLE',
    message: 'El rol no existe',
  },
  users_employee_id_foreign: {
    sqlstate: '23503',
    status: 422,
    code: 'INVALID_EMPLOYEE',
    message: 'El empleado no existe',
  },
};

const SQLSTATE_FALLBACK = {
  23505: { status: 409, code: 'DUPLICATE_RECORD', message: 'Ya existe un registro con esos datos' },
  23503: { status: 409, code: 'RELATED_RECORDS', message: 'La operacion afecta registros relacionados' },
  23514: { status: 400, code: 'INVALID_CONSTRAINT', message: 'Los datos incumplen una regla de integridad' },
  '08001': { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Servicio temporalmente no disponible' },
  '08006': { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Servicio temporalmente no disponible' },
  53300: { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Servicio temporalmente no disponible' },
};

const send = (h, status, code, message) => {
  return h.response({ error: { code, message } }).code(status);
};

module.exports = {
  name: 'api-error-handler',

  register(server) {
    server.ext('onPreResponse', (request, h) => {
      const response = request.response;

      if (!response.isBoom) {
        return h.continue;
      }

      if (response.output.statusCode !== 500) {
        const status = response.output.statusCode;
        return send(h, status, `HTTP_${status}`, response.output.payload.message);
      }

      const error = response.cause || response;

      if (error instanceof AppError) {
        const status = BUSINESS_STATUS[error.code];
        if (status) return send(h, status, error.code, error.message);
      }

      if (error instanceof ValidationError) {
        return send(h, 400, 'INVALID_MODEL_DATA', error.message);
      }

      const pg = error.nativeError || error;
      const dbError = DB_ERRORS[pg.constraint];

      if (dbError && dbError.sqlstate === pg.code) {
        return send(h, dbError.status, dbError.code, dbError.message);
      }

      const fallback = SQLSTATE_FALLBACK[pg.code];
      if (fallback) return send(h, fallback.status, fallback.code, fallback.message);

      request.log(['error', 'unhandled'], {
        name: error.name,
        code: pg.code,
        constraint: pg.constraint,
        path: request.path,
      });

      return send(h, 500, 'INTERNAL_ERROR', 'Ocurrio un error interno');
    });
  },
};
