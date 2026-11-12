'use strict';

const db = require('../../db');
const Branch = require('./model');
const { COLUMNS } = require('./fields');
const { buildOrderBy, paginationMeta } = require('../../lib/list-query');
const { inBranches } = require('../../lib/data-scope');

const DEFAULT_SORT = [{ column: 'branch_id', order: 'asc' }];

const list = async ({ company_id, status, sort, page = 1, pageSize = 20 }, scope) => {
  const query = Branch.query().select(COLUMNS).orderBy(buildOrderBy(sort, COLUMNS, DEFAULT_SORT));
  inBranches(query, scope, 'branch_id');

  if (company_id !== undefined) query.where('company_id', company_id);
  if (status !== undefined) query.where('status', status);

  const { results, total } = await query.page(page - 1, pageSize);

  return { data: results, pagination: paginationMeta(page, pageSize, total) };
};

const findById = (branchId, scope) =>
  inBranches(Branch.query().select(COLUMNS).where('branch_id', branchId), scope, 'branch_id').first();

const create = (data) => Branch.query().insert(data).returning(COLUMNS);

const update = async (branchId, data, scope) => {
  const [branch] = await inBranches(Branch.query().where('branch_id', branchId), scope, 'branch_id')
    .patch({ ...data, updated_at: db.fn.now() })
    .returning(COLUMNS);
  return branch || null;
};

const remove = async (branchId, scope) => {
  const [branch] = await inBranches(Branch.query().where('branch_id', branchId), scope, 'branch_id')
    .patch({ status: 'inactive', updated_at: db.fn.now() })
    .returning(COLUMNS);
  return branch || null;
};

module.exports = { list, findById, create, update, remove };
