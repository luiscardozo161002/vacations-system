exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.boolean('must_change_password').notNullable().defaultTo(false);
    table.timestamp('temporary_password_expires_at', { useTz: true });
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('temporary_password_expires_at');
    table.dropColumn('must_change_password');
  });
};
