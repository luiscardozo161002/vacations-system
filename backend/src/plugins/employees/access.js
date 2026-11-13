'use strict';

const db = require('../../db');
const { AppError } = require('../../lib/app-error');
const { issueTemporaryPassword } = require('../../lib/temporary-password');

const ACCOUNT_COLUMNS = [
  'u.user_id',
  'u.username',
  'u.email',
  'u.status',
  'u.must_change_password',
  'u.temporary_password_expires_at',
  'u.last_login_at',
  'r.role_code',
];

const findAccount = (employeeId, trx = db) =>
  trx('users as u').join('roles as r', 'r.role_id', 'u.role_id').where('u.employee_id', employeeId).first(ACCOUNT_COLUMNS);

const availableUsername = async (email, trx) => {
  const base = email.split('@')[0].toLowerCase().slice(0, 45);
  const taken = new Set(await trx('users').whereILike('username', `${base}%`).pluck('username'));
  let candidate = base;
  for (let suffix = 2; taken.has(candidate); suffix += 1) candidate = `${base}${suffix}`;
  return candidate;
};

const createAccount = async (employeeId, email, trx) => {
  const role = await trx('roles').where('role_code', 'EMPLOYEE').first('role_id');
  const { plain, fields } = await issueTemporaryPassword();
  await trx('users').insert({
    employee_id: employeeId,
    role_id: role.role_id,
    username: await availableUsername(email, trx),
    email,
    ...fields,
  });
  return plain;
};

const renewAccount = async (account, email, trx) => {
  if (account.role_code !== 'EMPLOYEE') {
    throw new AppError('ACCOUNT_NOT_EMPLOYEE', 'Este empleado tiene una cuenta administrativa; su acceso se gestiona en Usuarios');
  }
  const { plain, fields } = await issueTemporaryPassword();
  await trx('users')
    .where('user_id', account.user_id)
    .update({
      ...fields,
      ...(email ? { email } : {}),
      status: account.status === 'locked' ? 'active' : account.status,
      failed_login_attempts: 0,
      locked_until: null,
      updated_at: trx.fn.now(),
    });
  await trx('user_sessions').where('user_id', account.user_id).whereNull('revoked_at').update({ revoked_at: trx.fn.now() });
  return plain;
};

const grantAccess = async (employeeId, email, trx) => {
  const account = await findAccount(employeeId, trx);
  if (!account && !email) throw new AppError('EMAIL_REQUIRED', 'Captura el correo del empleado para crear su acceso');
  const temporary_password = account ? await renewAccount(account, email, trx) : await createAccount(employeeId, email, trx);
  return { account: await findAccount(employeeId, trx), temporary_password };
};

module.exports = { findAccount, grantAccess };
