exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  return knex.schema.createTable('user_sessions', (table) => {
    table.uuid('session_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').notNullable().references('user_id').inTable('users');
    table.string('refresh_token_hash', 255).notNullable();
    table.string('ip_address', 45);
    table.string('user_agent', 255);
    table.timestamp('issued_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('revoked_at', { useTz: true });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_sessions');
};
