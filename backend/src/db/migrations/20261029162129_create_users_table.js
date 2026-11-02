exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('user_id').primary();
    table.integer('employee_id').unique().references('employee_id').inTable('employees');
    table.integer('role_id').notNullable().references('role_id').inTable('roles');
    table.string('username', 50).notNullable().unique();
    table.string('email', 120).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.check("status IN ('active','inactive','locked')", [], 'ck_users_status');
    table.boolean('mfa_enabled').notNullable().defaultTo(false);
    table.string('mfa_secret', 255);
    table.integer('failed_login_attempts').notNullable().defaultTo(0);
    table.timestamp('locked_until', { useTz: true });
    table.timestamp('last_login_at', { useTz: true });
    table.string('last_login_ip', 45);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
