exports.up = function (knex) {
  return knex.schema.createTable('departments', (table) => {
    table.increments('department_id').primary();
    table.integer('company_id').notNullable().references('company_id').inTable('company');
    table.string('code', 20).notNullable();
    table.string('department_name', 150).notNullable();
    table.integer('manager_employee_id');
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive')", [], 'ck_departments_status');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['company_id', 'code'], { indexName: 'uq_departments_company_code' });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('departments');
};
