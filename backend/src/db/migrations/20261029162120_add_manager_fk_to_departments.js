exports.up = function (knex) {
  return knex.schema.alterTable('departments', (table) => {
    table
      .foreign('manager_employee_id', 'fk_departments_manager')
      .references('employee_id')
      .inTable('employees');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('departments', (table) => {
    table.dropForeign('manager_employee_id', 'fk_departments_manager');
  });
};
