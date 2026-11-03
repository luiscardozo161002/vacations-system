exports.up = function (knex) {
  return knex.schema.alterTable('company', (table) => {
    table.string('logo', 255);
    table.string('location', 255);
    table.string('phone_number', 20);
    table.string('rfc', 13).unique();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('company', (table) => {
    table.dropColumn('logo');
    table.dropColumn('location');
    table.dropColumn('phone_number');
    table.dropColumn('rfc');
  });
};
