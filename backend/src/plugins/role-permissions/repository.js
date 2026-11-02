'use strict';

const RolePermission = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ role_id, permission_id, page = 1, pageSize = 50 }) => {
  const query = RolePermission.query().select(COLUMNS).orderBy(['role_id', 'permission_id']);

  if (role_id !== undefined) query.where('role_id', role_id);
  if (permission_id !== undefined) query.where('permission_id', permission_id);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (roleId, permissionId) => RolePermission.query().select(COLUMNS).findById([roleId, permissionId]);

const create = (data) => RolePermission.query().insert(data).returning(COLUMNS);

const remove = async (roleId, permissionId) => {
  const rolePermission = await RolePermission.query().deleteById([roleId, permissionId]).returning(COLUMNS);
  return rolePermission || null;
};

module.exports = { list, findById, create, remove };
