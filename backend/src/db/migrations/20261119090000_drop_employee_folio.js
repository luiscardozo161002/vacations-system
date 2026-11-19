const NUMBER_LENGTH = 4;
const VALID_NUMBER = new RegExp(`^\\d{${NUMBER_LENGTH}}$`);

const toNumber = (value) => value.replace(/\D/g, '').slice(-NUMBER_LENGTH).padStart(NUMBER_LENGTH, '0');

const nextFree = (used) => {
  let candidate = 1;
  while (used.has(String(candidate).padStart(NUMBER_LENGTH, '0'))) candidate += 1;
  return String(candidate).padStart(NUMBER_LENGTH, '0');
};

exports.up = async function (knex) {
  const employees = await knex('employees').select('employee_id', 'employee_number').orderBy('employee_id');
  const used = new Set(employees.filter((row) => VALID_NUMBER.test(row.employee_number)).map((row) => row.employee_number));

  for (const row of employees.filter((item) => !VALID_NUMBER.test(item.employee_number))) {
    const hasDigits = /\d/.test(row.employee_number);
    const candidate = hasDigits ? toNumber(row.employee_number) : '';
    const employeeNumber = candidate && !used.has(candidate) ? candidate : nextFree(used);
    used.add(employeeNumber);
    await knex('employees').where({ employee_id: row.employee_id }).update({ employee_number: employeeNumber });
  }

  await knex.schema.alterTable('employees', (table) => table.dropColumn('folio'));
};

exports.down = async function (knex) {
  await knex.schema.alterTable('employees', (table) => table.string('folio', 10));
  await knex('employees').update({ folio: knex.raw('employee_number') });
  await knex.schema.alterTable('employees', (table) => table.string('folio', 10).notNullable().alter());
};
