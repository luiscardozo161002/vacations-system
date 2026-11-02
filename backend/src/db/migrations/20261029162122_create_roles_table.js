exports.up = function (knex) {
  return knex.schema.createTable('roles', (table) => {
    table.increments('role_id').primary();
    table.string('role_code', 30).notNullable().unique();
    table.string('description', 150).notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive')", [], 'ck_roles_status');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('roles');
};
