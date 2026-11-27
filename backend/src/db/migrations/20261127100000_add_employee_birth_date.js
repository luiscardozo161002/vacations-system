exports.up = function (knex) {
  return knex.schema.alterTable('employees', (table) => {
    table.date('birth_date');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('employees', (table) => {
    table.dropColumn('birth_date');
  });
};
