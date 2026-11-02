exports.up = function (knex) {
  return knex.schema.createTable('company', (table) => {
    table.increments('company_id').primary();
    table.string('folio', 15).notNullable().unique();
    table.string('company_name', 150).notNullable();
    table.string('company_branch', 100);
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive')", [], 'ck_company_status');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('company');
};
