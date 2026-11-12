'use strict';

const ID_COLUMN = 'user_id';

const EDITABLE_FIELDS = ['employee_id', 'role_id', 'username', 'email', 'status', 'review_actions'];

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
