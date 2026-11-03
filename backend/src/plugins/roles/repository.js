'use strict';

const Role = require('./model');
const { COLUMNS } = require('./fields');

const list = async ({ status, page = 1, pageSize = 20 }) => {
  const query = Role.query().select(COLUMNS).orderBy('role_code');

  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (roleId) => Role.query().select(COLUMNS).findById(roleId);

const create = (data) => Role.query().insert(data).returning(COLUMNS);

const update = async (roleId, data) => {
  const [role] = await Role.query().where('role_id', roleId).patch(data).returning(COLUMNS);
  return role || null;
};

const remove = async (roleId) => {
  const [role] = await Role.query().where('role_id', roleId).patch({ status: 'inactive' }).returning(COLUMNS);
  return role || null;
};

module.exports = { list, findById, create, update, remove };
