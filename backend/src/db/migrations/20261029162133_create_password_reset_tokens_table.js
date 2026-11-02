exports.up = function (knex) {
  return knex.schema.createTable('password_reset_tokens', (table) => {
    table.increments('token_id').primary();
    table.integer('user_id').notNullable().references('user_id').inTable('users');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('used_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('password_reset_tokens');
};
