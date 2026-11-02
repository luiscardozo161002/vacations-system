exports.up = function (knex) {
  return knex.schema.createTable('employees', (table) => {
    table.increments('employee_id').primary();
    table.integer('department_id').notNullable().references('department_id').inTable('departments');
    table.integer('shift_id').notNullable().references('shift_id').inTable('shifts');
    table.string('folio', 10).notNullable();
    table.string('employee_number', 20).notNullable().unique();
    table.string('employee_name', 150).notNullable();
    table.date('start_date').notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive')", [], 'ck_employees_status');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employees');
};
