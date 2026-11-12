exports.up = function (knex) {
  return knex.schema.alterTable('departments', (table) => {
    table.boolean('calendar_shared').notNullable().defaultTo(true);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('departments', (table) => {
    table.dropColumn('calendar_shared');
  });
};
