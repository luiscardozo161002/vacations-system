exports.up = function (knex) {
  return knex.schema.createTable('user_settings', (table) => {
    table.integer('user_id').primary().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('theme', 5);
    table.string('backdrop_light', 7);
    table.string('backdrop_dark', 7);
    table.string('button_color', 7);
    table.decimal('window_alpha', 3, 2);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.check("theme IN ('light','dark')", [], 'ck_user_settings_theme');
    table.check('window_alpha BETWEEN 0.4 AND 1', [], 'ck_user_settings_alpha');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('user_settings');
};
