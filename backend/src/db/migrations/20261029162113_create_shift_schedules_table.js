exports.up = function (knex) {
  return knex.schema.createTable('shift_schedules', (table) => {
    table.increments('schedule_id').primary();
    table.integer('shift_id').notNullable().references('shift_id').inTable('shifts');
    table.smallint('day_of_week').notNullable();
    table.check('day_of_week BETWEEN 1 AND 7', [], 'ck_shift_schedules_day_of_week');
    table.boolean('is_working_day').notNullable().defaultTo(true);
    table.time('check_in_time');
    table.time('check_out_time');
    table.unique(['shift_id', 'day_of_week'], { indexName: 'uq_shift_schedules' });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('shift_schedules');
};
