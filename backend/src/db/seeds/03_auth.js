const password = require('../../lib/password');
const { resetSequence } = require('../seed-helpers');

const DEV_PASSWORD = 'Vacaciones2026!';

exports.seed = async function (knex) {
  const passwordHash = await password.hash(DEV_PASSWORD);
  const roles = await knex('roles').select('role_id', 'role_code');
  const roleIds = Object.fromEntries(roles.map((role) => [role.role_code, role.role_id]));

  await knex('users').insert([
    { user_id: 1, employee_id: null, role_id: roleIds.SUPERUSER, username: 'sysadmin', email: 'sysadmin@grupo-jo.com', password_hash: passwordHash, status: 'active' },
    { user_id: 2, employee_id: 5, role_id: roleIds.USER, username: 'r.jimenez', email: 'r.jimenez@thh.com.mx', password_hash: passwordHash, status: 'active' },
    { user_id: 3, employee_id: 11, role_id: roleIds.EMPLOYEE, username: 'j.navarro', email: 'j.navarro@jo.com.mx', password_hash: passwordHash, status: 'active' },
    { user_id: 4, employee_id: 1, role_id: roleIds.EMPLOYEE, username: 'j.perez', email: 'j.perez@jo.com.mx', password_hash: passwordHash, status: 'active' },
  ]);
  await resetSequence(knex, 'users', 'user_id');

  await knex('user_branches').insert([{ user_id: 2, branch_id: 5 }]);

  await knex('user_sessions').insert([
    { user_id: 2, refresh_token_hash: 'REFRESH_TOKEN_HASH_DEMO_1', ip_address: '10.0.0.15', user_agent: 'Mozilla/5.0 (Windows NT 10.0)', issued_at: knex.fn.now(), expires_at: knex.raw("now() + interval '7 days'") },
    { user_id: 4, refresh_token_hash: 'REFRESH_TOKEN_HASH_DEMO_2', ip_address: '10.0.0.42', user_agent: 'Mozilla/5.0 (Windows NT 10.0)', issued_at: knex.fn.now(), expires_at: knex.raw("now() + interval '7 days'") },
  ]);

  await knex('password_reset_tokens').insert([
    { user_id: 4, token_hash: 'RESET_TOKEN_HASH_DEMO', expires_at: knex.raw("now() + interval '1 hour'") },
  ]);

  await knex('auth_audit_log').insert([
    { user_id: 1, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.5', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '3 days'") },
    { user_id: 2, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.15', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '1 day'") },
    { user_id: 3, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.20', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '6 hours'") },
    { user_id: 4, event_type: 'LOGIN_SUCCESS', ip_address: '10.0.0.42', user_agent: 'Mozilla/5.0', metadata: null, created_at: knex.raw("now() - interval '2 hours'") },
    { user_id: null, event_type: 'LOGIN_FAILED', result: 'failed', ip_address: '201.1.2.3', user_agent: 'curl/8.0', metadata: JSON.stringify({ attempted_login: 'admin' }), created_at: knex.raw("now() - interval '5 hours'") },
  ]);
};
