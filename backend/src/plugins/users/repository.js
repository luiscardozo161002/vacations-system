'use strict';

const db = require('../../db');
const User = require('./model');
const { SAFE_COLUMNS } = require('./fields');

const list = async ({ role_id, status, employee_id, page = 1, pageSize = 20 }) => {
  const query = User.query().select(SAFE_COLUMNS).orderBy('username');

  if (role_id !== undefined) query.where('role_id', role_id);
  if (status !== undefined) query.where('status', status);
  if (employee_id !== undefined) query.where('employee_id', employee_id);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: { page, pageSize, total } };
};

const findById = (userId) => User.query().select(SAFE_COLUMNS).findById(userId);

const create = (data) => User.query().insert(data).returning(SAFE_COLUMNS);

const update = async (userId, data) => {
  const [user] = await User.query()
    .where('user_id', userId)
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(SAFE_COLUMNS);
  return user || null;
};

const remove = async (userId) => {
  const [user] = await User.query()
    .where('user_id', userId)
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(SAFE_COLUMNS);
  return user || null;
};

module.exports = { list, findById, create, update, remove };
