const GRANT = { role: 'USER', permission: 'companies:update' };

const grantIds = async (knex) => {
  const role = await knex('roles').where('role_code', GRANT.role).first('role_id');
  const permission = await knex('permissions').where('permission_code', GRANT.permission).first('permission_id');
  return role && permission ? { role_id: role.role_id, permission_id: permission.permission_id } : null;
};

exports.up = async function (knex) {
  await knex.schema.alterTable('company', (table) => {
    table.string('color', 7);
  });
  await knex.schema.alterTable('branches', (table) => {
    table.string('color', 7);
  });

  const ids = await grantIds(knex);
  if (ids && !(await knex('role_permissions').where(ids).first())) await knex('role_permissions').insert(ids);
};

exports.down = async function (knex) {
  const ids = await grantIds(knex);
  if (ids) await knex('role_permissions').where(ids).del();

  await knex.schema.alterTable('branches', (table) => {
    table.dropColumn('color');
  });
  await knex.schema.alterTable('company', (table) => {
    table.dropColumn('color');
  });
};
