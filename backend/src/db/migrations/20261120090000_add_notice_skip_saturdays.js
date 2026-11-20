exports.up = function (knex) {
  return knex.schema.alterTable('notices', (table) => {
    table.boolean('skip_saturdays').notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('notices', (table) => {
    table.dropColumn('skip_saturdays');
  });
};
