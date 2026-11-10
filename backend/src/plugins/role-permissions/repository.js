'use strict';

const RolePermission = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [
  { column: 'role_id', order: 'asc' },
  { column: 'permission_id', order: 'asc' },
];

const list = async ({ role_id, permission_id, status, sort, page = 1, pageSize = 20 }) => {
  const query = RolePermission.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));

  if (role_id !== undefined) query.where('role_id', role_id);
  if (permission_id !== undefined) query.where('permission_id', permission_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (roleId, permissionId) => RolePermission.query().select(COLUMNS).findById([roleId, permissionId]);

// role_id + permission_id es la primary key, asi que asignar un permiso ya asignado (incluso
// inactivo) no puede hacer un INSERT comun. Con ON CONFLICT se reactiva en el mismo paso, atomico
// (sin el problema de condicion de carrera de un SELECT previo al INSERT).
const create = (data) =>
  RolePermission.query()
    .insert({ ...data, status: 'active' })
    .onConflict(['role_id', 'permission_id'])
    .merge({ status: 'active' })
    .returning(COLUMNS);

const remove = async (roleId, permissionId) => {
  const [rolePermission] = await RolePermission.query()
    .where({ role_id: roleId, permission_id: permissionId })
    .patch({ status: 'inactive' })
    .returning(COLUMNS);
  return rolePermission || null;
};

module.exports = { list, findById, create, remove };
