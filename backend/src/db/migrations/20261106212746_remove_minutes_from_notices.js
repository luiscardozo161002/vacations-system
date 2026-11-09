exports.up = function (knex) {
  return knex.schema.alterTable('notices', (table) => {
    table.dropColumn('absence_start_minutes');
    table.dropColumn('absence_end_minutes');
    table.dropColumn('remaining_minutes');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('notices', (table) => {
    table.integer('absence_start_minutes');
    table.integer('absence_end_minutes');
    table.integer('remaining_minutes');
  });
};
