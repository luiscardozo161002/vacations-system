'use strict';

const Permission = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ page = 1, pageSize = 20 }) => {
  const query = Permission.query().select(COLUMNS).orderBy('permission_code');

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (permissionId) => Permission.query().select(COLUMNS).findById(permissionId);

const create = (data) => Permission.query().insert(data).returning(COLUMNS);

const update = async (permissionId, data) => {
  const [permission] = await Permission.query().where('permission_id', permissionId).patch(data).returning(COLUMNS);
  return permission || null;
};

const remove = async (permissionId) => {
  const permission = await Permission.query().deleteById(permissionId).returning(COLUMNS);
  return permission || null;
};

module.exports = { list, findById, create, update, remove };
