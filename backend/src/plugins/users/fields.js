'use strict';

const ID_COLUMN = 'user_id';

// El password se maneja aparte (ver service.js): nunca se expone ni se acepta `password_hash`
// directo por la API, y `mfa_secret` tampoco (no hay implementacion de MFA todavia).
const EDITABLE_FIELDS = ['employee_id', 'role_id', 'username', 'email', 'status'];

const SAFE_COLUMNS = [
  ID_COLUMN,
  ...EDITABLE_FIELDS,
  'mfa_enabled',
  'failed_login_attempts',
  'locked_until',
  'last_login_at',
  'last_login_ip',
  'created_at',
  'updated_at',
];

module.exports = { ID_COLUMN, EDITABLE_FIELDS, SAFE_COLUMNS };
