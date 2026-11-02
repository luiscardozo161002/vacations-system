exports.up = function (knex) {
  return knex.schema.createTable('shifts', (table) => {
    table.increments('shift_id').primary();
    table.string('code', 20).notNullable().unique();
    table.string('shift_name', 100).notNullable();
    table.smallint('number_days').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('shifts');
};
