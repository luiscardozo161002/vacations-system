exports.up = function (knex) {
  return knex.schema.createTable('auth_audit_log', (table) => {
    table.bigIncrements('log_id').primary();
    table.integer('user_id').references('user_id').inTable('users');
    table.string('event_type', 40).notNullable();
    table.string('ip_address', 45);
    table.string('user_agent', 255);
    table.jsonb('metadata');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('auth_audit_log');
};
