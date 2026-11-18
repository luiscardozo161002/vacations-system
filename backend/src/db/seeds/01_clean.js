exports.seed = async function (knex) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed deletes every table and cannot run in production');
  }

  await knex('notices').del();
  await knex('vacation_entitlements').del();
  await knex('reasons').del();
  await knex('vacation_accrual_rules').del();
  await knex('auth_audit_log').del();
  await knex('password_reset_tokens').del();
  await knex('user_sessions').del();
  await knex('user_branches').del();
  await knex('users').del();
  await knex('departments').update({ manager_employee_id: null });
  await knex('employees').del();
  await knex('departments').del();
  await knex('branches').del();
  await knex('shift_schedules').del();
  await knex('shifts').del();
  await knex('company').del();
};
