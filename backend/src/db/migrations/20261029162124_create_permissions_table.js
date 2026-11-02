exports.up = function (knex) {
  return knex.schema.createTable('permissions', (table) => {
    table.increments('permission_id').primary();
    table.string('permission_code', 60).notNullable().unique();
    table.string('description', 150).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('permissions');
};
