exports.up = function (knex) {
  return knex.schema.createTable('vacation_accrual_rules', (table) => {
    table.increments('rule_id').primary();
    table.integer('years_from').notNullable();
    table.integer('years_to');
    table.integer('vacation_days').notNullable();
    table.integer('effective_year').notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive')", [], 'ck_vacation_rules_status');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.check('years_to IS NULL OR years_to >= years_from', [], 'ck_vacation_rules_range');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('vacation_accrual_rules');
};
