exports.up = async function (knex) {
  await knex.schema.alterTable('employees', (table) => {
    table.integer('company_id').references('company_id').inTable('company');
  });

  await knex.raw(`
    CREATE FUNCTION set_employee_company() RETURNS trigger AS $$
    BEGIN
      SELECT b.company_id INTO NEW.company_id
      FROM departments d JOIN branches b ON b.branch_id = d.branch_id
      WHERE d.department_id = NEW.department_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
  await knex.raw(`
    CREATE TRIGGER employees_set_company
    BEFORE INSERT OR UPDATE OF department_id ON employees
    FOR EACH ROW EXECUTE FUNCTION set_employee_company()
  `);

  await knex.raw(`
    UPDATE employees e SET company_id = b.company_id
    FROM departments d JOIN branches b ON b.branch_id = d.branch_id
    WHERE d.department_id = e.department_id
  `);

  await knex.schema.alterTable('employees', (table) => {
    table.dropUnique(['employee_number']);
    table.unique(['company_id', 'employee_number']);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('employees', (table) => {
    table.dropUnique(['company_id', 'employee_number']);
    table.unique(['employee_number']);
  });
  await knex.raw('DROP TRIGGER employees_set_company ON employees');
  await knex.raw('DROP FUNCTION set_employee_company()');
  await knex.schema.alterTable('employees', (table) => {
    table.dropColumn('company_id');
  });
};
