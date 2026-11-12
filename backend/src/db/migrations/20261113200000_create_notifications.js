exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('notification_id').primary();
    table.integer('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('kind', 30).notNullable();
    table.string('reference', 100).notNullable();
    table.string('title', 150).notNullable();
    table.string('body', 255).notNullable();
    table.string('link', 100);
    table.timestamp('read_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'kind', 'reference'], { indexName: 'uq_notifications_reference' });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notifications');
};
