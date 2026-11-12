'use strict';

const db = require('../../db');
const User = require('./model');
const { SAFE_COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');

const DEFAULT_SORT = [{ column: 'user_id', order: 'asc' }];

const list = async ({ role_id, status, employee_id, sort, page = 1, pageSize = 20 }) => {
  const query = User.query().select(SAFE_COLUMNS).orderBy(buildOrderBy(sort, SAFE_COLUMNS, DEFAULT_SORT));

  if (role_id !== undefined) query.where('role_id', role_id);
  if (status !== undefined) query.where('status', status);
  if (employee_id !== undefined) query.where('employee_id', employee_id);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
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

const BRANCH_COLUMNS = ['b.branch_id', 'b.company_id', 'b.code', 'b.branch_name'];

const findBranches = (userId) =>
  db('user_branches as ub')
    .join('branches as b', 'b.branch_id', 'ub.branch_id')
    .where('ub.user_id', userId)
    .orderBy('b.branch_id')
    .select(BRANCH_COLUMNS);

const replaceBranches = (userId, branchIds) =>
  db.transaction(async (trx) => {
    await trx('user_branches').where('user_id', userId).del();
    if (branchIds.length) {
      await trx('user_branches').insert(branchIds.map((branch_id) => ({ user_id: userId, branch_id })));
    }
  });

module.exports = { list, findById, create, update, remove, findBranches, replaceBranches };
