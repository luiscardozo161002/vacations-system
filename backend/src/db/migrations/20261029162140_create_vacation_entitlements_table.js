exports.up = async function (knex) {
  await knex.schema.createTable('vacation_entitlements', (table) => {
    table.increments('entitlement_id').primary();
    table.integer('employee_id').notNullable().references('employee_id').inTable('employees');
    table.integer('period_year').notNullable();
    table.integer('years_of_service').notNullable();
    table.integer('rule_id').notNullable().references('rule_id').inTable('vacation_accrual_rules');
    table.integer('total_days').notNullable();
    table.integer('used_days').notNullable().defaultTo(0);
    table.timestamp('generated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['employee_id', 'period_year'], { indexName: 'uq_vacation_entitlements' });
  });

  await knex.raw(
    'ALTER TABLE vacation_entitlements ADD COLUMN remaining_days INT GENERATED ALWAYS AS (total_days - used_days) STORED'
  );
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('vacation_entitlements');
};
