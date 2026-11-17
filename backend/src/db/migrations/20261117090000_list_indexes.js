const INDEXES = {
  notices: [['employee_id'], ['status'], ['absence_start_date', 'absence_end_date']],
  employees: [['department_id'], ['shift_id']],
  auth_audit_log: [['user_id'], ['event_type']],
  user_sessions: [['user_id'], ['refresh_token_hash']],
  password_reset_tokens: [['user_id'], ['token_hash']],
};

exports.up = async function (knex) {
  for (const [table, indexes] of Object.entries(INDEXES)) {
    await knex.schema.alterTable(table, (builder) => indexes.forEach((columns) => builder.index(columns)));
  }
};

exports.down = async function (knex) {
  for (const [table, indexes] of Object.entries(INDEXES)) {
    await knex.schema.alterTable(table, (builder) => indexes.forEach((columns) => builder.dropIndex(columns)));
  }
};
