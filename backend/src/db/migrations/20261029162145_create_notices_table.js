exports.up = function (knex) {
  return knex.schema.createTable('notices', (table) => {
    table.increments('notice_id').primary();
    table.integer('employee_id').notNullable().references('employee_id').inTable('employees');
    table.integer('reason_id').notNullable().references('reason_id').inTable('reasons');
    table.integer('approved_by').references('user_id').inTable('users');
    table.string('status', 20).notNullable().defaultTo('pending');
    table.check("status IN ('pending','approved','rejected','cancelled')", [], 'ck_notices_status');
    table.date('absence_start_date').notNullable();
    table.date('absence_end_date').notNullable();
    table.time('absence_start_time');
    table.time('absence_end_time');
    table.integer('absence_start_minutes');
    table.integer('absence_end_minutes');
    table.integer('remaining_days');
    table.integer('remaining_hours');
    table.integer('remaining_minutes');
    table.string('remarks', 255);
    table.timestamp('request_date', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('approved_at', { useTz: true });
    table.check('absence_end_date >= absence_start_date', [], 'ck_notices_dates');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notices');
};
