exports.up = async function (knex) {
  await knex.schema.alterTable('vacation_entitlements', (table) => {
    table.date('period_start');
    table.date('period_end');
    table.decimal('used_hours', 6, 2).notNullable().defaultTo(0);
  });

  await knex.raw(`
    UPDATE vacation_entitlements ve
    SET period_start = (e.start_date + make_interval(years => ve.years_of_service))::date,
        period_end = (e.start_date + make_interval(years => ve.years_of_service + 1) - INTERVAL '1 day')::date
    FROM employees e
    WHERE e.employee_id = ve.employee_id
  `);

  await knex.schema.alterTable('vacation_entitlements', (table) => {
    table.date('period_start').notNullable().alter();
    table.date('period_end').notNullable().alter();
  });

  await knex.schema.alterTable('notices', (table) => {
    table.dropColumn('remaining_days');
    table.dropColumn('remaining_hours');
    table.integer('days_taken').notNullable().defaultTo(0);
    table.decimal('hours_taken', 5, 2).notNullable().defaultTo(0);
    table.integer('entitlement_id').references('entitlement_id').inTable('vacation_entitlements');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('notices', (table) => {
    table.dropForeign(['entitlement_id']);
    table.dropColumn('entitlement_id');
    table.dropColumn('hours_taken');
    table.dropColumn('days_taken');
    table.integer('remaining_days');
    table.integer('remaining_hours');
  });

  await knex.schema.alterTable('vacation_entitlements', (table) => {
    table.dropColumn('used_hours');
    table.dropColumn('period_end');
    table.dropColumn('period_start');
  });
};
