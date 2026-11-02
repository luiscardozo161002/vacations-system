exports.up = function (knex) {
  return knex.schema.alterTable('shifts', (table) => {
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive')", [], 'ck_shifts_status');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('shifts', (table) => {
    table.dropChecks('ck_shifts_status');
    table.dropColumn('status');
  });
};
