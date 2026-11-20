const SESSION_EVENTS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'TOKEN_REFRESH',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'PASSWORD_CHANGED',
];

exports.up = async function (knex) {
  await knex.schema.alterTable('auth_audit_log', (table) => {
    table.string('http_method', 10);
    table.string('route', 120);
    table.index(['entity']);
  });
  await knex('auth_audit_log').whereIn('event_type', SESSION_EVENTS).update({ entity: null, entity_id: null });
};

exports.down = async function (knex) {
  await knex('auth_audit_log')
    .whereIn('event_type', SESSION_EVENTS)
    .whereNotNull('user_id')
    .update({ entity: 'user', entity_id: knex.raw('user_id::text') });
  await knex.schema.alterTable('auth_audit_log', (table) => {
    table.dropIndex(['entity']);
    table.dropColumn('route');
    table.dropColumn('http_method');
  });
};
