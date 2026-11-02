exports.up = function (knex) {
  return knex.schema.createTable('reasons', (table) => {
    table.increments('reason_id').primary();
    table.string('description', 100).notNullable().unique();
    table.boolean('requires_approval').notNullable().defaultTo(true);
    table.boolean('affects_vacation_balance').notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('reasons');
};
