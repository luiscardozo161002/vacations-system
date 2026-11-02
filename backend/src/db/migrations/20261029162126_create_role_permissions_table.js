exports.up = function (knex) {
  return knex.schema.createTable('role_permissions', (table) => {
    table.integer('role_id').notNullable().references('role_id').inTable('roles');
    table.integer('permission_id').notNullable().references('permission_id').inTable('permissions');
    table.primary(['role_id', 'permission_id'], { constraintName: 'pk_role_permissions' });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('role_permissions');
};
